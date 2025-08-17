import OpenAI from 'openai';
import { logger } from '../../utils/logger.js';

export class EnergyDetectionService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.model = process.env.OPENAI_MODEL || 'gpt-4';
    this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS) || 500;
  }

  async analyzeVoiceEnergy(audioTranscript, targetEnergyLevel, context = {}) {
    try {
      const analysisPrompt = this.buildEnergyAnalysisPrompt(audioTranscript, targetEnergyLevel, context);
      
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert voice coach and energy analyst. Analyze the given speech transcript to determine the energy level and how well it matches the target energy level. Consider factors like word choice, sentence structure, emotional intensity, and overall tone.`
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.3
      });

      const analysis = response.choices[0].message.content;
      return this.parseEnergyAnalysis(analysis, targetEnergyLevel);
    } catch (error) {
      logger.error('Voice energy analysis failed:', error);
      return this.getDefaultEnergyAnalysis(targetEnergyLevel);
    }
  }

  buildEnergyAnalysisPrompt(audioTranscript, targetEnergyLevel, context) {
    const energyDescriptions = {
      1: "very quiet, whisper-like, introspective",
      2: "quiet, calm, reflective",
      3: "soft, gentle, conversational",
      4: "moderate, balanced, everyday speech",
      5: "normal, conversational, neutral",
      6: "energetic, enthusiastic, engaging",
      7: "high energy, passionate, dynamic",
      8: "very high energy, powerful, intense",
      9: "maximum energy, explosive, dramatic"
    };

    const prompt = `Analyze the energy level of this speech transcript:

Speech: "${audioTranscript}"

Target Energy Level: ${targetEnergyLevel}/9 (${energyDescriptions[targetEnergyLevel]})

Context: ${context.gameType || 'Energy modulation training'} - ${context.additionalInfo || 'Standard energy training session'}

Please analyze:
1. Current energy level (1-9 scale)
2. How well it matches the target level
3. Energy consistency throughout the speech
4. Specific indicators of energy level
5. Suggestions for energy adjustment

Provide analysis in this JSON format:
{
  "detectedEnergyLevel": 6,
  "energyMatch": 85,
  "consistency": "good",
  "indicators": ["enthusiastic tone", "dynamic word choice"],
  "adjustmentNeeded": "slight increase",
  "suggestions": ["raise voice slightly", "add more enthusiasm"],
  "overallAssessment": "Good energy level, close to target"
}`;

    return prompt;
  }

  async analyzeEnergyTransition(fromLevel, toLevel, speechSegment, transitionTime) {
    try {
      const prompt = `Analyze this energy transition in speech:

From Energy Level: ${fromLevel}/9
To Energy Level: ${toLevel}/9
Speech Segment: "${speechSegment}"
Transition Time: ${transitionTime}ms

Evaluate:
1. How smoothly the transition was executed
2. Whether the energy change was appropriate
3. Naturalness of the transition
4. Effectiveness of the energy modulation

Provide analysis in JSON format:
{
  "transitionSuccess": true,
  "smoothness": 85,
  "naturalness": "good",
  "effectiveness": "effective",
  "feedback": "Smooth transition with appropriate energy change",
  "suggestions": ["Maintain this smoothness", "Practice timing"]
}`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a voice coach specializing in energy transitions and modulation.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.3
      });

      return this.parseTransitionAnalysis(response.choices[0].message.content);
    } catch (error) {
      logger.error('Energy transition analysis failed:', error);
      return this.getDefaultTransitionAnalysis(fromLevel, toLevel);
    }
  }

  async analyzeBreatheCueResponse(breatheCue, speechBefore, speechAfter, responseTime) {
    try {
      const prompt = `Analyze this breathing cue response:

Breathe Cue: "${breatheCue}"
Speech Before Cue: "${speechBefore}"
Speech After Cue: "${speechAfter}"
Response Time: ${responseTime}ms

Evaluate:
1. Whether the breathing cue was followed appropriately
2. Quality of the pause and reset
3. Energy adjustment after the breath
4. Overall effectiveness of the breathing technique

Provide analysis in JSON format:
{
  "cueFollowed": true,
  "pauseQuality": "good",
  "resetEffectiveness": "effective",
  "energyAdjustment": "appropriate",
  "overallScore": 85,
  "feedback": "Good use of breathing cue for energy reset",
  "suggestions": ["Practice longer breaths", "Use for energy transitions"]
}`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a breathing and voice coach analyzing breathing cue responses.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.3
      });

      return this.parseBreatheCueAnalysis(response.choices[0].message.content);
    } catch (error) {
      logger.error('Breathe cue analysis failed:', error);
      return this.getDefaultBreatheCueAnalysis();
    }
  }

  async generateEnergyModulationExercises(currentLevel, targetLevel, difficulty = 'beginner') {
    try {
      const prompt = `Generate energy modulation exercises for a public speaking student.

Current Energy Level: ${currentLevel}/9
Target Energy Level: ${targetLevel}/9
Difficulty: ${difficulty}

Create specific exercises that help transition from current to target energy level. Include:
1. Voice exercises
2. Breathing techniques
3. Physical movements
4. Mental preparation
5. Practice scenarios

Format as JSON with: exercises, breathingTechniques, physicalMovements, mentalPrep, practiceScenarios`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a voice coach creating energy modulation exercises.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 600,
        temperature: 0.4
      });

      return this.parseExerciseResponse(response.choices[0].message.content);
    } catch (error) {
      logger.error('Failed to generate energy exercises:', error);
      return this.getDefaultEnergyExercises(currentLevel, targetLevel, difficulty);
    }
  }

  async analyzeEnergyPattern(speechSegments, energyLevels) {
    try {
      const prompt = `Analyze the energy pattern across multiple speech segments:

Speech Segments: ${JSON.stringify(speechSegments)}
Energy Levels: ${JSON.stringify(energyLevels)}

Analyze:
1. Energy consistency patterns
2. Transition effectiveness
3. Overall energy range
4. Areas for improvement
5. Strengths in energy modulation

Provide comprehensive analysis in JSON format.`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are an energy pattern analyst for public speaking training.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      });

      return this.parsePatternAnalysis(response.choices[0].message.content);
    } catch (error) {
      logger.error('Energy pattern analysis failed:', error);
      return this.getDefaultPatternAnalysis();
    }
  }

  parseEnergyAnalysis(analysisText, targetLevel) {
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[0]);
        return {
          ...analysis,
          targetEnergyLevel: targetLevel,
          timestamp: new Date().toISOString()
        };
      }
      return this.fallbackEnergyParsing(analysisText, targetLevel);
    } catch (error) {
      logger.warn('Failed to parse energy analysis, using fallback:', error);
      return this.fallbackEnergyParsing(analysisText, targetLevel);
    }
  }

  parseTransitionAnalysis(analysisText) {
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return this.getDefaultTransitionAnalysis(5, 7);
    } catch (error) {
      logger.warn('Failed to parse transition analysis, using default:', error);
      return this.getDefaultTransitionAnalysis(5, 7);
    }
  }

  parseBreatheCueAnalysis(analysisText) {
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return this.getDefaultBreatheCueAnalysis();
    } catch (error) {
      logger.warn('Failed to parse breathe cue analysis, using default:', error);
      return this.getDefaultBreatheCueAnalysis();
    }
  }

  parseExerciseResponse(responseText) {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return this.getDefaultEnergyExercises(5, 7, 'beginner');
    } catch (error) {
      logger.warn('Failed to parse exercise response, using default:', error);
      return this.getDefaultEnergyExercises(5, 7, 'beginner');
    }
  }

  parsePatternAnalysis(analysisText) {
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return this.getDefaultPatternAnalysis();
    } catch (error) {
      logger.warn('Failed to parse pattern analysis, using default:', error);
      return this.getDefaultPatternAnalysis();
    }
  }

  fallbackEnergyParsing(analysisText, targetLevel) {
    // Extract numerical scores using regex
    const levelMatch = analysisText.match(/level.*?(\d+)/i);
    const matchMatch = analysisText.match(/match.*?(\d+)/i);
    
    return {
      detectedEnergyLevel: parseInt(levelMatch?.[1]) || Math.floor(Math.random() * 9) + 1,
      energyMatch: parseInt(matchMatch?.[1]) || 75,
      consistency: "moderate",
      indicators: ["voice tone", "word choice"],
      adjustmentNeeded: "moderate",
      suggestions: ["practice energy modulation", "focus on target level"],
      overallAssessment: "Good effort in energy training",
      targetEnergyLevel: targetLevel,
      timestamp: new Date().toISOString()
    };
  }

  getDefaultEnergyAnalysis(targetLevel) {
    return {
      detectedEnergyLevel: Math.floor(Math.random() * 9) + 1,
      energyMatch: 75,
      consistency: "moderate",
      indicators: ["voice tone", "speaking pace"],
      adjustmentNeeded: "moderate",
      suggestions: ["practice energy modulation", "focus on target level"],
      overallAssessment: "Good effort in energy training",
      targetEnergyLevel: targetLevel,
      timestamp: new Date().toISOString()
    };
  }

  getDefaultTransitionAnalysis(fromLevel, toLevel) {
    return {
      transitionSuccess: true,
      smoothness: 75,
      naturalness: "moderate",
      effectiveness: "effective",
      feedback: "Good energy transition",
      suggestions: ["Practice timing", "Focus on smoothness"]
    };
  }

  getDefaultBreatheCueAnalysis() {
    return {
      cueFollowed: true,
      pauseQuality: "moderate",
      resetEffectiveness: "effective",
      energyAdjustment: "appropriate",
      overallScore: 75,
      feedback: "Good use of breathing cue",
      suggestions: ["Practice longer breaths", "Use for energy transitions"]
    };
  }

  getDefaultEnergyExercises(currentLevel, targetLevel, difficulty) {
    return {
      exercises: [
        "Practice speaking at different volumes",
        "Use emotional triggers for energy changes",
        "Practice energy transitions with timer"
      ],
      breathingTechniques: [
        "Deep diaphragmatic breathing",
        "Quick energy breaths",
        "Calming reset breaths"
      ],
      physicalMovements: [
        "Hand gestures for energy",
        "Body posture changes",
        "Facial expression variations"
      ],
      mentalPrep: [
        "Visualize energy levels",
        "Use emotional memory",
        "Focus on intention"
      ],
      practiceScenarios: [
        "Energy level callouts",
        "Emotional storytelling",
        "Dynamic presentations"
      ]
    };
  }

  getDefaultPatternAnalysis() {
    return {
      consistency: "moderate",
      transitionEffectiveness: "good",
      energyRange: "adequate",
      improvementAreas: ["Consistency", "Smooth transitions"],
      strengths: ["Energy awareness", "Willingness to adapt"],
      recommendations: ["Practice regular transitions", "Focus on consistency"]
    };
  }

  // Utility method to calculate energy score
  calculateEnergyScore(detectedLevel, targetLevel, consistency, smoothness) {
    const levelAccuracy = Math.max(0, 100 - Math.abs(detectedLevel - targetLevel) * 10);
    const consistencyScore = consistency === 'excellent' ? 100 : 
                            consistency === 'good' ? 85 :
                            consistency === 'moderate' ? 70 : 50;
    const smoothnessScore = smoothness || 75;
    
    return Math.round((levelAccuracy + consistencyScore + smoothnessScore) / 3);
  }
}
