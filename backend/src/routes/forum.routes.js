const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/auth.middleware');
const {
  createPost,
  getAllPosts,
  getPost,
  updatePost,
  addReply,
  markAsAnswer,
  vote
} = require('../controllers/forum.controller');

// Public routes
router.get('/', getAllPosts);
router.get('/:id', getPost);

// Protected routes
router.use(protect);

router.post('/', createPost);
router.patch('/:id', updatePost);
router.post('/:id/reply', addReply);
router.patch('/:postId/reply/:replyId/mark-answer', markAsAnswer);
router.post('/:type/:target/vote', vote);

// Moderator and Admin routes
router.use(restrictTo('moderator', 'admin'));

// Add moderator-specific routes here

module.exports = router;
