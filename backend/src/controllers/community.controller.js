const Post = require('../models/post.model');
const Comment = require('../models/comment.model');
const { AppError } = require('../middleware/error-handler.middleware');
const logger = require('../utils/logger');

// Create a new post
exports.createPost = async (req, res, next) => {
  try {
    const post = await Post.create({
      ...req.body,
      author: req.user._id
    });

    res.status(201).json({
      status: 'success',
      data: {
        post
      }
    });
  } catch (error) {
    logger.error('Create post error:', error);
    next(new AppError(400, 'Failed to create post'));
  }
};

// Get all posts with pagination
exports.getAllPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await Post.find()
      .populate('author', 'name avatar')
      .sort('-createdAt')
      .skip(skip)
      .limit(limit);

    const total = await Post.countDocuments();

    res.status(200).json({
      status: 'success',
      results: posts.length,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      data: {
        posts
      }
    });
  } catch (error) {
    logger.error('Get posts error:', error);
    next(new AppError(400, 'Failed to fetch posts'));
  }
};

// Get a single post
exports.getPost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate('author', 'name avatar')
      .populate({
        path: 'comments',
        populate: {
          path: 'author',
          select: 'name avatar'
        }
      });

    if (!post) {
      return next(new AppError(404, 'Post not found'));
    }

    res.status(200).json({
      status: 'success',
      data: {
        post
      }
    });
  } catch (error) {
    logger.error('Get post error:', error);
    next(new AppError(400, 'Failed to fetch post'));
  }
};

// Update a post
exports.updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return next(new AppError(404, 'Post not found'));
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return next(new AppError(403, 'You can only update your own posts'));
    }

    const updatedPost = await Post.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('author', 'name avatar');

    res.status(200).json({
      status: 'success',
      data: {
        post: updatedPost
      }
    });
  } catch (error) {
    logger.error('Update post error:', error);
    next(new AppError(400, 'Failed to update post'));
  }
};

// Delete a post
exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return next(new AppError(404, 'Post not found'));
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return next(new AppError(403, 'You can only delete your own posts'));
    }

    await Post.findByIdAndDelete(req.params.id);
    await Comment.deleteMany({ post: req.params.id });

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    logger.error('Delete post error:', error);
    next(new AppError(400, 'Failed to delete post'));
  }
};

// Create a comment
exports.createComment = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.postId);

    if (!post) {
      return next(new AppError(404, 'Post not found'));
    }

    const comment = await Comment.create({
      content: req.body.content,
      author: req.user._id,
      post: req.params.postId
    });

    post.comments.push(comment._id);
    await post.save();

    const populatedComment = await Comment.findById(comment._id).populate(
      'author',
      'name avatar'
    );

    res.status(201).json({
      status: 'success',
      data: {
        comment: populatedComment
      }
    });
  } catch (error) {
    logger.error('Create comment error:', error);
    next(new AppError(400, 'Failed to create comment'));
  }
};

// Delete a comment
exports.deleteComment = async (req, res, next) => {
  try {
    const comment = await Comment.findById(req.params.commentId);

    if (!comment) {
      return next(new AppError(404, 'Comment not found'));
    }

    if (comment.author.toString() !== req.user._id.toString()) {
      return next(new AppError(403, 'You can only delete your own comments'));
    }

    await Comment.findByIdAndDelete(req.params.commentId);
    
    // Remove comment from post's comments array
    await Post.findByIdAndUpdate(comment.post, {
      $pull: { comments: req.params.commentId }
    });

    res.status(204).json({
      status: 'success',
      data: null
    });
  } catch (error) {
    logger.error('Delete comment error:', error);
    next(new AppError(400, 'Failed to delete comment'));
  }
};

// Like/Unlike a post
exports.toggleLike = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return next(new AppError(404, 'Post not found'));
    }

    const userId = req.user._id.toString();
    const likeIndex = post.likes.indexOf(userId);

    if (likeIndex === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(likeIndex, 1);
    }

    await post.save();

    res.status(200).json({
      status: 'success',
      data: {
        likes: post.likes.length,
        isLiked: likeIndex === -1
      }
    });
  } catch (error) {
    logger.error('Toggle like error:', error);
    next(new AppError(400, 'Failed to toggle like'));
  }
};
