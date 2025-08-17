import express from 'express';
import { body, validationResult } from 'express-validator';
import GameSession from '../models/GameSession.js';
import User from '../models/User.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { logger } from '../utils/logger.js';
import { 
  getSpeechAnalysisService, 
  getPromptGenerationService,
  getEnergyDetectionService,
  getCoherenceAnalysisService
} from '../services/ai/index.js';

const router = express.Router();

// Validation middleware
const validateGameSession = [
  body('gameType')
    .isIn(['rapidFire', 'conductor', 'tripleStep'])
    .withMessage('Invalid game type'),
  body('sessionData.difficulty')
    .optional()
    .isIn(['beginner', 'intermediate', 'advanced', 'expert'])
    .withMessage('Invalid difficulty level')
];

// @route   GET /api/games/test
// @desc    Test endpoint to verify backend is working
// @access  Public
router.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Games API is working',
    timestamp: new Date().toISOString()
  });
});

// @route   POST /api/games/start-session
// @desc    Start a new game session
// @access  Private
router.post('/start-session', validateGameSession, asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.error('Validation failed for start-session:', errors.array());
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { gameType, sessionData, preferences } = req.body;
  
  logger.info(`Starting game session for user ${req.user._id}, game type: ${gameType}`);

  try {
    // Create new game session
    const gameSession = new GameSession({
      userId: req.user._id,
      gameType,
      sessionData: {
        ...sessionData,
        startTime: new Date()
      },
      metadata: {
        browser: req.get('User-Agent'),
        device: req.get('User-Agent'),
        microphone: 'Unknown',
        networkQuality: 'Unknown'
      }
    });

    logger.info(`Game session object created:`, {
      userId: gameSession.userId,
      gameType: gameSession.gameType,
      startTime: gameSession.sessionData.startTime
    });

    await gameSession.save();
    
    logger.info(`Game session saved to database with ID: ${gameSession._id}`);

    logger.info(`Game session started: ${gameType} for user ${req.user.username}`);

    res.status(201).json({
      success: true,
      message: 'Game session started successfully',
      data: {
        sessionId: gameSession._id,
        gameType,
        startTime: gameSession.sessionData.startTime
      }
    });
  } catch (error) {
    logger.error('Error creating game session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start game session',
      error: error.message
    });
  }
}));

