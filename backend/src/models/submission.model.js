const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: {
        type: String,
        enum: ['file', 'text', 'link', 'multiple'],
        required: true,
      },
      files: [{
        filename: String,
        originalname: String,
        mimetype: String,
        size: Number,
        url: String,
      }],
      text: String,
      links: [{
        title: String,
        url: String,
        description: String,
      }],
    },
    status: {
      type: String,
      enum: ['draft', 'submitted', 'graded', 'returned'],
      default: 'draft',
    },
    submittedAt: {
      type: Date,
    },
    isLate: {
      type: Boolean,
      default: false,
    },
    attempt: {
      type: Number,
      required: true,
      min: 1,
    },
    score: {
      type: Number,
      min: 0,
    },
    maxScore: {
      type: Number,
      required: true,
    },
    feedback: [{
      reviewer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      comment: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
      taskIndex: Number,
      criteriaIndex: Number,
      pointsAwarded: Number,
    }],
    taskScores: [{
      taskIndex: Number,
      score: Number,
      maxScore: Number,
      feedback: String,
    }],
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    gradedAt: {
      type: Date,
    },
    plagiarismScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    plagiarismDetails: {
      matches: [{
        similarity: Number,
        source: String,
        matchedText: String,
      }],
      report: String,
    },
    flags: [{
      type: {
        type: String,
        enum: ['late', 'plagiarism', 'regrade_requested', 'exceptional'],
      },
      description: String,
      createdAt: {
        type: Date,
        default: Date.now,
      },
      resolvedAt: Date,
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for percentage score
submissionSchema.virtual('percentageScore').get(function() {
  if (!this.score || !this.maxScore) return 0;
  return (this.score / this.maxScore) * 100;
});

// Virtual for grading status
submissionSchema.virtual('gradingStatus').get(function() {
  if (this.status === 'draft') return 'Not submitted';
  if (this.status === 'submitted') return 'Pending grading';
  if (this.status === 'graded') return 'Graded';
  if (this.status === 'returned') return 'Returned';
  return 'Unknown';
});

// Pre-save middleware to handle submission
submissionSchema.pre('save', async function(next) {
  if (this.isModified('status') && this.status === 'submitted') {
    this.submittedAt = new Date();
    
    // Check if submission is late
    const assignment = await mongoose.model('Assignment').findById(this.assignment);
    if (assignment && this.submittedAt > assignment.dueDate) {
      this.isLate = true;
      this.flags.push({
        type: 'late',
        description: 'Submission after due date',
      });
    }
  }
  next();
});

// Indexes for efficient querying
// submissionSchema.index({ assignment: 1, user: 1 });
// submissionSchema.index({ status: 1 });
// submissionSchema.index({ submittedAt: 1 });
// submissionSchema.index({ gradedAt: 1 });
// submissionSchema.index({ 'flags.type': 1 });

const Submission = mongoose.model('Submission', submissionSchema);
module.exports = Submission;
