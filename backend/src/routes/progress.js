import express from 'express';
import { query, validationResult } from 'express-validator';
import GameSession from '../models/GameSession.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { getFeedbackService } from '../services/ai/index.js';

const router = express.Router();

// @route   GET /api/progress/overview
// @desc    Get user progress overview
// @access  Private
router.get('/overview', asyncHandler(async (req, res) => {
  const { timeRange = 'month' } = req.query;
  
  // Calculate date range
  const now = new Date();
  let startDate;
  
  switch (timeRange) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'quarter':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // Default to month
  }

  // Get sessions in date range
  const sessions = await GameSession.find({
    userId: req.user._id,
    'sessionData.startTime': { $gte: startDate },
    isCompleted: true
  }).sort({ 'sessionData.startTime': 1 });

  // Calculate progress metrics
  const progress = {
    timeRange,
    totalSessions: sessions.length,
    totalTime: sessions.reduce((sum, s) => sum + (s.sessionData.duration || 0), 0),
    averageScore: sessions.length > 0 
      ? Math.round(sessions.reduce((sum, s) => sum + (s.performance.score || 0), 0) / sessions.length)
      : 0,
    bestScore: sessions.length > 0 
      ? Math.max(...sessions.map(s => s.performance.score || 0))
      : 0,
    improvement: 0,
    gameTypeProgress: {},
    weeklyTrends: [],
    achievements: []
  };

  // Calculate improvement (compare first half vs second half of period)
  if (sessions.length >= 4) {
    const midPoint = Math.floor(sessions.length / 2);
    const firstHalf = sessions.slice(0, midPoint);
    const secondHalf = sessions.slice(midPoint);
    
    const firstHalfAvg = firstHalf.reduce((sum, s) => sum + (s.performance.score || 0), 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, s) => sum + (s.performance.score || 0), 0) / secondHalf.length;
    
    progress.improvement = Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100);
  }

  // Game type progress
  const gameTypes = ['rapidFire', 'conductor', 'tripleStep'];
  gameTypes.forEach(type => {
    const typeSessions = sessions.filter(s => s.gameType === type);
    if (typeSessions.length > 0) {
      const scores = typeSessions.map(s => s.performance.score || 0);
      progress.gameTypeProgress[type] = {
        sessions: typeSessions.length,
        averageScore: Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length),
        bestScore: Math.max(...scores),
        improvement: calculateImprovement(typeSessions)
      };
    }
  });

  // Weekly trends (last 4 weeks)
  const weeklyTrends = [];
  for (let i = 3; i >= 0; i--) {
    const weekStart = new Date(now.getTime() - (i * 7 + 7) * 24 * 60 * 60 * 1000);
    const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);
    
    const weekSessions = sessions.filter(s => 
      s.sessionData.startTime >= weekStart && s.sessionData.startTime < weekEnd
    );
    
    weeklyTrends.push({
      week: `Week ${4 - i}`,
      sessions: weekSessions.length,
      averageScore: weekSessions.length > 0 
        ? Math.round(weekSessions.reduce((sum, s) => sum + (s.performance.score || 0), 0) / weekSessions.length)
        : 0,
      totalTime: weekSessions.reduce((sum, s) => sum + (s.sessionData.duration || 0), 0)
    });
  }
  progress.weeklyTrends = weeklyTrends;

  // Get recent achievements
  progress.achievements = req.user.achievements || [];

  res.json({
    success: true,
    data: {
      progress
    }
  });
}));

