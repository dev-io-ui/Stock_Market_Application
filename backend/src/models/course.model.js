const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Course title is required'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    required: [true, 'Course description is required']
  },
  instructor: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Course must belong to an instructor']
  },
  level: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    required: [true, 'Course level is required']
  },
  category: {
    type: String,
    enum: ['stocks', 'forex', 'crypto', 'options', 'technical_analysis', 'fundamental_analysis'],
    required: [true, 'Course category is required']
  },
  price: {
    type: Number,
    required: [true, 'Course price is required']
  },
  duration: {
    type: Number, // in minutes
    required: [true, 'Course duration is required']
  },
  modules: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    lessons: [{
      title: {
        type: String,
        required: true
      },
      content: {
        type: String,
        required: true
      },
      videoUrl: String,
      duration: Number,
      resources: [{
        title: String,
        fileUrl: String,
        type: {
          type: String,
          enum: ['pdf', 'video', 'document', 'link']
        }
      }],
      quiz: {
        questions: [{
          question: String,
          options: [String],
          correctAnswer: Number,
          explanation: String
        }]
      }
    }]
  }],
  thumbnail: {
    type: String,
    default: 'default-course.jpg'
  },
  ratings: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  averageRating: {
    type: Number,
    default: 0
  },
  enrolledStudents: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }],
  prerequisites: [{
    type: String
  }],
  learningOutcomes: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'archived'],
    default: 'draft'
  },
  featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
// courseSchema.index({ title: 1 });
// courseSchema.index({ category: 1 });
// courseSchema.index({ instructor: 1 });
// courseSchema.index({ status: 1 });

// Virtual populate for course progress
courseSchema.virtual('progress', {
  ref: 'Progress',
  foreignField: 'course',
  localField: '_id'
});

// Calculate average rating
courseSchema.pre('save', function(next) {
  if (this.ratings.length > 0) {
    this.averageRating = this.ratings.reduce((acc, item) => acc + item.rating, 0) / this.ratings.length;
  }
  next();
});

const Course = mongoose.model('Course', courseSchema);

module.exports = Course;
