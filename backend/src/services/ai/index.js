import { logger } from '../../utils/logger.js';
import { SpeechAnalysisService } from './speechAnalysis.js';
import { PromptGenerationService } from './promptGeneration.js';
import { FeedbackService } from './feedbackService.js';
import { EnergyDetectionService } from './energyDetection.js';
import { CoherenceAnalysisService } from './coherenceAnalysis.js';

let speechAnalysisService;
let promptGenerationService;
let feedbackService;
let energyDetectionService;
let coherenceAnalysisService;
let servicesInitialized = false;

export const initializeAIServices = async () => {
  try {
    logger.info('Initializing AI services...');
    
    // Initialize OpenAI-based services
    speechAnalysisService = new SpeechAnalysisService();
    promptGenerationService = new PromptGenerationService();
    feedbackService = new FeedbackService();
    energyDetectionService = new EnergyDetectionService();
    coherenceAnalysisService = new CoherenceAnalysisService();
    
    // Test AI service connectivity (optional)
    try {
      await speechAnalysisService.testConnection();
      await promptGenerationService.testConnection();
      logger.info('AI services initialized successfully');
      servicesInitialized = true;
    } catch (testError) {
      logger.warn('AI service tests failed, but services are available:', testError.message);
      servicesInitialized = true;
    }
    
  } catch (error) {
    logger.error('Failed to initialize AI services:', error);
    // Don't throw error, just log it
    servicesInitialized = false;
  }
};

export const getSpeechAnalysisService = () => {
  if (!speechAnalysisService || !servicesInitialized) {
    logger.warn('Speech analysis service not available, using fallback');
    return {
      analyzeSpeechQuality: () => ({ overallQuality: 75, clarity: 75, confidence: 75 }),
      analyzeRapidFireResponse: () => ({ overallQuality: 75, creativity: 75, speed: 75 })
    };
  }
  return speechAnalysisService;
};

export const getPromptGenerationService = () => {
  if (!promptGenerationService || !servicesInitialized) {
    logger.warn('Prompt generation service not available, using fallback');
    return {
      generateRapidFirePrompts: () => [
        "Business is like", "Leadership is like", "Success is like", "Innovation is like"
      ],
      generateConductorTopics: () => [
        "The future of technology", "Sustainable development", "Global collaboration"
      ],
      generateTripleStepWords: () => [
        "elephant", "calculator", "rainbow", "spaceship", "chocolate"
      ]
    };
  }
  return promptGenerationService;
};

export const getFeedbackService = () => {
  if (!feedbackService || !servicesInitialized) {
    logger.warn('Feedback service not available, using fallback');
    return {
      generateFeedback: () => ({
        type: 'suggestion',
        message: 'Continue practicing to improve your skills'
      })
    };
  }
  return feedbackService;
};

export const getEnergyDetectionService = () => {
  if (!energyDetectionService || !servicesInitialized) {
    logger.warn('Energy detection service not available, using fallback');
    return {
      analyzeEnergyTransition: () => ({ success: true, score: 75 }),
      analyzeBreatheCueResponse: () => ({ success: true, score: 75 })
    };
  }
  return energyDetectionService;
};

export const getCoherenceAnalysisService = () => {
  if (!coherenceAnalysisService || !servicesInitialized) {
    logger.warn('Coherence analysis service not available, using fallback');
    return {
      analyzeWordIntegration: () => ({ success: true, score: 75 }),
      analyzeSpeechCoherence: () => ({ coherenceScore: 75 }),
      analyzeRapidFireCoherence: () => ({ overallCoherence: 75, strengths: ['Good effort'], improvements: ['Continue practicing'] })
    };
  }
  return coherenceAnalysisService;
};

export {
  SpeechAnalysisService,
  PromptGenerationService,
  FeedbackService,
  EnergyDetectionService,
  CoherenceAnalysisService
};