// @route   GET /api/progress/analytics
// @desc    Get detailed progress analytics
// @access  Private
router.get('/analytics', [
  query('gameType')
    .optional()
    .isIn(['rapidFire', 'conductor', 'tripleStep'])
    .withMessage('Invalid game type'),
  query('timeRange')
    .optional()
    .isIn(['week', 'month', 'quarter', 'year', 'all'])
    .withMessage('Invalid time range')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { gameType, timeRange = 'month' } = req.query;
  
  // Build query
  let query = { userId: req.user._id, isCompleted: true };
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
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
    }
    
    if (startDate) {
      query['sessionData.startTime'] = { $gte: startDate };
    }
  }

  const sessions = await GameSession.find(query).sort({ 'sessionData.startTime': 1 });

  // Calculate analytics
  const analytics = {
    gameType: gameType || 'all',
    timeRange,
    totalSessions: sessions.length,
    performanceMetrics: {
      averageScore: sessions.length > 0 
        ? Math.round(sessions.reduce((sum, s) => sum + (s.performance.score || 0), 0) / sessions.length)
        : 0,
      bestScore: sessions.length > 0 
        ? Math.max(...sessions.map(s => s.performance.score || 0))
        : 0,
      worstScore: sessions.length > 0 
        ? Math.min(...sessions.map(s => s.performance.score || 0))
        : 0,
      scoreDistribution: calculateScoreDistribution(sessions),
      consistency: calculateConsistency(sessions)
    },
    timeMetrics: {
      totalTime: sessions.reduce((sum, s) => sum + (s.sessionData.duration || 0), 0),
      averageSessionLength: sessions.length > 0 
        ? Math.round(sessions.reduce((sum, s) => sum + (s.sessionData.duration || 0), 0) / sessions.length)
        : 0,
      longestSession: sessions.length > 0 
        ? Math.max(...sessions.map(s => s.sessionData.duration || 0))
        : 0,
      shortestSession: sessions.length > 0 
        ? Math.min(...sessions.map(s => s.sessionData.duration || 0))
        : 0
    },
    trends: {
      daily: calculateDailyTrends(sessions),
      weekly: calculateWeeklyTrends(sessions),
      monthly: calculateMonthlyTrends(sessions)
    },
    gameSpecificMetrics: gameType ? calculateGameSpecificMetrics(sessions, gameType) : null
  };

  res.json({
    success: true,
    data: {
      analytics
    }
  });
}));

// @route   GET /api/progress/insights
// @desc    Get AI-generated progress insights
// @access  Private
router.get('/insights', asyncHandler(async (req, res) => {
  const { timeRange = 'month' } = req.query;

  try {
    // Get recent sessions for analysis
    const now = new Date();
    let startDate;
    
    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const sessions = await GameSession.find({
      userId: req.user._id,
      'sessionData.startTime': { $gte: startDate },
      isCompleted: true
    }).sort({ 'sessionData.startTime': -1 }).limit(20);

    if (sessions.length === 0) {
      return res.json({
        success: true,
        data: {
          insights: {
            message: "No recent sessions found. Start playing games to get insights!",
            recommendations: ["Try the Rapid Fire game to get started", "Practice regularly to see improvement trends"]
          }
        }
      });
    }

    // Calculate basic metrics for insights
    const totalSessions = sessions.length;
    const averageScore = Math.round(sessions.reduce((sum, s) => sum + (s.performance.score || 0), 0) / sessions.length);
    const bestScore = Math.max(...sessions.map(s => s.performance.score || 0));
    const totalTime = sessions.reduce((sum, s) => sum + (s.sessionData.duration || 0), 0);

    // Generate insights using AI feedback service
    const feedbackService = getFeedbackService();
    
    // Create a mock recent performance object for the AI
    const recentPerformance = {
      score: averageScore,
      accuracy: Math.round(averageScore * 0.8), // Estimate accuracy from score
      speed: Math.round(totalTime / totalSessions / 1000), // Average session time in seconds
      sessionDuration: Math.round(totalTime / totalSessions)
    };

    const userStats = {
      totalGamesPlayed: req.user.stats?.totalGamesPlayed || 0,
      averageScore: req.user.stats?.averageScore || 0,
      bestScore: bestScore,
      totalTimeSpent: req.user.stats?.totalTimeSpent || 0
    };

    // Get personalized feedback as insights
    const insights = await feedbackService.generatePersonalizedFeedback(
      userStats,
      'general', // General insights across all games
      recentPerformance,
      req.user.preferences?.difficulty || 'beginner'
    );

    res.json({
      success: true,
      data: {
        insights: {
          summary: insights.overallAssessment,
          strengths: insights.strengths,
          improvementAreas: insights.improvementAreas,
          recommendations: insights.nextSteps,
          motivation: insights.motivation,
          metrics: {
            totalSessions,
            averageScore,
            bestScore,
            totalTime: Math.round(totalTime / 60) // Convert to minutes
          }
        }
      }
    });
  } catch (error) {
    logger.error('Progress insights generation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate progress insights'
    });
  }
}));