// @route   POST /api/games/end-session/:sessionId
// @desc    End a game session and get AI analysis
// @access  Private
router.post('/end-session/:sessionId', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;
  const { performance, gameSpecificData, audioRecording } = req.body;

  logger.info(`Ending game session ${sessionId} with data:`, { performance, gameSpecificData });

  // Find and validate session
  const gameSession = await GameSession.findOne({
    _id: sessionId,
    userId: req.user._id
  });

  if (!gameSession) {
    logger.error(`Game session ${sessionId} not found for user ${req.user._id}`);
    return res.status(404).json({
      success: false,
      message: 'Game session not found'
    });
  }

  if (gameSession.isCompleted) {
    logger.warn(`Game session ${sessionId} already completed`);
    return res.status(400).json({
      success: false,
      message: 'Session already completed'
    });
  }

  try {
    logger.info(`Updating game session ${sessionId} with performance data`);
    
    // Update session data with proper structure
    gameSession.performance = {
      score: performance.score || 0,
      accuracy: performance.accuracy || 0,
      speed: performance.speed || 0,
      fluency: performance.fluency || 0,
      confidence: performance.confidence || 0
    };

    logger.info(`Performance data set:`, gameSession.performance);

    // Update game-specific data based on game type
    if (gameSpecificData) {
      logger.info(`Updating game-specific data for ${gameSession.gameType}:`, gameSpecificData);
      
      switch (gameSession.gameType) {
        case 'rapidFire':
          if (gameSpecificData.rapidFire) {
            gameSession.gameSpecificData.rapidFire = {
              prompt: gameSpecificData.rapidFire.prompt || '',
              responseTime: gameSpecificData.rapidFire.responseTime || 0,
              analogyQuality: gameSpecificData.rapidFire.analogyQuality || 0,
              totalPrompts: gameSpecificData.rapidFire.totalPrompts || 0,
              completedResponses: gameSpecificData.rapidFire.completedResponses || 0
            };
          }
          break;
        
        case 'tripleStep':
          if (gameSpecificData.tripleStep) {
            gameSession.gameSpecificData.tripleStep = {
              topic: gameSpecificData.tripleStep.topic || '',
              wordsAttempted: gameSpecificData.tripleStep.wordsAttempted || 0,
              successfulIntegrations: gameSpecificData.tripleStep.successfulIntegrations || 0,
              averageTime: gameSpecificData.tripleStep.averageTime || 0,
              words: gameSpecificData.tripleStep.words || []
            };
          }
          break;
        
        case 'conductor':
          if (gameSpecificData.conductor) {
            gameSession.gameSpecificData.conductor = {
              topic: gameSpecificData.conductor.topic || '',
              energyLevel: gameSpecificData.conductor.energyLevel || 0,
              consistency: gameSpecificData.conductor.consistency || 0
            };
          }
          break;
      }
    }

    if (audioRecording) {
      gameSession.audioRecording = audioRecording;
    }

    logger.info(`Calling endSession for game session ${sessionId}`);
    
    // End session and calculate performance
    await gameSession.endSession();
    
    logger.info(`Game session ${sessionId} ended successfully, performance:`, gameSession.performance);

    // Try to get AI analysis, but don't fail if it doesn't work
    let aiAnalysis = {};
    
    try {
      const speechAnalysisService = getSpeechAnalysisService();
      const energyDetectionService = getEnergyDetectionService();
      const coherenceAnalysisService = getCoherenceAnalysisService();

      switch (gameSession.gameType) {
        case 'rapidFire':
          aiAnalysis = await analyzeRapidFireSession(gameSession, speechAnalysisService, coherenceAnalysisService);
          break;
        case 'conductor':
          aiAnalysis = await analyzeConductorSession(gameSession, speechAnalysisService, energyDetectionService);
          break;
        case 'tripleStep':
          aiAnalysis = await analyzeTripleStepSession(gameSession, speechAnalysisService, coherenceAnalysisService);
          break;
      }

      // Update session with AI analysis
      gameSession.aiAnalysis = aiAnalysis;
      await gameSession.save();
      logger.info(`AI analysis completed for game session ${sessionId}`);

    } catch (aiError) {
      logger.warn('AI analysis failed, continuing without it:', aiError.message);
      // Use default analysis
      aiAnalysis = getDefaultAnalysis();
      gameSession.aiAnalysis = aiAnalysis;
      await gameSession.save();
    }

    logger.info(`Updating user stats for user ${req.user._id}`);
    
    // Update user stats
    await updateUserStats(req.user._id, gameSession);

    logger.info(`Game session completed: ${gameSession.gameType} for user ${req.user.username}`);

    res.json({
      success: true,
      message: 'Game session completed successfully',
      data: {
        session: gameSession,
        aiAnalysis
      }
    });

  } catch (error) {
    logger.error('Error ending game session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to end game session',
      error: error.message
    });
  }
}));

