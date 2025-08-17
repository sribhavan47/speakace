import express from 'express';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import GameSession from '../models/GameSession.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { getFeedbackService } from '../services/ai/index.js';

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  
  res.json({
    success: true,
    data: {
      user
    }
  });
}));

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  body('firstName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('First name cannot exceed 50 characters'),
  body('lastName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Last name cannot exceed 50 characters'),
  body('preferences.difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
    .withMessage('Invalid difficulty level'),
  body('preferences.gameSettings')
    .optional()
    .isObject()
    .withMessage('Game settings must be an object'),
  body('preferences.notifications')
    .optional()
    .isObject()
    .withMessage('Notification preferences must be an object')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { firstName, lastName, preferences } = req.body;
  const updateData = {};

  if (firstName !== undefined) updateData.firstName = firstName;
  if (lastName !== undefined) updateData.lastName = lastName;
  if (preferences) updateData.preferences = { ...req.user.preferences, ...preferences };

  const user = await User.findByIdAndUpdate(
    req.user._id,
    updateData,
    { new: true, runValidators: true }
  ).select('-password');

  logger.info(`Profile updated for user: ${user.username}`);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user
    }
  });
}));

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', asyncHandler(async (req, res) => {
  const { gameType, timeRange = 'all' } = req.query;
  
  let query = { userId: req.user._id };
  if (gameType) {
    query.gameType = gameType;
  }

  // Add time range filter
  if (timeRange !== 'all') {
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }
    
    if (startDate) {
      query['sessionData.startTime'] = { $gte: startDate };
    }
  }

  const sessions = await GameSession.find(query).sort({ 'sessionData.startTime': -1 });
  
  // Get user's basic stats from User model
  const user = await User.findById(req.user._id);
  
  // Calculate statistics
  const stats = {
    // User model stats (these are updated after each game)
    totalGamesPlayed: user.stats.totalGamesPlayed || 0,
    totalTimeSpent: user.stats.totalTimeSpent || 0, // in seconds
    averageScore: user.stats.averageScore || 0,
    bestScores: user.stats.bestScores || {
      rapidFire: 0,
      conductor: 0,
      tripleStep: 0
    },
    averageConfidence: user.stats.averageConfidence || 0,
    streaks: user.stats.streaks || { current: 0, longest: 0 },
    
    // Session-based stats (calculated from actual game sessions)
    totalSessions: sessions.length,
    totalTime: sessions.reduce((sum, s) => sum + (s.sessionData.duration || 0), 0),
    sessionAverageScore: sessions.length > 0 
      ? Math.round(sessions.reduce((sum, s) => sum + (s.performance.score || 0), 0) / sessions.length)
      : 0,
    bestScore: sessions.length > 0 
      ? Math.max(...sessions.map(s => s.performance.score || 0))
      : 0,
    gameTypeBreakdown: {},
    recentPerformance: [],
    achievements: user.achievements || []
  };

  // Game type breakdown
  const gameTypes = ['rapidFire', 'conductor', 'tripleStep'];
  gameTypes.forEach(type => {
    const typeSessions = sessions.filter(s => s.gameType === type);
    stats.gameTypeBreakdown[type] = {
      sessions: typeSessions.length,
      averageScore: typeSessions.length > 0
        ? Math.round(typeSessions.reduce((sum, s) => sum + (s.performance.score || 0), 0) / typeSessions.length)
        : 0,
      bestScore: typeSessions.length > 0
        ? Math.max(...sessions.map(s => s.performance.score || 0))
        : 0,
      totalTime: typeSessions.reduce((sum, s) => sum + (s.sessionData.duration || 0), 0)
    };
  });

  // Recent performance (last 10 sessions)
  stats.recentPerformance = sessions.slice(0, 10).map(s => ({
    gameType: s.gameType,
    score: s.performance.score,
    date: s.sessionData.startTime,
    duration: s.sessionData.duration
  }));

  logger.info(`Retrieved stats for user: ${user.username}`, {
    totalGamesPlayed: stats.totalGamesPlayed,
    totalTimeSpent: stats.totalTimeSpent,
    averageScore: stats.averageScore
  });

  res.json({
    success: true,
    data: stats,
    timeRange
  });
}));

// @route   GET /api/users/sessions
// @desc    Get user's game sessions with pagination
// @access  Private
router.get('/sessions', asyncHandler(async (req, res) => {
  const { gameType, limit = 20, page = 1, sortBy = 'startTime', sortOrder = 'desc' } = req.query;
  
  const query = { userId: req.user._id };
  if (gameType) {
    query.gameType = gameType;
  }

  const sortOptions = {};
  if (sortBy === 'startTime') {
    sortOptions['sessionData.startTime'] = sortOrder === 'desc' ? -1 : 1;
  } else if (sortBy === 'score') {
    sortOptions['performance.score'] = sortOrder === 'desc' ? -1 : 1;
  } else if (sortBy === 'duration') {
    sortOptions['sessionData.duration'] = sortOrder === 'desc' ? -1 : 1;
  }

  const sessions = await GameSession.find(query)
    .sort(sortOptions)
    .limit(parseInt(limit))
    .skip((parseInt(page) - 1) * parseInt(limit))
    .populate('userId', 'username');

  const total = await GameSession.countDocuments(query);

  res.json({
    success: true,
    data: {
      sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    }
  });
}));

