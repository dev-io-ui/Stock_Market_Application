const Lesson = require('../models/lesson.model');
const Module = require('../models/module.model');
const AppError = require('../utils/app-error');
const catchAsync = require('../utils/catch-async');

exports.createLesson = catchAsync(async (req, res) => {
  // Check if module exists
  const module = await Module.findById(req.body.module);
  if (!module) {
    throw new AppError('Module not found', 404);
  }

  const lesson = await Lesson.create(req.body);

  // Add lesson to module
  await Module.findByIdAndUpdate(
    req.body.module,
    { $push: { lessons: lesson._id } }
  );

  res.status(201).json({
    status: 'success',
    data: lesson,
  });
});

exports.getAllLessons = catchAsync(async (req, res) => {
  const filters = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(field => delete filters[field]);

  let query = Lesson.find(filters);

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
  } else {
    query = query.sort('order');
  }

  // Field limiting
  if (req.query.fields) {
    const fields = req.query.fields.split(',').join(' ');
    query = query.select(fields);
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  query = query.skip(skip).limit(limit);

  const lessons = await query;

  res.status(200).json({
    status: 'success',
    results: lessons.length,
    data: lessons,
  });
});

exports.getLesson = catchAsync(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id)
    .populate({
      path: 'prerequisites',
      select: 'title description',
    });

  if (!lesson) {
    throw new AppError('Lesson not found', 404);
  }

  // If user is authenticated, get their progress
  if (req.user) {
    lesson.userProgress = await getLessonProgress(lesson._id, req.user._id);
  }

  res.status(200).json({
    status: 'success',
    data: lesson,
  });
});

exports.updateLesson = catchAsync(async (req, res) => {
  const lesson = await Lesson.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!lesson) {
    throw new AppError('Lesson not found', 404);
  }

  res.status(200).json({
    status: 'success',
    data: lesson,
  });
});

exports.deleteLesson = catchAsync(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  
  if (!lesson) {
    throw new AppError('Lesson not found', 404);
  }

  // Remove lesson reference from module
  await Module.findByIdAndUpdate(
    lesson.module,
    { $pull: { lessons: lesson._id } }
  );

  // Delete the lesson
  await lesson.remove();

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.reorderLessons = catchAsync(async (req, res) => {
  const { moduleId, lessonOrder } = req.body;

  // Validate module exists
  const module = await Module.findById(moduleId);
  if (!module) {
    throw new AppError('Module not found', 404);
  }

  // Update order for each lesson
  const updatePromises = lessonOrder.map((lessonId, index) => 
    Lesson.findByIdAndUpdate(lessonId, { order: index + 1 })
  );

  await Promise.all(updatePromises);

  res.status(200).json({
    status: 'success',
    message: 'Lessons reordered successfully',
  });
});

exports.markLessonComplete = catchAsync(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  
  if (!lesson) {
    throw new AppError('Lesson not found', 404);
  }

  // Validate completion criteria
  const isValid = await validateCompletionCriteria(lesson, req.body);
  if (!isValid) {
    throw new AppError('Completion criteria not met', 400);
  }

  // Record completion
  const completion = {
    user: req.user._id,
    lesson: lesson._id,
    completedAt: new Date(),
    score: req.body.score,
    timeSpent: req.body.timeSpent,
    completed: true,
  };

  // Update or create completion record
  await Lesson.findOneAndUpdate(
    {
      _id: lesson._id,
      'completions.user': req.user._id,
    },
    {
      $set: { 'completions.$': completion },
    },
    {
      new: true,
      upsert: true,
    }
  );

  res.status(200).json({
    status: 'success',
    message: 'Lesson marked as complete',
  });
});

exports.getLessonProgress = catchAsync(async (req, res) => {
  const progress = await getLessonProgress(req.params.id, req.user._id);

  res.status(200).json({
    status: 'success',
    data: progress,
  });
});

exports.submitQuizAnswer = catchAsync(async (req, res) => {
  const lesson = await Lesson.findById(req.params.id);
  
  if (!lesson) {
    throw new AppError('Lesson not found', 404);
  }

  if (lesson.content.type !== 'quiz') {
    throw new AppError('This lesson does not contain a quiz', 400);
  }

  const { answers } = req.body;
  const score = calculateQuizScore(answers, lesson.content.quizQuestions);

  // Record quiz attempt
  const attempt = {
    user: req.user._id,
    answers,
    score,
    submittedAt: new Date(),
  };

  await Lesson.findByIdAndUpdate(
    req.params.id,
    { $push: { 'attempts': attempt } }
  );

  // Check if score meets completion criteria
  if (score >= lesson.completionCriteria.minimumScore) {
    await markLessonComplete(lesson._id, req.user._id, score);
  }

  res.status(200).json({
    status: 'success',
    data: {
      score,
      passed: score >= lesson.completionCriteria.minimumScore,
    },
  });
});

// Helper functions

async function getLessonProgress(lessonId, userId) {
  const lesson = await Lesson.findById(lessonId)
    .select('completions attempts')
    .lean();

  if (!lesson) return null;

  const userCompletions = lesson.completions?.filter(
    c => c.user.toString() === userId.toString()
  ) || [];

  const userAttempts = lesson.attempts?.filter(
    a => a.user.toString() === userId.toString()
  ) || [];

  return {
    completed: userCompletions.length > 0,
    completedAt: userCompletions[0]?.completedAt,
    attempts: userAttempts.length,
    bestScore: Math.max(...userAttempts.map(a => a.score), 0),
    lastAttemptAt: userAttempts[userAttempts.length - 1]?.submittedAt,
  };
}

async function validateCompletionCriteria(lesson, data) {
  switch (lesson.completionCriteria.type) {
    case 'watch':
      return data.timeSpent >= lesson.completionCriteria.requiredTime;
    case 'read':
      return data.timeSpent >= lesson.completionCriteria.requiredTime;
    case 'quiz':
      return data.score >= lesson.completionCriteria.minimumScore;
    case 'exercise':
      return data.completed && data.score >= lesson.completionCriteria.minimumScore;
    default:
      return false;
  }
}

function calculateQuizScore(userAnswers, questions) {
  let correctAnswers = 0;
  questions.forEach((question, index) => {
    if (userAnswers[index] === question.correctAnswer) {
      correctAnswers++;
    }
  });
  return (correctAnswers / questions.length) * 100;
}

async function markLessonComplete(lessonId, userId, score) {
  const completion = {
    user: userId,
    completedAt: new Date(),
    score,
    completed: true,
  };

  await Lesson.findByIdAndUpdate(
    lessonId,
    { $push: { completions: completion } }
  );
}
