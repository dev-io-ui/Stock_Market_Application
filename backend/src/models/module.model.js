const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Module title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Module description is required'],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
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
    lessons: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
    }],
    prerequisites: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
    }],
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    resources: [{
      title: String,
      type: {
        type: String,
        enum: ['pdf', 'video', 'link', 'document'],
      },
      url: String,
    }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for completion percentage
moduleSchema.virtual('completionPercentage').get(function() {
  if (!this.lessons || this.lessons.length === 0) return 0;
  const completedLessons = this.lessons.filter(lesson => lesson.completed).length;
  return (completedLessons / this.lessons.length) * 100;
});

// Pre-save middleware to ensure order is set
moduleSchema.pre('save', async function(next) {
  if (!this.order) {
    const lastModule = await this.constructor.findOne(
      { course: this.course },
      { order: 1 },
      { sort: { order: -1 } }
    );
    this.order = lastModule ? lastModule.order + 1 : 1;
  }
  next();
});

const Module = mongoose.model('Module', moduleSchema);
module.exports = Module;