// @route   GET /api/users/achievements
// @desc    Get user achievements
// @access  Private
router.get('/achievements', asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('achievements stats');
  
  res.json({
    success: true,
    data: {
      achievements: user.achievements || [],
      stats: user.stats || {}
    }
  });
}));

// @route   GET /api/users/leaderboard
// @desc    Get leaderboard for a specific game type
// @access  Private
router.get('/leaderboard', asyncHandler(async (req, res) => {
  const { gameType, limit = 10 } = req.query;
  
  if (!gameType) {
    return res.status(400).json({
      success: false,
      message: 'Game type is required'
    });
  }

  const leaderboard = await GameSession.aggregate([
    { $match: { gameType, isCompleted: true } },
    { $group: {
      _id: '$userId',
      bestScore: { $max: '$performance.score' },
      totalSessions: { $sum: 1 },
      averageScore: { $avg: '$performance.score' }
    }},
    { $sort: { bestScore: -1 } },
    { $limit: parseInt(limit) },
    { $lookup: {
      from: 'users',
      localField: '_id',
      foreignField: '_id',
      as: 'user'
    }},
    { $unwind: '$user' },
    { $project: {
      username: '$user.username',
      bestScore: 1,
      totalSessions: 1,
      averageScore: { $round: ['$averageScore', 1] }
    }}
  ]);

  res.json({
    success: true,
    data: {
      leaderboard,
      gameType,
      limit: parseInt(limit)
    }
  });
}));

// @route   POST /api/users/feedback-request
// @desc    Request personalized feedback
// @access  Private
router.post('/feedback-request', [
  body('gameType')
    .isIn(['rapidFire', 'conductor', 'tripleStep'])
    .withMessage('Invalid game type'),
  body('recentPerformance')
    .isObject()
    .withMessage('Recent performance data is required'),
  body('difficulty')
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
    .withMessage('Invalid difficulty level')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { gameType, recentPerformance, difficulty } = req.body;

  try {
    const feedbackService = getFeedbackService();
    
    // Get user stats
    const userStats = {
      totalGamesPlayed: req.user.stats?.totalGamesPlayed || 0,
      averageScore: req.user.stats?.averageScore || 0,
      bestScore: req.user.stats?.bestScores?.[gameType] || 0,
      totalTimeSpent: req.user.stats?.totalTimeSpent || 0
    };

    const feedback = await feedbackService.generatePersonalizedFeedback(
      userStats,
      gameType,
      recentPerformance,
      difficulty
    );

    res.json({
      success: true,
      data: {
        feedback,
        userStats,
        gameType,
        difficulty
      }
    });
  } catch (error) {
    logger.error('Feedback request failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate feedback'
    });
  }
}));

// @route   GET /api/users/progress-report
// @desc    Get user progress report
// @access  Private
router.get('/progress-report', asyncHandler(async (req, res) => {
  const { timeRange = 'month' } = req.query;

  try {
    const feedbackService = getFeedbackService();
    const progressReport = await feedbackService.generateProgressReport(
      req.user._id,
      timeRange
    );

    res.json({
      success: true,
      data: {
        progressReport,
        timeRange
      }
    });
  } catch (error) {
    logger.error('Progress report generation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate progress report'
    });
  }
}));

// @route   GET /api/users/motivation
// @desc    Get motivational message
// @access  Private
router.get('/motivation', asyncHandler(async (req, res) => {
  try {
    const feedbackService = getFeedbackService();
    
    // Get recent performance (last 5 sessions)
    const recentSessions = await GameSession.find({ userId: req.user._id })
      .sort({ 'sessionData.startTime': -1 })
      .limit(5);
    
    const recentPerformance = {
      score: recentSessions.length > 0
        ? Math.round(recentSessions.reduce((sum, s) => sum + (s.performance.score || 0), 0) / recentSessions.length)
        : 0
    };

    const userStats = {
      totalGamesPlayed: req.user.stats?.totalGamesPlayed || 0,
      averageScore: req.user.stats?.averageScore || 0
    };

    const motivationalMessage = await feedbackService.generateMotivationalMessage(
      userStats,
      recentPerformance
    );

    res.json({
      success: true,
      data: {
        motivationalMessage,
        userStats,
        recentPerformance
      }
    });
  } catch (error) {
    logger.error('Motivational message generation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate motivational message'
    });
  }
}));

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', [
  body('password')
    .notEmpty()
    .withMessage('Password is required for account deletion')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { password } = req.body;

  // Verify password
  const user = await User.findById(req.user._id);
  const isPasswordValid = await user.comparePassword(password);
  
  if (!isPasswordValid) {
    return res.status(400).json({
      success: false,
      message: 'Invalid password'
    });
  }

  // Delete user's game sessions
  await GameSession.deleteMany({ userId: req.user._id });
  
  // Delete user account
  await User.findByIdAndDelete(req.user._id);

  logger.info(`Account deleted for user: ${req.user.username}`);

  res.json({
    success: true,
    message: 'Account deleted successfully'
  });
}));

// @route   GET /api/users/all
// @desc    Get all users (for debugging - remove in production)
// @access  Public
router.get('/all', asyncHandler(async (req, res) => {
  try {
    const users = await User.find({}).select('-password'); // Exclude passwords
    logger.info(`Retrieved ${users.length} users from database`);
    
    res.json({
      success: true,
      count: users.length,
      data: users
    });
  } catch (error) {
    logger.error('Error retrieving users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve users'
    });
  }
}));

export default router;
