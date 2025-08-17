import OpenAI from 'openai';
import { logger } from '../../utils/logger.js';

export class FeedbackService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.model = process.env.OPENAI_MODEL || 'gpt-4';
    this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS) || 1000;
  }

  async generatePersonalizedFeedback(userStats, gameType, recentPerformance, difficulty) {
    try {
      const feedbackPrompt = this.buildFeedbackPrompt(userStats, gameType, recentPerformance, difficulty);
      
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert public speaking coach providing personalized feedback and coaching advice. Be encouraging, specific, and actionable in your feedback. Focus on helping the user improve their skills progressively.`
          },
          {
            role: 'user',
            content: feedbackPrompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.4
      });

      const feedback = response.choices[0].message.content;
      return this.parseFeedbackResponse(feedback);
    } catch (error) {
      logger.error('Failed to generate personalized feedback:', error);
      return this.getDefaultFeedback(gameType, difficulty);
    }
  }

  buildFeedbackPrompt(userStats, gameType, recentPerformance, difficulty) {
    const prompt = `Generate personalized feedback for a public speaking student.

User Profile:
- Total Games Played: ${userStats.totalGamesPlayed}
- Average Score: ${userStats.averageScore}
- Best Score: ${userStats.bestScore}
- Total Time Spent: ${userStats.totalTimeSpent} seconds
- Current Difficulty: ${difficulty}

Recent Performance (${gameType}):
- Score: ${recentPerformance.score}
- Accuracy: ${recentPerformance.accuracy}%
- Speed: ${recentPerformance.speed}s
- Energy Consistency: ${recentPerformance.energyConsistency || 'N/A'}%
- Word Integration: ${recentPerformance.wordIntegration || 'N/A'}%

Game Type: ${gameType}

Please provide:
1. Overall assessment of their progress
2. Specific strengths to celebrate
3. Areas for improvement with actionable steps
4. Recommended next steps and practice exercises
5. Motivation and encouragement

Format your response as:
{
  "overallAssessment": "Your progress shows...",
  "strengths": ["Strength 1", "Strength 2"],
  "improvementAreas": [
    {
      "area": "Voice Projection",
      "description": "Your voice could be more...",
      "actionableSteps": ["Step 1", "Step 2"],
      "practiceExercises": ["Exercise 1", "Exercise 2"]
    }
  ],
  "nextSteps": ["Next step 1", "Next step 2"],
  "motivation": "Keep up the great work...",
  "recommendedDifficulty": "intermediate"
}`;

    return prompt;
  }

  async generateGameSpecificFeedback(gameType, performance, context) {
    try {
      let feedbackPrompt;
      
      switch (gameType) {
        case 'rapidFire':
          feedbackPrompt = this.buildRapidFireFeedbackPrompt(performance, context);
          break;
        case 'conductor':
          feedbackPrompt = this.buildConductorFeedbackPrompt(performance, context);
          break;
        case 'tripleStep':
          feedbackPrompt = this.buildTripleStepFeedbackPrompt(performance, context);
          break;
        default:
          feedbackPrompt = this.buildGeneralFeedbackPrompt(performance, context);
      }

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are a specialized public speaking coach for ${gameType} training. Provide specific, actionable feedback for this game type.`
          },
          {
            role: 'user',
            content: feedbackPrompt
          }
        ],
        max_tokens: 600,
        temperature: 0.3
      });

      return this.parseGameSpecificFeedback(response.choices[0].message.content, gameType);
    } catch (error) {
      logger.error(`Failed to generate ${gameType} feedback:`, error);
      return this.getDefaultGameFeedback(gameType);
    }
  }

  buildRapidFireFeedbackPrompt(performance, context) {
    return `Analyze this Rapid Fire Analogies performance:

Performance Metrics:
- Response Rate: ${performance.responseRate || 0}%
- Average Response Time: ${performance.averageResponseTime || 0}s
- Total Prompts: ${performance.totalPrompts || 0}
- Completed Responses: ${performance.completedResponses || 0}

Context: ${context || 'Standard rapid-fire training session'}

Provide specific feedback on:
1. Response speed and spontaneity
2. Creativity and originality
3. Clarity of expression
4. Areas for improvement
5. Practice recommendations

Format as JSON with: assessment, strengths, improvements, practiceTips`;
  }

  buildConductorFeedbackPrompt(performance, context) {
    return `Analyze this Conductor (Energy Modulation) performance:

Performance Metrics:
- Energy Transitions: ${performance.energyTransitions || 0}
- Average Energy Match: ${performance.averageEnergyMatch || 0}%
- Breathe Cues Followed: ${performance.breatheCuesFollowed || 0}
- Session Duration: ${performance.sessionDuration || 0}s

Context: ${context || 'Standard energy modulation training session'}

Provide specific feedback on:
1. Energy level adaptation
2. Voice modulation skills
3. Breathing technique
4. Areas for improvement
5. Practice recommendations

Format as JSON with: assessment, strengths, improvements, practiceTips`;
  }

  buildTripleStepFeedbackPrompt(performance, context) {
    return `Analyze this Triple Step (Word Integration) performance:

Performance Metrics:
- Words Integrated: ${performance.wordsIntegrated || 0}
- Integration Success: ${performance.integrationSuccess || 0}%
- Average Integration Time: ${performance.averageIntegrationTime || 0}s
- Session Duration: ${performance.sessionDuration || 0}s

Context: ${context || 'Standard word integration training session'}

Provide specific feedback on:
1. Word integration naturalness
2. Topic coherence maintenance
3. Speech flow preservation
4. Areas for improvement
5. Practice recommendations

Format as JSON with: assessment, strengths, improvements, practiceTips`;
  }

  buildGeneralFeedbackPrompt(performance, context) {
    return `Analyze this general public speaking performance:

Performance Metrics:
- Overall Score: ${performance.score || 0}
- Accuracy: ${performance.accuracy || 0}%
- Speed: ${performance.speed || 0}s
- Session Duration: ${performance.sessionDuration || 0}s

Context: ${context || 'General speaking training session'}

Provide comprehensive feedback on public speaking skills and improvement areas.`;
  }

  async generateProgressReport(userId, timeRange = 'month') {
    try {
      const prompt = `Generate a progress report for a public speaking student.

Time Range: ${timeRange}
Focus: Overall improvement, skill development, and next steps

Provide:
1. Progress summary
2. Key achievements
3. Skill development areas
4. Recommended focus areas
5. Next milestone goals

Format as a comprehensive progress report with actionable insights.`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a public speaking coach creating comprehensive progress reports.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 800,
        temperature: 0.3
      });

      return response.choices[0].message.content;
    } catch (error) {
      logger.error('Failed to generate progress report:', error);
      return this.getDefaultProgressReport();
    }
  }

  async generateMotivationalMessage(userStats, recentPerformance) {
    try {
      const prompt = `Generate a motivational message for a public speaking student.

Current Stats:
- Total Games: ${userStats.totalGamesPlayed}
- Average Score: ${userStats.averageScore}
- Recent Performance: ${recentPerformance.score}

Create an encouraging, personalized message that:
1. Celebrates their progress
2. Acknowledges their effort
3. Motivates continued practice
4. Sets positive expectations
5. Provides encouragement

Keep it concise but impactful.`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a motivational public speaking coach who inspires students to keep improving.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.7
      });

      return response.choices[0].message.content;
    } catch (error) {
      logger.error('Failed to generate motivational message:', error);
      return this.getDefaultMotivationalMessage();
    }
  }

  parseFeedbackResponse(feedbackText) {
    try {
      const jsonMatch = feedbackText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return this.fallbackFeedbackParsing(feedbackText);
    } catch (error) {
      logger.warn('Failed to parse feedback response, using fallback:', error);
      return this.fallbackFeedbackParsing(feedbackText);
    }
  }

  parseGameSpecificFeedback(feedbackText, gameType) {
    try {
      const jsonMatch = feedbackText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return this.getDefaultGameFeedback(gameType);
    } catch (error) {
      logger.warn('Failed to parse game-specific feedback, using default:', error);
      return this.getDefaultGameFeedback(gameType);
    }
  }

  fallbackFeedbackParsing(feedbackText) {
    return {
      overallAssessment: "Good progress in your public speaking journey",
      strengths: ["Consistent practice", "Willingness to learn"],
      improvementAreas: [
        {
          area: "General Speaking Skills",
          description: "Continue developing your core speaking abilities",
          actionableSteps: ["Practice daily", "Record yourself speaking"],
          practiceExercises: ["Mirror practice", "Tongue twisters"]
        }
      ],
      nextSteps: ["Continue regular practice", "Focus on one improvement area at a time"],
      motivation: "You're making great progress! Keep practicing and you'll see continued improvement.",
      recommendedDifficulty: "intermediate"
    };
  }

  getDefaultFeedback(gameType, difficulty) {
    return {
      overallAssessment: `Good work on your ${gameType} training!`,
      strengths: ["Consistent effort", "Good game completion"],
      improvementAreas: [
        {
          area: "Skill Development",
          description: "Focus on improving specific aspects of your speaking",
          actionableSteps: ["Practice regularly", "Focus on feedback"],
          practiceExercises: ["Daily speaking practice", "Record and review"]
        }
      ],
      nextSteps: ["Continue practicing", "Try different difficulty levels"],
      motivation: "Keep up the great work! Every practice session makes you better.",
      recommendedDifficulty: difficulty
    };
  }

  getDefaultGameFeedback(gameType) {
    const feedbacks = {
      rapidFire: {
        assessment: "Good work on rapid-fire responses!",
        strengths: ["Quick thinking", "Game completion"],
        improvements: ["Response clarity", "Creative analogies"],
        practiceTips: ["Practice with timer", "Record responses"]
      },
      conductor: {
        assessment: "Good energy modulation practice!",
        strengths: ["Game completion", "Energy awareness"],
        improvements: ["Smooth transitions", "Voice control"],
        practiceTips: ["Practice energy changes", "Focus on breathing"]
      },
      tripleStep: {
        assessment: "Good word integration practice!",
        strengths: ["Game completion", "Word usage"],
        improvements: ["Natural integration", "Topic flow"],
        practiceTips: ["Practice with random words", "Maintain topic focus"]
      }
    };

    return feedbacks[gameType] || feedbacks.rapidFire;
  }

  getDefaultProgressReport() {
    return `Progress Report Summary

You've been making steady progress in your public speaking journey. Your consistent practice is showing results, and you're developing important skills that will serve you well in various speaking situations.

Key Achievements:
- Regular practice sessions completed
- Improved game performance over time
- Growing confidence in speaking exercises

Focus Areas:
- Continue building on your strengths
- Practice regularly to maintain momentum
- Challenge yourself with new difficulty levels

Next Steps:
- Set specific goals for the coming period
- Focus on one improvement area at a time
- Celebrate your progress and stay motivated

Keep up the excellent work!`;
  }

  getDefaultMotivationalMessage() {
    return `Great job on your public speaking practice! 

Every time you step up to speak, you're building confidence and skill. Your dedication to improvement is inspiring, and you're making real progress.

Remember: The best speakers weren't born that way - they practiced, failed, learned, and tried again. You're on that same journey, and you're doing fantastic!

Keep practicing, stay curious, and believe in your ability to grow. You've got this! 🎯✨`;
  }
}