// @route   GET /api/progress/compare
// @desc    Compare progress across different time periods
// @access  Private
router.get('/compare', [
  query('period1')
    .isIn(['week', 'month', 'quarter', 'year'])
    .withMessage('Period 1 must be week, month, quarter, or year'),
  query('period2')
    .isIn(['week', 'month', 'quarter', 'year'])
    .withMessage('Period 2 must be week, month, quarter, or year'),
  query('gameType')
    .optional()
    .isIn(['rapidFire', 'conductor', 'tripleStep'])
    .withMessage('Invalid game type')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { period1, period2, gameType } = req.query;
  
  // Calculate date ranges for both periods
  const now = new Date();
  const period1Start = calculatePeriodStart(now, period1);
  const period2Start = calculatePeriodStart(now, period2);

  // Build queries
  let query1 = { 
    userId: req.user._id, 
    'sessionData.startTime': { $gte: period1Start, $lt: now },
    isCompleted: true
  };
  let query2 = { 
    userId: req.user._id, 
    'sessionData.startTime': { $gte: period2Start, $lt: period1Start },
    isCompleted: true
  };

  if (gameType) {
    query1.gameType = gameType;
    query2.gameType = gameType;
  }

  // Get sessions for both periods
  const [period1Sessions, period2Sessions] = await Promise.all([
    GameSession.find(query1),
    GameSession.find(query2)
  ]);

  // Calculate metrics for both periods
  const period1Metrics = calculatePeriodMetrics(period1Sessions);
  const period2Metrics = calculatePeriodMetrics(period2Sessions);

  // Calculate changes
  const changes = {
    sessions: {
      period1: period1Metrics.sessions,
      period2: period2Metrics.sessions,
      change: period1Metrics.sessions - period2Metrics.sessions,
      percentageChange: period2Metrics.sessions > 0 
        ? Math.round(((period1Metrics.sessions - period2Metrics.sessions) / period2Metrics.sessions) * 100)
        : 0
    },
    averageScore: {
      period1: period1Metrics.averageScore,
      period2: period2Metrics.averageScore,
      change: period1Metrics.averageScore - period2Metrics.averageScore,
      percentageChange: period2Metrics.averageScore > 0 
        ? Math.round(((period1Metrics.averageScore - period2Metrics.averageScore) / period2Metrics.averageScore) * 100)
        : 0
    },
    totalTime: {
      period1: period1Metrics.totalTime,
      period2: period2Metrics.totalTime,
      change: period1Metrics.totalTime - period2Metrics.totalTime,
      percentageChange: period2Metrics.totalTime > 0 
        ? Math.round(((period1Metrics.totalTime - period2Metrics.totalTime) / period2Metrics.totalTime) * 100)
        : 0
    }
  };

  res.json({
    success: true,
    data: {
      comparison: {
        period1: { name: period1, metrics: period1Metrics },
        period2: { name: period2, metrics: period2Metrics },
        changes,
        gameType: gameType || 'all'
      }
    }
  });
}));

// Helper functions
function calculateImprovement(sessions) {
  if (sessions.length < 2) return 0;
  
  const scores = sessions.map(s => s.performance.score || 0);
  const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
  const secondHalf = scores.slice(Math.floor(scores.length / 2));
  
  const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
  
  return Math.round(((secondAvg - firstAvg) / firstAvg) * 100);
}

function calculateScoreDistribution(sessions) {
  const distribution = {
    '0-20': 0, '21-40': 0, '41-60': 0, '61-80': 0, '81-100': 0
  };
  
  sessions.forEach(session => {
    const score = session.performance.score || 0;
    if (score <= 20) distribution['0-20']++;
    else if (score <= 40) distribution['21-40']++;
    else if (score <= 60) distribution['41-60']++;
    else if (score <= 80) distribution['61-80']++;
    else distribution['81-100']++;
  });
  
  return distribution;
}

function calculateConsistency(sessions) {
  if (sessions.length < 2) return 100;
  
  const scores = sessions.map(s => s.performance.score || 0);
  const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
  const standardDeviation = Math.sqrt(variance);
  
  // Higher consistency = lower standard deviation
  return Math.max(0, Math.round(100 - (standardDeviation / 2)));
}

