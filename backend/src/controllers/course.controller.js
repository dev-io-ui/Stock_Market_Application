const Course = require('../models/course.model');
const Progress = require('../models/progress.model');
const { AppError } = require('../middleware/error-handler.middleware');
const logger = require('../utils/logger');

// Create a new course
exports.createCourse = async (req, res, next) => {
  try {
    const course = await Course.create({
      ...req.body,
      instructor: req.user._id || 1
    });

    res.status(201).json({
      status: 'success',
      data: {
        course
      }
    });
  } catch (error) {
    logger.error('Error creating course:', error);
    next(new AppError(400, 'Failed to create course'));
  }
};

// Get all courses with filters
exports.getAllCourses = async (req, res, next) => {
  try {
    const queryObj = { ...req.query };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(field => delete queryObj[field]);

    // Advanced filtering
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`);

    let query = Course.find(JSON.parse(queryStr));

    // Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
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

    // Execute query
    const courses = await query;

    res.status(200).json({
      status: 'success',
      results: courses.length,
      data: {
        courses
      }
    });
  } catch (error) {
    logger.error('Error fetching courses:', error);
    next(new AppError(400, 'Failed to fetch courses'));
  }
};

// Get single course
exports.getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email profilePicture')
      .populate('ratings.user', 'name profilePicture');

    if (!course) {
      return next(new AppError(404, 'Course not found'));
    }

    // If user is enrolled, get their progress
    let progress = null;
    if (req.user) {
      progress = await Progress.findOne({
        user: req.user._id,
        course: course._id
      });
    }

    res.status(200).json({
      status: 'success',
      data: {
        course,
        progress
      }
    });
  } catch (error) {
    logger.error('Error fetching course:', error);
    next(new AppError(400, 'Failed to fetch course'));
  }
};

// Update course
exports.updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return next(new AppError(404, 'Course not found'));
    }

    // Check if user is instructor or admin
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError(403, 'You are not authorized to update this course'));
    }

    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      status: 'success',
      data: {
        course: updatedCourse
      }
    });
  } catch (error) {
    logger.error('Error updating course:', error);
    next(new AppError(400, 'Failed to update course'));
  }
};

// Delete course
exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return next(new AppError(404, 'Course not found'));
    }

    // Check if user is instructor or admin
    if (course.instructor.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError(403, 'You are not authorized to delete this course'));
    }

    await Course.findByIdAndDelete(req.params.id);

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    logger.error('Error deleting course:', error);
    next(new AppError(400, 'Failed to delete course'));
  }
};

// Enroll in course
exports.enrollCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return next(new AppError(404, 'Course not found'));
    }

    // Check if user is already enrolled
    if (course.enrolledStudents.includes(req.user._id)) {
      return next(new AppError(400, 'You are already enrolled in this course'));
    }

    // Add user to enrolled students
    course.enrolledStudents.push(req.user._id);
    await course.save();

    // Create progress record
    await Progress.create({
      user: req.user._id,
      course: course._id
    });

    res.status(200).json({
      status: 'success',
      message: 'Successfully enrolled in course'
    });
  } catch (error) {
    logger.error('Error enrolling in course:', error);
    next(new AppError(400, 'Failed to enroll in course'));
  }
};

// Rate course
exports.rateCourse = async (req, res, next) => {
  try {
    const { rating, review } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return next(new AppError(404, 'Course not found'));
    }

    // Check if user is enrolled
    if (!course.enrolledStudents.includes(req.user._id)) {
      return next(new AppError(403, 'You must be enrolled to rate this course'));
    }

    // Check if user has already rated
    const existingRating = course.ratings.find(
      r => r.user.toString() === req.user._id.toString()
    );

    if (existingRating) {
      existingRating.rating = rating;
      existingRating.review = review;
    } else {
      course.ratings.push({
        user: req.user._id,
        rating,
        review
      });
    }

    await course.save();

    res.status(200).json({
      status: 'success',
      message: 'Rating submitted successfully'
    });
  } catch (error) {
    logger.error('Error rating course:', error);
    next(new AppError(400, 'Failed to submit rating'));
  }
};