// @route   GET /api/games/sessions
// @desc    Get user's game sessions
// @access  Private
router.get('/sessions', asyncHandler(async (req, res) => {
  const { gameType, limit = 20, page = 1 } = req.query;
  
  const query = { userId: req.user._id };
  if (gameType) {
    query.gameType = gameType;
  }

  const sessions = await GameSession.find(query)
    .sort({ 'sessionData.startTime': -1 })
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

// @route   GET /api/games/sessions/:sessionId
// @desc    Get specific game session
// @access  Private
router.get('/sessions/:sessionId', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  const gameSession = await GameSession.findOne({
    _id: sessionId,
    userId: req.user._id
  });

  if (!gameSession) {
    return res.status(404).json({
      success: false,
      message: 'Game session not found'
    });
  }

  res.json({
    success: true,
    data: {
      session: gameSession
    }
  });
}));

// @route   GET /api/games/prompts/:gameType
// @desc    Get AI-generated prompts for a game type
// @access  Private
router.get('/prompts/:gameType', asyncHandler(async (req, res) => {
  const { gameType } = req.params;
  const { count = 10, difficulty = 'beginner', theme } = req.query;

  try {
    const promptGenerationService = getPromptGenerationService();
    let prompts = [];

    switch (gameType) {
      case 'rapidFire':
        prompts = await promptGenerationService.generateRapidFirePrompts(
          parseInt(count),
          difficulty,
          theme
        );
        break;
      case 'conductor':
        prompts = await promptGenerationService.generateConductorTopics(
          parseInt(count),
          difficulty
        );
        break;
      case 'tripleStep':
        // For triple step, we need a main topic first
        const mainTopic = theme || "The importance of effective communication";
        prompts = await promptGenerationService.generateTripleStepWords(
          mainTopic,
          parseInt(count),
          difficulty
        );
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid game type'
        });
    }

    res.json({
      success: true,
      data: {
        prompts,
        gameType,
        difficulty,
        count: prompts.length
      }
    });
  } catch (error) {
    logger.error('Failed to generate prompts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate prompts'
    });
  }
}));

// @route   POST /api/games/analyze-speech
// @desc    Analyze speech in real-time
// @access  Private
router.post('/analyze-speech', [
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
    logger.error('Speech analysis failed:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze speech'
    });
  }
}));

// Helper functions for AI analysis
async function analyzeRapidFireSession(gameSession, speechAnalysisService, coherenceAnalysisService) {
  const { rapidFire } = gameSession.gameSpecificData;
  
  if (!rapidFire?.prompts?.length) {
    return getDefaultAnalysis();
  }

  const prompts = rapidFire.prompts.map(p => p.text);
  const responses = rapidFire.prompts.map(p => p.userResponse);
  const responseTimes = rapidFire.prompts.map(p => p.responseTime);

  // Analyze coherence across all responses
  const coherenceAnalysis = await coherenceAnalysisService.analyzeRapidFireCoherence(
    prompts,
    responses,
    responseTimes
  );

  // Analyze individual responses
  const responseAnalyses = [];
  for (let i = 0; i < prompts.length; i++) {
    if (responses[i]) {
      const analysis = await speechAnalysisService.analyzeRapidFireResponse(
        prompts[i],
        responses[i],
        responseTimes[i]
      );
      responseAnalyses.push(analysis);
    }
  }

  // Calculate overall scores
  const overallRating = Math.round(
    responseAnalyses.reduce((sum, a) => sum + a.overallQuality, 0) / responseAnalyses.length
  );

  return {
    speechClarity: overallRating,
    energyLevel: overallRating,
    coherence: coherenceAnalysis.overallCoherence,
    confidence: overallRating,
    fluency: overallRating,
    overallRating,
    strengths: coherenceAnalysis.strengths || ['Good effort'],
    areasForImprovement: coherenceAnalysis.improvements || ['Continue practicing'],
    feedback: [
      {
        type: 'positive',
        message: 'Good completion of rapid-fire exercises'
      },
      {
        type: 'improvement',
        message: 'Focus on response clarity and speed'
      }
    ]
  };
}

async function analyzeConductorSession(gameSession, speechAnalysisService, energyDetectionService) {
  const { conductor } = gameSession.gameSpecificData;
  
  if (!conductor?.energyTransitions?.length) {
    return getDefaultAnalysis();
  }

  // Analyze energy transitions
  const transitionAnalyses = [];
  for (const transition of conductor.energyTransitions) {
    const analysis = await energyDetectionService.analyzeEnergyTransition(
      transition.fromLevel,
      transition.toLevel,
      transition.speechSegment || 'Energy transition',
      transition.transitionTime
    );
    transitionAnalyses.push(analysis);
  }

  // Calculate energy consistency
  const successfulTransitions = transitionAnalyses.filter(t => t.success).length;
  const energyConsistency = Math.round((successfulTransitions / transitionAnalyses.length) * 100);

  // Analyze breathe cues
  const breatheAnalyses = [];
  for (const breathe of conductor.breatheCues || []) {
    const analysis = await energyDetectionService.analyzeBreatheCueResponse(
      'BREATHE',
      breathe.speechBefore || '',
      breathe.speechAfter || '',
      breathe.responseTime || 0
    );
    breatheAnalyses.push(analysis);
  }

  const overallRating = Math.round((energyConsistency + 75) / 2);

  return {
    speechClarity: overallRating,
    energyLevel: energyConsistency,
    coherence: 75,
    confidence: overallRating,
    fluency: overallRating,
    overallRating,
    strengths: ['Good energy awareness', 'Willingness to adapt'],
    areasForImprovement: ['Energy consistency', 'Smooth transitions'],
    feedback: [
      {
        type: 'positive',
        message: 'Good energy modulation practice'
      },
      {
        type: 'improvement',
        message: 'Focus on smooth energy transitions'
      }
    ]
  };
}

