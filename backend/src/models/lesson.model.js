const mongoose = require('mongoose');

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Lesson description is required'],
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
    },
    order: {
      type: Number,
      required: true,
    },
    duration: {
      type: Number, // in minutes
      required: true,
    },
    content: {
      type: {
        type: String,
        enum: ['video', 'text', 'quiz', 'interactive'],
        required: true,
      },
      videoUrl: String,
      textContent: String,
      quizQuestions: [{
        question: String,
        options: [String],
        correctAnswer: Number,
        explanation: String,
      }],
      interactiveElements: [{
        type: {
          type: String,
          enum: ['chart', 'simulation', 'exercise'],
        },
        config: mongoose.Schema.Types.Mixed,
      }],
    },
    resources: [{
      title: String,
      type: {
        type: String,
        enum: ['pdf', 'video', 'link', 'document'],
      },
      url: String,
      description: String,
    }],
    prerequisites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
    }],
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    completionCriteria: {
      type: {
        type: String,
        enum: ['watch', 'read', 'quiz', 'exercise'],
        required: true,
      },
      minimumScore: {
        type: Number,
        min: 0,
        max: 100,
        default: 80,
      },
      requiredTime: Number, // in seconds
    },
    tags: [String],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for completion status
lessonSchema.virtual('completionStats').get(function() {
  return {
    totalAttempts: this.attempts?.length || 0,
    averageScore: this.attempts?.reduce((acc, curr) => acc + curr.score, 0) / (this.attempts?.length || 1),
    bestScore: Math.max(...(this.attempts?.map(a => a.score) || [0])),
    completed: this.attempts?.some(a => a.score >= this.completionCriteria.minimumScore) || false,
  };
});

// Pre-save middleware to ensure order is set
lessonSchema.pre('save', async function(next) {
  if (!this.order) {
    const lastLesson = await this.constructor.findOne(
      { module: this.module },
      { order: 1 },
      { sort: { order: -1 } }
    );
    this.order = lastLesson ? lastLesson.order + 1 : 1;
  }
  next();
});

// Index for efficient querying
// lessonSchema.index({ module: 1, order: 1 });
// lessonSchema.index({ status: 1 });
// lessonSchema.index({ tags: 1 });

const Lesson = mongoose.model('Lesson', lessonSchema);
module.exports = Lesson;
