const Forum = require('../models/forum.model');
const { AppError } = require('../middleware/error-handler.middleware');
const logger = require('../utils/logger');

// Create a new forum post
exports.createPost = async (req, res, next) => {
  try {
    const post = await Forum.create({
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
    logger.error('Error creating forum post:', error);
    next(new AppError(400, 'Failed to create forum post'));
  }
};

// Get all forum posts with filters
exports.getAllPosts = async (req, res, next) => {
  try {
    const {
      category,
      course,
      author,
      status,
      isAnswered,
      search,
      sort = '-createdAt',
      page = 1,
      limit = 10
    } = req.query;

    const query = {};

    // Apply filters
    if (category) query.category = category;
    if (course) query.course = course;
    if (author) query.author = author;
    if (status) query.status = status;
    if (isAnswered !== undefined) query.isAnswered = isAnswered;

    // Search in title and content
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const posts = await Forum.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('author', 'name profilePicture')
      .populate('replies.author', 'name profilePicture');

    const total = await Forum.countDocuments(query);

    res.status(200).json({
      status: 'success',
      results: posts.length,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      },
      data: {
        posts
      }
    });
  } catch (error) {
    logger.error('Error fetching forum posts:', error);
    next(new AppError(400, 'Failed to fetch forum posts'));
  }
};

// Get single forum post
exports.getPost = async (req, res, next) => {
  try {
    const post = await Forum.findById(req.params.id)
      .populate('author', 'name profilePicture')
      .populate('replies.author', 'name profilePicture')
      .populate('course', 'title');

    if (!post) {
      return next(new AppError(404, 'Forum post not found'));
    }

    // Increment view count
    post.views += 1;
    await post.save();

    res.status(200).json({
      status: 'success',
      data: {
        post
      }
    });
  } catch (error) {
    logger.error('Error fetching forum post:', error);
    next(new AppError(400, 'Failed to fetch forum post'));
  }
};

// Update forum post
exports.updatePost = async (req, res, next) => {
  try {
    const post = await Forum.findById(req.params.id);

    if (!post) {
      return next(new AppError(404, 'Forum post not found'));
    }

    // Check if user is author or admin
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError(403, 'You are not authorized to update this post'));
    }

    const updatedPost = await Forum.findByIdAndUpdate(
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
        post: updatedPost
      }
    });
  } catch (error) {
    logger.error('Error updating forum post:', error);
    next(new AppError(400, 'Failed to update forum post'));
  }
};

// Add reply to post
exports.addReply = async (req, res, next) => {
  try {
    const post = await Forum.findById(req.params.id);

    if (!post) {
      return next(new AppError(404, 'Forum post not found'));
    }

    const reply = {
      author: req.user._id,
      content: req.body.content,
      attachments: req.body.attachments
    };

    post.replies.push(reply);
    post.lastActivity = new Date();
    await post.save();

    // Populate the newly added reply
    const populatedPost = await Forum.findById(post._id)
      .populate('replies.author', 'name profilePicture');

    res.status(200).json({
      status: 'success',
      data: {
        reply: populatedPost.replies[populatedPost.replies.length - 1]
      }
    });
  } catch (error) {
    logger.error('Error adding reply:', error);
    next(new AppError(400, 'Failed to add reply'));
  }
};

// Mark reply as answer
exports.markAsAnswer = async (req, res, next) => {
  try {
    const post = await Forum.findById(req.params.postId);

    if (!post) {
      return next(new AppError(404, 'Forum post not found'));
    }

    // Check if user is author or admin
    if (post.author.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return next(new AppError(403, 'Only the post author can mark an answer'));
    }

    const reply = post.replies.id(req.params.replyId);
    if (!reply) {
      return next(new AppError(404, 'Reply not found'));
    }

    // Unmark any previously marked answer
    post.replies.forEach(r => {
      r.isAnswer = false;
    });

    reply.isAnswer = true;
    post.isAnswered = true;
    await post.save();

    res.status(200).json({
      status: 'success',
      message: 'Reply marked as answer'
    });
  } catch (error) {
    logger.error('Error marking answer:', error);
    next(new AppError(400, 'Failed to mark answer'));
  }
};

// Vote on post or reply
exports.vote = async (req, res, next) => {
  try {
    const { type, target } = req.params; // type: 'post' or 'reply'
    const { voteType } = req.body; // 'upvote' or 'downvote'

    const post = await Forum.findById(
      type === 'reply' ? req.body.postId : target
    );

    if (!post) {
      return next(new AppError(404, 'Forum post not found'));
    }

    let targetDoc = type === 'post' ? post : post.replies.id(target);
    if (!targetDoc) {
      return next(new AppError(404, 'Target not found'));
    }

    const userId = req.user._id.toString();

    // Remove existing votes
    targetDoc.upvotes = targetDoc.upvotes.filter(id => id.toString() !== userId);
    targetDoc.downvotes = targetDoc.downvotes.filter(id => id.toString() !== userId);

    // Add new vote
    if (voteType === 'upvote') {
      targetDoc.upvotes.push(req.user._id);
    } else if (voteType === 'downvote') {
      targetDoc.downvotes.push(req.user._id);
    }

    await post.save();

    res.status(200).json({
      status: 'success',
      data: {
        upvotes: targetDoc.upvotes.length,
        downvotes: targetDoc.downvotes.length
      }
    });
  } catch (error) {
    logger.error('Error voting:', error);
    next(new AppError(400, 'Failed to register vote'));
  }
};
