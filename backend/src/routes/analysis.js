import express from 'express';
import { body, validationResult } from 'express-validator';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { 
  getSpeechAnalysisService, 
  getFeedbackService,
  getEnergyDetectionService,
  getCoherenceAnalysisService
} from '../services/ai/index.js';

const router = express.Router();

// @route   POST /api/analysis/speech-quality
// @desc    Analyze speech quality comprehensively
// @access  Private
router.post('/speech-quality', [
  body('transcript')
    .notEmpty()
    .withMessage('Speech transcript is required'),
  body('gameType')
    .isIn(['rapidFire', 'conductor', 'tripleStep'])
    .withMessage('Invalid game type'),
  body('context')
    .optional()
    .isObject()
    .withMessage('Context must be an object')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { transcript, gameType, context } = req.body;

  try {
    const speechAnalysisService = getSpeechAnalysisService();
    const analysis = await speechAnalysisService.analyzeSpeechQuality(
      transcript,
      gameType,
      context
    );

    res.json({
      success: true,
      data: {
        analysis,
        transcript,
        gameType
      }
    });
  } catch (error) {
    logger.error('Speech quality analysis failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze speech quality'
    });
  }
}));

// @route   POST /api/analysis/rapid-fire
// @desc    Analyze rapid-fire analogy responses
// @access  Private
router.post('/rapid-fire', [
  body('prompt')
    .notEmpty()
    .withMessage('Prompt is required'),
  body('response')
    .notEmpty()
    .withMessage('Response is required'),
  body('responseTime')
    .isNumeric()
    .withMessage('Response time must be a number')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { prompt, response, responseTime } = req.body;

  try {
    const speechAnalysisService = getSpeechAnalysisService();
    const analysis = await speechAnalysisService.analyzeRapidFireResponse(
      prompt,
      response,
      responseTime
    );

    res.json({
      success: true,
      data: {
        analysis,
        prompt,
        response,
        responseTime
      }
    });
  } catch (error) {
    logger.error('Rapid fire analysis failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze rapid-fire response'
    });
  }
}));

// @route   POST /api/analysis/energy-transition
// @desc    Analyze energy level transitions
// @access  Private
router.post('/energy-transition', [
  body('fromLevel')
    .isInt({ min: 1, max: 9 })
    .withMessage('From level must be between 1 and 9'),
  body('toLevel')
    .isInt({ min: 1, max: 9 })
    .withMessage('To level must be between 1 and 9'),
  body('speechSegment')
    .notEmpty()
    .withMessage('Speech segment is required'),
  body('transitionTime')
    .optional()
    .isNumeric()
    .withMessage('Transition time must be a number')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { fromLevel, toLevel, speechSegment, transitionTime } = req.body;

  try {
    const energyDetectionService = getEnergyDetectionService();
    const analysis = await energyDetectionService.analyzeEnergyTransition(
      fromLevel,
      toLevel,
      speechSegment,
      transitionTime || 0
    );

    res.json({
      success: true,
      data: {
        analysis,
        fromLevel,
        toLevel,
        speechSegment,
        transitionTime
      }
    });
  } catch (error) {
    logger.error('Energy transition analysis failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze energy transition'
    });
  }
}));

// @route   POST /api/analysis/word-integration
// @desc    Analyze word integration in speech
// @access  Private
router.post('/word-integration', [
  body('mainTopic')
    .notEmpty()
    .withMessage('Main topic is required'),
  body('targetWord')
    .notEmpty()
    .withMessage('Target word is required'),
  body('speechContext')
    .notEmpty()
    .withMessage('Speech context is required'),
  body('integrationTime')
    .optional()
    .isNumeric()
    .withMessage('Integration time must be a number')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { mainTopic, targetWord, speechContext, integrationTime } = req.body;

  try {
    const coherenceAnalysisService = getCoherenceAnalysisService();
    const analysis = await coherenceAnalysisService.analyzeWordIntegration(
      mainTopic,
      targetWord,
      speechContext,
      integrationTime || 0
    );

    res.json({
      success: true,
      data: {
        analysis,
        mainTopic,
        targetWord,
        speechContext,
        integrationTime
      }
    });
  } catch (error) {
    logger.error('Word integration analysis failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze word integration'
    });
  }
}));

// @route   POST /api/analysis/coherence
// @desc    Analyze speech coherence and topic adherence
// @access  Private
router.post('/coherence', [
  body('speechTranscript')
    .notEmpty()
    .withMessage('Speech transcript is required'),
  body('mainTopic')
    .notEmpty()
    .withMessage('Main topic is required'),
  body('context')
    .optional()
    .isObject()
    .withMessage('Context must be an object')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { speechTranscript, mainTopic, context } = req.body;

  try {
    const coherenceAnalysisService = getCoherenceAnalysisService();
    const analysis = await coherenceAnalysisService.analyzeSpeechCoherence(
      speechTranscript,
      mainTopic,
      context
    );

    res.json({
      success: true,
      data: {
        analysis,
        speechTranscript,
        mainTopic
      }
    });
  } catch (error) {
    logger.error('Coherence analysis failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze speech coherence'
    });
  }
}));

