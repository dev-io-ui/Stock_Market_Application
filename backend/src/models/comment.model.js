const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, 'A comment must have content'],
      trim: true,
      maxlength: [500, 'A comment must have less than 500 characters']
    },
    author: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'A comment must have an author']
    },
    post: {
      type: mongoose.Schema.ObjectId,
      ref: 'Post',
      required: [true, 'A comment must belong to a post']
    },
    likes: [{
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
// commentSchema.index({ post: 1, createdAt: -1 });
// commentSchema.index({ author: 1 });

// Virtual populate
commentSchema.virtual('likesCount').get(function() {
  return this.likes.length;
});

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
