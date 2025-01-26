const Module = require('../models/module.model');
const Course = require('../models/course.model');
const AppError = require('../utils/app-error');
const catchAsync = require('../utils/catch-async');

exports.createModule = catchAsync(async (req, res) => {
  // Check if course exists
  const course = await Course.findById(req.body.course);
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  const module = await Module.create(req.body);

  // Add module to course
  await Course.findByIdAndUpdate(
    req.body.course,
    { $push: { modules: module._id } }
  );

  res.status(201).json({
    status: 'success',
    data: module,
  });
});

exports.getAllModules = catchAsync(async (req, res) => {
  const filters = { ...req.query };
  const excludedFields = ['page', 'sort', 'limit', 'fields'];
  excludedFields.forEach(field => delete filters[field]);

  let query = Module.find(filters);

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

  // Execute query with populated lessons
  const modules = await query.populate({
    path: 'lessons',
    select: 'title description duration status',
  });

  res.status(200).json({
    status: 'success',
    results: modules.length,
    data: modules,
  });
});

exports.getModule = catchAsync(async (req, res) => {
  const module = await Module.findById(req.params.id)
    .populate({
      path: 'lessons',
      select: 'title description duration status content resources',
    })
    .populate({
      path: 'prerequisites',
      select: 'title description',
    });

  if (!module) {
    throw new AppError('Module not found', 404);
  }

  res.status(200).json({
    status: 'success',
    data: module,
  });
});

exports.updateModule = catchAsync(async (req, res) => {
  const module = await Module.findByIdAndUpdate(
    req.params.id,
    req.body,
    {
      new: true,
      runValidators: true,
    }
  );

  if (!module) {
    throw new AppError('Module not found', 404);
  }

  res.status(200).json({
    status: 'success',
    data: module,
  });
});

exports.deleteModule = catchAsync(async (req, res) => {
  const module = await Module.findById(req.params.id);
  
  if (!module) {
    throw new AppError('Module not found', 404);
  }

  // Remove module reference from course
  await Course.findByIdAndUpdate(
    module.course,
    { $pull: { modules: module._id } }
  );

  // Delete the module
  await module.remove();

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.reorderModules = catchAsync(async (req, res) => {
  const { courseId, moduleOrder } = req.body;

  // Validate course exists
  const course = await Course.findById(courseId);
  if (!course) {
    throw new AppError('Course not found', 404);
  }

  // Update order for each module
  const updatePromises = moduleOrder.map((moduleId, index) => 
    Module.findByIdAndUpdate(moduleId, { order: index + 1 })
  );

  await Promise.all(updatePromises);

  res.status(200).json({
    status: 'success',
    message: 'Modules reordered successfully',
  });
});

exports.getModuleProgress = catchAsync(async (req, res) => {
  const module = await Module.findById(req.params.id)
    .populate({
      path: 'lessons',
      select: 'title status completionCriteria',
      populate: {
        path: 'completions',
        match: { user: req.user._id },
      },
    });

  if (!module) {
    throw new AppError('Module not found', 404);
  }

  const progress = {
    totalLessons: module.lessons.length,
    completedLessons: module.lessons.filter(lesson => 
      lesson.completions && lesson.completions.length > 0
    ).length,
    inProgressLessons: module.lessons.filter(lesson =>
      lesson.completions && lesson.completions.some(c => !c.completed)
    ).length,
  };

  progress.percentageComplete = 
    (progress.completedLessons / progress.totalLessons) * 100;

  res.status(200).json({
    status: 'success',
    data: {
      moduleId: module._id,
      title: module.title,
      progress,
    },
  });
});

exports.getPrerequisiteStatus = catchAsync(async (req, res) => {
  const module = await Module.findById(req.params.id)
    .populate({
      path: 'prerequisites',
      select: 'title',
      populate: {
        path: 'lessons',
        select: 'completions',
        populate: {
          path: 'completions',
          match: { user: req.user._id },
        },
      },
    });

  if (!module) {
    throw new AppError('Module not found', 404);
  }

  const prerequisiteStatus = module.prerequisites.map(prereq => {
    const totalLessons = prereq.lessons.length;
    const completedLessons = prereq.lessons.filter(lesson =>
      lesson.completions && lesson.completions.length > 0 &&
      lesson.completions[0].completed
    ).length;

    return {
      moduleId: prereq._id,
      title: prereq.title,
      completed: completedLessons === totalLessons,
      progress: (completedLessons / totalLessons) * 100,
    };
  });

  res.status(200).json({
    status: 'success',
    data: prerequisiteStatus,
  });
});
