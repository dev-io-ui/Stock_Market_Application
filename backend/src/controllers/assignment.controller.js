const Assignment = require('../models/assignment.model');
const Submission = require('../models/submission.model');
const AppError = require('../utils/app-error');
const catchAsync = require('../utils/catch-async');

exports.createAssignment = catchAsync(async (req, res) => {
  const assignment = await Assignment.create(req.body);
  res.status(201).json({
    status: 'success',
    data: assignment,
  });
});

exports.getAllAssignments = catchAsync(async (req, res) => {
  const filters = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(field => delete filters[field]);

  let query = Assignment.find(filters);

  // Sorting
  if (req.query.sort) {
    const sortBy = req.query.sort.split(',').join(' ');
    query = query.sort(sortBy);
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

  const assignments = await query;
  res.status(200).json({
    status: 'success',
    results: assignments.length,
    data: assignments,
  });
});

exports.getAssignment = catchAsync(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id)
    .populate('course')
    .populate('module');

  if (!assignment) {
    throw new AppError('Assignment not found', 404);
  }

  res.status(200).json({
    status: 'success',
    data: assignment,
  });
});

exports.updateAssignment = catchAsync(async (req, res) => {
  const assignment = await Assignment.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!assignment) {
    throw new AppError('Assignment not found', 404);
  }

  res.status(200).json({
    status: 'success',
    data: assignment,
  });
});

exports.deleteAssignment = catchAsync(async (req, res) => {
  const assignment = await Assignment.findByIdAndDelete(req.params.id);

  if (!assignment) {
    throw new AppError('Assignment not found', 404);
  }

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.submitAssignment = catchAsync(async (req, res) => {
  const assignment = await Assignment.findById(req.params.id);
  if (!assignment) {
    throw new AppError('Assignment not found', 404);
  }

  // Check if user has attempts remaining
  const attemptCount = await Submission.countDocuments({
    assignment: req.params.id,
    user: req.user.id,
  });

  if (attemptCount >= assignment.maxAttempts) {
    throw new AppError('Maximum attempts reached for this assignment', 400);
  }

  // Create submission
  const submission = await Submission.create({
    assignment: req.params.id,
    user: req.user.id,
    content: req.body.content,
    attempt: attemptCount + 1,
    maxScore: assignment.points,
    status: 'submitted',
  });

  // If automatic grading is enabled, grade the submission
  if (assignment.gradingType === 'automatic') {
    await gradeSubmission(submission, assignment);
  }

  res.status(201).json({
    status: 'success',
    data: submission,
  });
});

exports.gradeSubmission = catchAsync(async (req, res) => {
  const submission = await Submission.findById(req.params.submissionId);
  if (!submission) {
    throw new AppError('Submission not found', 404);
  }

  const assignment = await Assignment.findById(submission.assignment);
  if (!assignment) {
    throw new AppError('Assignment not found', 404);
  }

  // Update submission with grades and feedback
  submission.score = req.body.score;
  submission.feedback = req.body.feedback;
  submission.taskScores = req.body.taskScores;
  submission.status = 'graded';
  submission.gradedBy = req.user.id;
  submission.gradedAt = new Date();

  await submission.save();

  res.status(200).json({
    status: 'success',
    data: submission,
  });
});

exports.getSubmissions = catchAsync(async (req, res) => {
  const submissions = await Submission.find({
    assignment: req.params.id,
  })
    .populate('user', 'name email')
    .sort('-submittedAt');

  res.status(200).json({
    status: 'success',
    results: submissions.length,
    data: submissions,
  });
});

exports.getUserSubmissions = catchAsync(async (req, res) => {
  const submissions = await Submission.find({
    user: req.user.id,
  })
    .populate('assignment')
    .sort('-submittedAt');

  res.status(200).json({
    status: 'success',
    results: submissions.length,
    data: submissions,
  });
});

exports.requestRegrade = catchAsync(async (req, res) => {
  const submission = await Submission.findById(req.params.submissionId);
  if (!submission) {
    throw new AppError('Submission not found', 404);
  }

  if (submission.user.toString() !== req.user.id) {
    throw new AppError('You can only request regrade for your own submissions', 403);
  }

  submission.flags.push({
    type: 'regrade_requested',
    description: req.body.reason,
  });

  await submission.save();

  res.status(200).json({
    status: 'success',
    data: submission,
  });
});

// Helper function for automatic grading
async function gradeSubmission(submission, assignment) {
  let score = 0;
  const taskScores = [];

  // Implement automatic grading logic based on assignment type
  if (assignment.type === 'quiz') {
    // Grade quiz answers
    score = calculateQuizScore(submission.content, assignment.automaticGradingCriteria);
  } else if (assignment.type === 'analysis') {
    // Grade analysis using NLP or other criteria
    score = calculateAnalysisScore(submission.content, assignment.automaticGradingCriteria);
  }

  submission.score = score;
  submission.status = 'graded';
  submission.gradedAt = new Date();
  submission.taskScores = taskScores;

  await submission.save();
  return submission;
}

// Helper functions for specific grading types
function calculateQuizScore(submissionContent, criteria) {
  // Implement quiz scoring logic
  return 0;
}

function calculateAnalysisScore(submissionContent, criteria) {
  // Implement analysis scoring logic
  return 0;
}
