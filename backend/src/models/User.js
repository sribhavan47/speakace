import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { logger } from '../utils/logger.js';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  firstName: {
    type: String,
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  profilePicture: {
    type: String,
    default: null
  },
  isActive: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'instructor'],
    default: 'user'
  },
  preferences: {
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner'
    },
    gameSettings: {
      rapidFire: {
        timerDuration: { type: Number, default: 5, min: 2, max: 10 },
        promptsCount: { type: Number, default: 10, min: 5, max: 25 }
      },
      conductor: {
        sessionDuration: { type: Number, default: 60, min: 30, max: 300 },
        energyChanges: { type: Number, default: 8, min: 5, max: 15 }
      },
      tripleStep: {
        sessionDuration: { type: Number, default: 90, min: 60, max: 300 },
        wordFrequency: { type: Number, default: 10, min: 5, max: 20 }
      }
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true }
    }
  },
  stats: {
    totalGamesPlayed: { type: Number, default: 0 },
    totalTimeSpent: { type: Number, default: 0 }, // in seconds
    averageScore: { type: Number, default: 0 },
    bestScores: {
      rapidFire: { type: Number, default: 0 },
      conductor: { type: Number, default: 0 },
      tripleStep: { type: Number, default: 0 }
    },
    streaks: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 }
    },
    averageConfidence: { type: Number, default: 0 }
  },
  achievements: [{
    type: {
      type: String,
      enum: ['first_game', 'streak_5', 'streak_10', 'perfect_score', 'speed_demon', 'energy_master', 'integration_expert']
    },
    unlockedAt: { type: Date, default: Date.now },
    description: String
  }],
  lastActive: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim() || this.username;
});

// Virtual for total score
userSchema.virtual('totalScore').get(function() {
  return Object.values(this.stats.bestScores).reduce((sum, score) => sum + score, 0);
});

// Index for better query performance (email and username are already indexed via unique: true)
userSchema.index({ 'stats.totalGamesPlayed': -1 });
userSchema.index({ 'stats.averageScore': -1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  logger.info('Password hashing started for user:', this.username);
  
  try {
    const salt = await bcrypt.genSalt(12);
    logger.info('Salt generated successfully for user:', this.username);
    
    this.password = await bcrypt.hash(this.password, salt);
    logger.info('Password hashed successfully for user:', this.username);
    
    next();
  } catch (error) {
    logger.error('Error hashing password for user:', this.username, error);
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to update stats
userSchema.methods.updateStats = function(gameType, score, duration) {
  this.stats.totalGamesPlayed += 1;
  this.stats.totalTimeSpent += duration;
  
  // Map game types to stat keys
  const gameTypeKey = gameType === 'rapidFire' ? 'rapidFire' : 
                     gameType === 'conductor' ? 'conductor' : 
                     gameType === 'tripleStep' ? 'tripleStep' : gameType;
  
  // Update best score for the game type
  if (!this.stats.bestScores[gameTypeKey]) {
    this.stats.bestScores[gameTypeKey] = 0;
  }
  
  if (score > this.stats.bestScores[gameTypeKey]) {
    this.stats.bestScores[gameTypeKey] = score;
  }
  
  // Update average score
  const totalScore = Object.values(this.stats.bestScores).reduce((sum, s) => sum + s, 0);
  this.stats.averageScore = totalScore / Object.keys(this.stats.bestScores).length;
  
  // Update average confidence
  if (this.stats.averageConfidence === undefined) {
    this.stats.averageConfidence = 0;
  }
  this.stats.averageConfidence = (this.stats.averageConfidence + (score / 100)) / 2;
  
  // Update last active
  this.lastActive = new Date();
  
  return this.save();
};

// Method to check and unlock achievements
userSchema.methods.checkAchievements = function() {
  const newAchievements = [];
  
  // First game achievement
  if (this.stats.totalGamesPlayed === 1 && !this.achievements.find(a => a.type === 'first_game')) {
    newAchievements.push({
      type: 'first_game',
      description: 'Played your first game!'
    });
  }
  
  // Streak achievements
  if (this.stats.streaks.current >= 5 && !this.achievements.find(a => a.type === 'streak_5')) {
    newAchievements.push({
      type: 'streak_5',
      description: 'Maintained a 5-day streak!'
    });
  }
  
  if (this.stats.streaks.current >= 10 && !this.achievements.find(a => a.type === 'streak_10')) {
    newAchievements.push({
      type: 'streak_10',
      description: 'Maintained a 10-day streak!'
    });
  }
  
  // Add new achievements
  this.achievements.push(...newAchievements);
  
  return newAchievements;
};

export default mongoose.model('User', userSchema);