// @route   POST /api/analysis/feedback
// @desc    Generate personalized feedback
// @access  Private
router.post('/feedback', [
  body('gameType')
    .isIn(['rapidFire', 'conductor', 'tripleStep'])
    .withMessage('Invalid game type'),
  body('performance')
    .isObject()
    .withMessage('Performance data is required'),
  body('context')
    .optional()
    .isObject()
    .withMessage('Context must be an object')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { gameType, performance, context } = req.body;

  try {
    const feedbackService = getFeedbackService();
    const feedback = await feedbackService.generateGameSpecificFeedback(
      gameType,
      performance,
      context
    );

    res.json({
      success: true,
      data: {
        feedback,
        gameType,
        performance
      }
    });
  } catch (error) {
    logger.error('Feedback generation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate feedback'
    });
  }
}));

// @route   POST /api/analysis/personalized-feedback
// @desc    Generate personalized feedback based on user stats
// @access  Private
router.post('/personalized-feedback', [
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
    
    // Get user stats (this would typically come from the user model)
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
    logger.error('Personalized feedback generation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate personalized feedback'
    });
  }
}));

// @route   POST /api/analysis/energy-pattern
// @desc    Analyze energy patterns across speech segments
// @access  Private
router.post('/energy-pattern', [
  body('speechSegments')
    .isArray({ min: 1 })
    .withMessage('Speech segments array is required'),
  body('energyLevels')
    .isArray({ min: 1 })
    .withMessage('Energy levels array is required')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { speechSegments, energyLevels } = req.body;

  if (speechSegments.length !== energyLevels.length) {
    return res.status(400).json({
      success: false,
      message: 'Speech segments and energy levels arrays must have the same length'
    });
  }

  try {
    const energyDetectionService = getEnergyDetectionService();
    const analysis = await energyDetectionService.analyzeEnergyPattern(
      speechSegments,
      energyLevels
    );

    res.json({
      success: true,
      data: {
        analysis,
        speechSegments,
        energyLevels
      }
    });
  } catch (error) {
    logger.error('Energy pattern analysis failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze energy pattern'
    });
  }
}));

// @route   POST /api/analysis/topic-deviation
// @desc    Analyze topic deviation across speech segments
// @access  Private
router.post('/topic-deviation', [
  body('speechSegments')
    .isArray({ min: 1 })
    .withMessage('Speech segments array is required'),
  body('mainTopic')
    .notEmpty()
    .withMessage('Main topic is required'),
  body('timeStamps')
    .optional()
    .isArray()
    .withMessage('Time stamps must be an array')
], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { speechSegments, mainTopic, timeStamps } = req.body;

  try {
    const coherenceAnalysisService = getCoherenceAnalysisService();
    const analysis = await coherenceAnalysisService.analyzeTopicDeviation(
      speechSegments,
      mainTopic,
      timeStamps || []
    );

    res.json({
      success: true,
      data: {
        analysis,
        speechSegments,
        mainTopic,
        timeStamps
      }
    });
  } catch (error) {
    logger.error('Topic deviation analysis failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze topic deviation'
    });
  }
}));

// @route   POST /api/analysis/speech-structure
// @desc    Analyze speech structure and organization
// @access  Private
router.post('/speech-structure', [
  body('speechTranscript')
    .notEmpty()
    .withMessage('Speech transcript is required'),
  body('gameType')
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

  const { speechTranscript, gameType } = req.body;

  try {
    const coherenceAnalysisService = getCoherenceAnalysisService();
    const analysis = await coherenceAnalysisService.analyzeSpeechStructure(
      speechTranscript,
      gameType
    );

    res.json({
      success: true,
      data: {
        analysis,
        speechTranscript,
        gameType
      }
    });
  } catch (error) {
    logger.error('Speech structure analysis failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze speech structure'
    });
  }
}));

// @route   GET /api/analysis/exercises/:type
// @desc    Get improvement exercises based on analysis
// @access  Private
router.get('/exercises/:type', asyncHandler(async (req, res) => {
  const { type } = req.params;
  const { score, improvementAreas, difficulty = 'beginner' } = req.query;

  try {
    let exercises = {};

    if (type === 'energy') {
      const energyDetectionService = getEnergyDetectionService();
      exercises = await energyDetectionService.generateEnergyModulationExercises(
        parseInt(score) || 75,
        parseInt(score) + 10 || 85,
        difficulty
      );
    } else if (type === 'coherence') {
      const coherenceAnalysisService = getCoherenceAnalysisService();
      const areas = improvementAreas ? improvementAreas.split(',') : ['general'];
      exercises = await coherenceAnalysisService.generateCoherenceExercises(
        parseInt(score) || 75,
        areas,
        difficulty
      );
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid exercise type. Use "energy" or "coherence"'
      });
    }

    res.json({
      success: true,
      data: {
        exercises,
        type,
        score: parseInt(score) || 75,
        difficulty
      }
    });
  } catch (error) {
    logger.error('Exercise generation failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate exercises'
    });
  }
}));

export default router;
