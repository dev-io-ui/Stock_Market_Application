const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'A post must have a title'],
      trim: true,
      maxlength: [100, 'A post title must have less than 100 characters']
    },
    content: {
      type: String,
      required: [true, 'A post must have content'],
      trim: true
    },
    author: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A post must have an author']
    },
    category: {
      type: String,
      required: [true, 'A post must have a category'],
      enum: ['general', 'analysis', 'news', 'discussion']
    },
    tags: [{
      type: String,
      trim: true
    }],
    likes: [{
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }],
    comments: [{
      type: mongoose.Schema.ObjectId,
      ref: 'Comment'
    }],
    views: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
// postSchema.index({ author: 1, createdAt: -1 });
// postSchema.index({ category: 1 });
// postSchema.index({ tags: 1 });

// Virtual populate
postSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

postSchema.virtual('commentsCount').get(function() {
  return this.comments.length;
});

const Post = mongoose.model('Post', postSchema);

module.exports = Post;
