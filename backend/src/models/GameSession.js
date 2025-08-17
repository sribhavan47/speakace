import mongoose from 'mongoose';

const gameSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gameType: {
    type: String,
    enum: ['rapidFire', 'conductor', 'tripleStep'],
    required: true
  },
  sessionData: {
    startTime: { type: Date, required: true },
    endTime: { type: Date },
    duration: { type: Number }, // in seconds
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'beginner'
    }
  },
  performance: {
    score: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0 }, // percentage
    speed: { type: Number, default: 0 }, // average response time
    energyConsistency: { type: Number, default: 0 }, // for conductor game
    wordIntegration: { type: Number, default: 0 }, // for triple step game
    totalPrompts: { type: Number, default: 0 },
    completedPrompts: { type: Number, default: 0 }
  },
  aiAnalysis: {
    speechClarity: { type: Number, default: 0 }, // 0-100
    energyLevel: { type: Number, default: 0 }, // 0-100
    coherence: { type: Number, default: 0 }, // 0-100
    confidence: { type: Number, default: 0 }, // 0-100
    fluency: { type: Number, default: 0 }, // 0-100
    overallRating: { type: Number, default: 0 }, // 0-100
    feedback: [{
      type: { type: String, enum: ['positive', 'improvement', 'suggestion'] },
      message: String,
      timestamp: { type: Date, default: Date.now }
    }],
    strengths: [String],
    areasForImprovement: [String]
  },
  gameSpecificData: {
    // Rapid Fire specific data
    rapidFire: {
      prompts: [{
        text: String,
        responseTime: Number,
        responseQuality: Number,
        userResponse: String
      }],
      averageResponseTime: Number,
      responseRate: Number
    },
    // Conductor specific data
    conductor: {
      topic: String,
      energyTransitions: [{
        fromLevel: Number,
        toLevel: Number,
        transitionTime: Number,
        success: Boolean
      }],
      breatheCues: [{
        timestamp: Date,
        followed: Boolean,
        responseTime: Number
      }],
      energyRange: {
        min: Number,
        max: Number,
        average: Number
      }
    },
    // Triple Step specific data
    tripleStep: {
      topic: String,
      words: [{
        word: String,
        appearanceTime: Date,
        integrationTime: Number,
        successfullyIntegrated: Boolean,
        context: String
      }],
      integrationSuccessRate: Number,
      topicCoherence: Number
    }
  },
  audioRecording: {
    url: String,
    duration: Number,
    size: Number,
    format: String
  },
  metadata: {
    browser: String,
    device: String,
    microphone: String,
    networkQuality: String
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  tags: [String], // for categorization and search
  notes: String // user or instructor notes
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for session duration
gameSessionSchema.virtual('sessionDuration').get(function() {
  if (this.sessionData.endTime && this.sessionData.startTime) {
    return Math.round((this.sessionData.endTime - this.sessionData.startTime) / 1000);
  }
  return 0;
});

// Virtual for performance score
gameSessionSchema.virtual('performanceScore').get(function() {
  const { accuracy, speed, energyConsistency, wordIntegration } = this.performance;
  
  switch (this.gameType) {
    case 'rapidFire':
      return Math.round((accuracy * 0.6) + (speed * 0.4));
    case 'conductor':
      return Math.round((accuracy * 0.4) + (energyConsistency * 0.6));
    case 'tripleStep':
      return Math.round((accuracy * 0.5) + (wordIntegration * 0.5));
    default:
      return accuracy;
  }
});

// Indexes for better query performance
gameSessionSchema.index({ userId: 1, gameType: 1 });
gameSessionSchema.index({ 'sessionData.startTime': -1 });
gameSessionSchema.index({ 'performance.score': -1 });
gameSessionSchema.index({ 'aiAnalysis.overallRating': -1 });
gameSessionSchema.index({ tags: 1 });

// Method to calculate performance metrics
gameSessionSchema.methods.calculatePerformance = function() {
  // If performance data is already set, use it
  if (this.performance.score !== undefined) {
    return this;
  }

  switch (this.gameType) {
    case 'rapidFire':
      if (this.gameSpecificData.rapidFire) {
        const rapidFire = this.gameSpecificData.rapidFire;
        // Use the data structure we're actually sending
        this.performance.totalPrompts = rapidFire.totalPrompts || 0;
        this.performance.completedPrompts = rapidFire.completedResponses || 0;
        this.performance.accuracy = rapidFire.totalPrompts > 0 ? 
          Math.round((rapidFire.completedResponses / rapidFire.totalPrompts) * 100) : 0;
        this.performance.speed = rapidFire.responseTime || 0;
        this.performance.score = this.performance.accuracy;
      }
      break;
      
    case 'conductor':
      if (this.gameSpecificData.conductor) {
        const conductor = this.gameSpecificData.conductor;
        this.performance.energyConsistency = conductor.consistency || 0;
        this.performance.accuracy = conductor.consistency || 0;
        this.performance.score = this.performance.accuracy;
      }
      break;
      
    case 'tripleStep':
      if (this.gameSpecificData.tripleStep) {
        const tripleStep = this.gameSpecificData.tripleStep;
        this.performance.accuracy = tripleStep.wordsAttempted > 0 ? 
          Math.round((tripleStep.successfulIntegrations / tripleStep.wordsAttempted) * 100) : 0;
        this.performance.wordIntegration = this.performance.accuracy;
        this.performance.speed = tripleStep.averageTime || 0;
        this.performance.score = this.performance.accuracy;
      }
      break;
  }
  
  // Ensure we have default values
  this.performance.score = this.performance.score || 0;
  this.performance.accuracy = this.performance.accuracy || 0;
  this.performance.speed = this.performance.speed || 0;
  this.performance.fluency = this.performance.fluency || 0;
  this.performance.confidence = this.performance.confidence || 0;
  
  return this;
};

// Method to end session
gameSessionSchema.methods.endSession = function() {
  this.sessionData.endTime = new Date();
  this.sessionData.duration = this.sessionDuration;
  this.isCompleted = true;
  this.calculatePerformance();
  return this.save();
};

// Static method to get user statistics
gameSessionSchema.statics.getUserStats = async function(userId, gameType = null) {
  const matchStage = gameType ? { userId, gameType } : { userId };
  
  const stats = await this.aggregate([
    { $match: matchStage },
    { $group: {
      _id: null,
      totalSessions: { $sum: 1 },
      averageScore: { $avg: '$performance.score' },
      bestScore: { $max: '$performance.score' },
      totalTime: { $sum: '$sessionData.duration' },
      averageAccuracy: { $avg: '$performance.accuracy' },
      averageSpeed: { $avg: '$performance.speed' }
    }}
  ]);
  
  return stats[0] || {
    totalSessions: 0,
    averageScore: 0,
    bestScore: 0,
    totalTime: 0,
    averageAccuracy: 0,
    averageSpeed: 0
  };
};

export default mongoose.model('GameSession', gameSessionSchema);
