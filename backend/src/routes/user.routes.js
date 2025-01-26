const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  register,
  login,
  logout,
  forgotPassword,
  resetPassword,
  updatePassword,
  getMe,
  updateMe,
  deleteMe,
  getAllUsers,
  getUser,
  updateUser,
  deleteUser,
  verifyEmail,
} = require('../controllers/user.controller');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.patch('/reset-password/:token', resetPassword);
router.get('/verify-email/:token', verifyEmail);

// Protected routes (require authentication)
router.use(protect);

router.get('/me', getMe);
router.patch('/update-me', updateMe);
router.delete('/delete-me', deleteMe);
router.post('/logout', logout);
router.patch('/update-password', updatePassword);

// Admin only routes
router.use(restrictTo('admin'));

router
  .route('/')
  .get(getAllUsers);

router
  .route('/:id')
  .get(getUser)
  .patch(updateUser)
  .delete(deleteUser);

module.exports = router;
