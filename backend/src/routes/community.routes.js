const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth.middleware');
const {
  createPost,
  getAllPosts,
  getPost,
  updatePost,
  deletePost,
  createComment,
  deleteComment,
  toggleLike
} = require('../controllers/community.controller');

// All routes are protected
router.use(protect);

// Post routes
router
  .route('/')
  .post(createPost)
  .get(getAllPosts);

router
  .route('/:id')
  .get(getPost)
  .patch(updatePost)
  .delete(deletePost);

// Comment routes
router
  .route('/:postId/comments')
  .post(createComment);

router
  .route('/:postId/comments/:commentId')
  .delete(deleteComment);

// Like routes
router
  .route('/:id/like')
  .post(toggleLike);

module.exports = router;