async function analyzeTripleStepSession(gameSession, speechAnalysisService, coherenceAnalysisService) {
  const { tripleStep } = gameSession.gameSpecificData;
  
  if (!tripleStep?.words?.length) {
    return getDefaultAnalysis();
  }

  // Analyze word integrations
  const integrationAnalyses = [];
  for (const wordData of tripleStep.words) {
    const analysis = await coherenceAnalysisService.analyzeWordIntegration(
      tripleStep.topic,
      wordData.word,
      wordData.context || '',
      wordData.integrationTime || 0
    );
    integrationAnalyses.push(analysis);
  }

  // Calculate integration success rate
  const successfulIntegrations = integrationAnalyses.filter(a => a.success).length;
  const integrationSuccess = Math.round((successfulIntegrations / integrationAnalyses.length) * 100);

  // Analyze overall coherence
  const coherenceAnalysis = await coherenceAnalysisService.analyzeSpeechCoherence(
    tripleStep.speechTranscript || 'Word integration exercise',
    tripleStep.topic,
    { gameType: 'tripleStep' }
  );

  const overallRating = Math.round((integrationSuccess + coherenceAnalysis.coherenceScore) / 2);

  return {
    speechClarity: overallRating,
    energyLevel: 75,
    coherence: coherenceAnalysis.coherenceScore,
    confidence: overallRating,
    fluency: overallRating,
    overallRating,
    strengths: ['Good word integration', 'Topic focus'],
    areasForImprovement: ['Natural integration', 'Flow preservation'],
    feedback: [
      {
        type: 'positive',
        message: 'Good word integration practice'
      },
      {
        type: 'improvement',
        message: 'Focus on natural word weaving'
      }
    ]
  };
}

function getDefaultAnalysis() {
  return {
    speechClarity: 75,
    energyLevel: 75,
    coherence: 75,
    confidence: 75,
    fluency: 75,
    overallRating: 75,
    strengths: ['Good effort', 'Game completion'],
    areasForImprovement: ['Continue practicing', 'Focus on improvement areas'],
    feedback: [
      {
        type: 'positive',
        message: 'Good effort in completing the exercise'
      },
      {
        type: 'suggestion',
        message: 'Continue practicing to improve your skills'
      }
    ]
  };
}

async function updateUserStats(userId, gameSession) {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const score = gameSession.performance.score || 0;
    
    // Calculate duration in seconds
    let duration = 0;
    if (gameSession.sessionData.startTime && gameSession.sessionData.endTime) {
      duration = Math.round((gameSession.sessionData.endTime - gameSession.sessionData.startTime) / 1000);
    } else if (gameSession.sessionData.duration) {
      duration = gameSession.sessionData.duration;
    }

    // Update user stats
    await user.updateStats(gameSession.gameType, score, duration);
    
    // Check for new achievements
    const newAchievements = user.checkAchievements();
    if (newAchievements.length > 0) {
      await user.save();
      logger.info(`New achievements unlocked for user ${user.username}: ${newAchievements.map(a => a.type).join(', ')}`);
    }

    logger.info(`User stats updated for ${user.username}: Game ${gameSession.gameType}, Score ${score}, Duration ${duration}s`);
  } catch (error) {
    logger.error('Failed to update user stats:', error);
  }
}

export default router;