function calculateDailyTrends(sessions) {
  const dailyData = {};
  
  sessions.forEach(session => {
    const date = session.sessionData.startTime.toISOString().split('T')[0];
    if (!dailyData[date]) {
      dailyData[date] = { sessions: 0, totalScore: 0, totalTime: 0 };
    }
    dailyData[date].sessions++;
    dailyData[date].totalScore += session.performance.score || 0;
    dailyData[date].totalTime += session.sessionData.duration || 0;
  });
  
  return Object.entries(dailyData).map(([date, data]) => ({
    date,
    sessions: data.sessions,
    averageScore: Math.round(data.totalScore / data.sessions),
    totalTime: data.totalTime
  }));
}

function calculateWeeklyTrends(sessions) {
  const weeklyData = {};
  
  sessions.forEach(session => {
    const weekStart = getWeekStart(session.sessionData.startTime);
    const weekKey = weekStart.toISOString().split('T')[0];
    
    if (!weeklyData[weekKey]) {
      weeklyData[weekKey] = { sessions: 0, totalScore: 0, totalTime: 0 };
    }
    weeklyData[weekKey].sessions++;
    weeklyData[weekKey].totalScore += session.performance.score || 0;
    weeklyData[weekKey].totalTime += session.sessionData.duration || 0;
  });
  
  return Object.entries(weeklyData).map(([week, data]) => ({
    week,
    sessions: data.sessions,
    averageScore: Math.round(data.totalScore / data.sessions),
    totalTime: data.totalTime
  }));
}

function calculateMonthlyTrends(sessions) {
  const monthlyData = {};
  
  sessions.forEach(session => {
    const monthKey = session.sessionData.startTime.toISOString().slice(0, 7); // YYYY-MM format
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = { sessions: 0, totalScore: 0, totalTime: 0 };
    }
    monthlyData[monthKey].sessions++;
    monthlyData[monthKey].totalScore += session.performance.score || 0;
    monthlyData[monthKey].totalTime += session.sessionData.duration || 0;
  });
  
  return Object.entries(monthlyData).map(([month, data]) => ({
    month,
    sessions: data.sessions,
    averageScore: Math.round(data.totalScore / data.sessions),
    totalTime: data.totalTime
  }));
}

function calculateGameSpecificMetrics(sessions, gameType) {
  const gameSessions = sessions.filter(s => s.gameType === gameType);
  
  if (gameSessions.length === 0) return null;
  
  const metrics = {
    sessions: gameSessions.length,
    averageScore: Math.round(gameSessions.reduce((sum, s) => sum + (s.performance.score || 0), 0) / gameSessions.length),
    bestScore: Math.max(...gameSessions.map(s => s.performance.score || 0)),
    totalTime: gameSessions.reduce((sum, s) => sum + (s.sessionData.duration || 0), 0)
  };
  
  // Add game-specific metrics based on game type
  switch (gameType) {
    case 'rapidFire':
      metrics.responseRate = Math.round(
        (gameSessions.reduce((sum, s) => sum + (s.performance.completedPrompts || 0), 0) / 
         gameSessions.reduce((sum, s) => sum + (s.performance.totalPrompts || 0), 0)) * 100
      );
      break;
    case 'conductor':
      metrics.energyConsistency = Math.round(
        gameSessions.reduce((sum, s) => sum + (s.performance.energyConsistency || 0), 0) / gameSessions.length
      );
      break;
    case 'tripleStep':
      metrics.wordIntegration = Math.round(
        gameSessions.reduce((sum, s) => sum + (s.performance.wordIntegration || 0), 0) / gameSessions.length
      );
      break;
  }
  
  return metrics;
}

function calculatePeriodStart(now, period) {
  switch (period) {
    case 'week':
      return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case 'month':
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case 'quarter':
      return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    case 'year':
      return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    default:
      return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
}

function calculatePeriodMetrics(sessions) {
  return {
    sessions: sessions.length,
    averageScore: sessions.length > 0 
      ? Math.round(sessions.reduce((sum, s) => sum + (s.performance.score || 0), 0) / sessions.length)
      : 0,
    bestScore: sessions.length > 0 
      ? Math.max(...sessions.map(s => s.performance.score || 0))
      : 0,
    totalTime: sessions.reduce((sum, s) => sum + (s.sessionData.duration || 0), 0)
  };
}

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

export default router;
