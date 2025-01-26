const mongoose = require('mongoose');

const forumSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Forum title is required'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Forum description is required']
  },
  category: {
    type: String,
    enum: ['general', 'stocks', 'forex', 'crypto', 'technical_analysis', 'fundamental_analysis', 'course_discussion'],
    required: true
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course'
  },
  author: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: [true, 'Forum content is required']
  },
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    filename: String,
    fileUrl: String,
    fileType: String,
    fileSize: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  replies: [{
    author: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String,
      required: true
    },
    attachments: [{
      filename: String,
      fileUrl: String,
      fileType: String,
      fileSize: Number
    }],
    upvotes: [{
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }],
    downvotes: [{
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }],
    isAnswer: {
      type: Boolean,
      default: false
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: Date
  }],
  upvotes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  downvotes: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'archived'],
    default: 'open'
  },
  isAnswered: {
    type: Boolean,
    default: false
  },
  lastActivity: {
    type: Date,
    default: Date.now
  },
  pinnedUntil: Date,
  moderatorNotes: [{
    moderator: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    note: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
// forumSchema.index({ title: 'text', content: 'text' });
// forumSchema.index({ category: 1 });
// forumSchema.index({ course: 1 });
// forumSchema.index({ author: 1 });
// forumSchema.index({ status: 1 });
// forumSchema.index({ isAnswered: 1 });
// forumSchema.index({ lastActivity: -1 });

// Virtual for reply count
forumSchema.virtual('replyCount').get(function() {
  return this.replies.length;
});

// Virtual for vote count
forumSchema.virtual('voteCount').get(function() {
  return this.upvotes.length - this.downvotes.length;
});

// Update last activity on new replies
forumSchema.pre('save', function(next) {
  if (this.isModified('replies')) {
    this.lastActivity = new Date();
    
    // Check if any reply is marked as answer
    this.isAnswered = this.replies.some(reply => reply.isAnswer);
  }
  next();
});

// Middleware to populate author details
forumSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'author',
    select: 'name profilePicture'
  });
  next();
});

const Forum = mongoose.model('Forum', forumSchema);

module.exports = Forum;
