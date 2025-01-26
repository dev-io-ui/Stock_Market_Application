const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Assignment description is required'],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
    },
    type: {
      type: String,
      enum: ['quiz', 'project', 'analysis', 'simulation'],
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: true,
    },
    dueDate: {
      type: Date,
      required: true,
    },
    points: {
      type: Number,
      required: true,
      min: 0,
    },
    tasks: [{
      title: String,
      description: String,
      points: Number,
      criteria: [{
        description: String,
        points: Number,
      }],
    }],
    resources: [{
      title: String,
      type: {
        type: String,
        enum: ['pdf', 'video', 'link', 'document'],
      },
      url: String,
      description: String,
    }],
    submissionType: {
      type: String,
      enum: ['file', 'text', 'link', 'multiple'],
      required: true,
    },
    allowedFileTypes: [{
      type: String,
    }],
    maxFileSize: {
      type: Number, // in bytes
    },
    maxAttempts: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    gradingType: {
      type: String,
      enum: ['automatic', 'manual', 'hybrid'],
      required: true,
    },
    automaticGradingCriteria: {
      type: mongoose.Schema.Types.Mixed,
    },
    reviewers: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    tags: [String],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for submission statistics
assignmentSchema.virtual('stats').get(function() {
  return {
    totalSubmissions: this.submissions?.length || 0,
    averageScore: this.submissions?.reduce((acc, curr) => acc + curr.score, 0) / (this.submissions?.length || 1),
    onTimeSubmissions: this.submissions?.filter(s => s.submittedAt <= this.dueDate).length || 0,
    lateSubmissions: this.submissions?.filter(s => s.submittedAt > this.dueDate).length || 0,
  };
});

// Virtual for total points
assignmentSchema.virtual('totalPoints').get(function() {
  return this.tasks.reduce((acc, task) => acc + task.points, 0);
});

// Pre-save middleware to validate points
assignmentSchema.pre('save', function(next) {
  const totalTaskPoints = this.tasks.reduce((acc, task) => acc + task.points, 0);
  if (totalTaskPoints !== this.points) {
    next(new Error('Total task points must equal assignment points'));
  }
  next();
});

// Indexes for efficient querying
// assignmentSchema.index({ course: 1, module: 1 });
// assignmentSchema.index({ dueDate: 1 });
// assignmentSchema.index({ status: 1 });
// assignmentSchema.index({ type: 1 });
// assignmentSchema.index({ difficulty: 1 });
// assignmentSchema.index({ tags: 1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);
module.exports = Assignment;
