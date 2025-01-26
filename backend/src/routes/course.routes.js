const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  createCourse,
  getAllCourses,
  getCourse,
  updateCourse,
  deleteCourse,
  enrollCourse,
  rateCourse
} = require('../controllers/course.controller');

// Public routes
router.get('/', getAllCourses);
router.get('/:id', getCourse);

// Protected routes
router.use(protect);

router.post('/enroll/:id', enrollCourse);
router.post('/rate/:id', rateCourse);

// Instructor and Admin only routes
router.use(restrictTo('instructor', 'admin'));

router
  .route('/')
  .post(createCourse);

router
  .route('/:id')
  .patch(updateCourse)
  .delete(deleteCourse);

module.exports = router;
