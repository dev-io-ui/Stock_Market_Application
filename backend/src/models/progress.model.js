const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: [true, 'Progress must belong to a user']
  },
  course: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: [true, 'Progress must belong to a course']
  },
  moduleProgress: [{
    moduleId: {
      type: mongoose.Schema.ObjectId,
      required: true
    },
    lessonProgress: [{
      lessonId: {
        type: mongoose.Schema.ObjectId,
        required: true
      },
      completed: {
        type: Boolean,
        default: false
      },
      timeSpent: Number, // in minutes
      lastAccessed: Date,
      quizResults: {
        score: Number,
        totalQuestions: Number,
        correctAnswers: Number,
        attempts: [{
          date: Date,
          score: Number,
          timeSpent: Number
        }]
      }
    }],
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  }],
  overallProgress: {
    type: Number, // Percentage of course completed
    default: 0
  },
  quizScores: {
    average: Number,
    highest: Number,
    lowest: Number
  },
  certificateEarned: {
    type: Boolean,
    default: false
  },
  certificateId: String,
  certificateUrl: String,
  lastAccessed: {
    type: Date,
    default: Date.now
  },
  completedAt: Date,
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'archived'],
    default: 'not_started'
  },
  notes: [{
    lessonId: {
      type: mongoose.Schema.ObjectId,
      required: true
    },
    content: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  bookmarks: [{
    lessonId: {
      type: mongoose.Schema.ObjectId,
      required: true
    },
    timestamp: Number, // For video content
    note: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
// progressSchema.index({ user: 1, course: 1 }, { unique: true });
// progressSchema.index({ status: 1 });
// progressSchema.index({ certificateEarned: 1 });

// Calculate overall progress
progressSchema.methods.calculateOverallProgress = function() {
  if (!this.moduleProgress.length) return 0;

  const totalLessons = this.moduleProgress.reduce((acc, module) => 
    acc + module.lessonProgress.length, 0);
  
  const completedLessons = this.moduleProgress.reduce((acc, module) => 
    acc + module.lessonProgress.filter(lesson => lesson.completed).length, 0);

  return (completedLessons / totalLessons) * 100;
};

// Update quiz scores
progressSchema.methods.updateQuizScores = function() {
  const allScores = this.moduleProgress.reduce((acc, module) => {
    const moduleScores = module.lessonProgress.reduce((lessonAcc, lesson) => {
      if (lesson.quizResults && lesson.quizResults.score) {
        lessonAcc.push(lesson.quizResults.score);
      }
      return lessonAcc;
    }, []);
    return [...acc, ...moduleScores];
  }, []);

  if (allScores.length > 0) {
    this.quizScores = {
      average: allScores.reduce((a, b) => a + b) / allScores.length,
      highest: Math.max(...allScores),
      lowest: Math.min(...allScores)
    };
  }
};

// Pre-save middleware
progressSchema.pre('save', function(next) {
  this.overallProgress = this.calculateOverallProgress();
  this.updateQuizScores();
  
  if (this.overallProgress === 100 && !this.completedAt) {
    this.completedAt = new Date();
    this.status = 'completed';
  }
  
  next();
});

const Progress = mongoose.model('Progress', progressSchema);

module.exports = Progress;
