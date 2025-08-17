import OpenAI from 'openai';
import { logger } from '../../utils/logger.js';

export class CoherenceAnalysisService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.model = process.env.OPENAI_MODEL || 'gpt-4';
    this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS) || 500;
  }

  async analyzeSpeechCoherence(speechTranscript, mainTopic, context = {}) {
    try {
      const analysisPrompt = this.buildCoherenceAnalysisPrompt(speechTranscript, mainTopic, context);
      
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert speech analyst specializing in coherence and topic adherence. Analyze the given speech transcript to determine how well it maintains coherence, stays on topic, and flows logically. Consider factors like logical progression, topic relevance, transition quality, and overall message clarity.`
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
      return this.parseCoherenceAnalysis(analysis);
    } catch (error) {
      logger.error('Speech coherence analysis failed:', error);
      return this.getDefaultCoherenceAnalysis();
    }
  }

  buildCoherenceAnalysisPrompt(speechTranscript, mainTopic, context) {
    const prompt = `Analyze the coherence and topic adherence of this speech:

Speech Transcript: "${speechTranscript}"

Main Topic: "${mainTopic}"

Context: ${context.gameType || 'General speaking training'} - ${context.additionalInfo || 'Standard coherence analysis'}

Please analyze:
1. Overall coherence score (1-100)
2. Topic adherence percentage
3. Logical flow quality
4. Transition effectiveness
5. Message clarity
6. Specific strengths and weaknesses
7. Areas for improvement

Provide analysis in this JSON format:
{
  "coherenceScore": 85,
  "topicAdherence": 90,
  "logicalFlow": "good",
  "transitions": "effective",
  "messageClarity": "clear",
  "strengths": ["Clear topic focus", "Logical progression"],
  "weaknesses": ["Some tangents", "Transition gaps"],
  "improvementAreas": ["Stay on topic", "Improve transitions"],
  "overallAssessment": "Good coherence with room for improvement"
}`;

    return prompt;
  }

  async analyzeWordIntegration(mainTopic, targetWord, speechContext, integrationTime) {
    try {
      const prompt = `Analyze how well a word was integrated into speech:

Main Topic: "${mainTopic}"
Target Word: "${targetWord}"
Speech Context: "${speechContext}"
Integration Time: ${integrationTime}ms

Evaluate:
1. Naturalness of integration (1-100)
2. Topic coherence maintained
3. Flow preservation
4. Creativity in usage
5. Overall integration quality

Provide analysis in JSON format:
{
  "integrationScore": 85,
  "naturalness": "good",
  "coherenceMaintained": true,
  "flowPreserved": true,
  "creativity": "moderate",
  "feedback": "Good integration, word fits naturally",
  "suggestions": ["Practice more", "Focus on flow"]
}`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a speech coach analyzing word integration exercises.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.3
      });

      return this.parseWordIntegrationAnalysis(response.choices[0].message.content);
    } catch (error) {
      logger.error('Word integration analysis failed:', error);
      return this.getDefaultWordIntegrationAnalysis();
    }
  }

  async analyzeTopicDeviation(speechSegments, mainTopic, timeStamps) {
    try {
      const prompt = `Analyze topic deviation across speech segments:

Main Topic: "${mainTopic}"

Speech Segments with Timestamps:
${speechSegments.map((segment, index) => `${timeStamps[index] || index}: "${segment}"`).join('\n')}

Analyze:
1. Overall topic adherence
2. Deviation patterns
3. Recovery effectiveness
4. Coherence maintenance
5. Specific deviation points

Provide analysis in JSON format:
{
  "overallAdherence": 85,
  "deviationPatterns": ["Brief tangents", "Quick recovery"],
  "recoveryEffectiveness": "good",
  "coherenceMaintained": true,
  "deviationPoints": ["Segment 2", "Segment 5"],
  "recommendations": ["Stay focused", "Practice transitions"]
}`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a topic adherence analyst for public speaking training.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      });

      return this.parseTopicDeviationAnalysis(response.choices[0].message.content);
    } catch (error) {
      logger.error('Topic deviation analysis failed:', error);
      return this.getDefaultTopicDeviationAnalysis();
    }
  }

  async analyzeSpeechStructure(speechTranscript, gameType) {
    try {
      const prompt = `Analyze the structure of this speech:

Speech: "${speechTranscript}"
Game Type: ${gameType}

Analyze:
1. Introduction effectiveness
2. Body organization
3. Conclusion quality
4. Overall structure coherence
5. Structural strengths and weaknesses

Provide analysis in JSON format:
{
  "structureScore": 80,
  "introduction": "adequate",
  "body": "good",
  "conclusion": "moderate",
  "overallCoherence": "good",
  "strengths": ["Clear body organization"],
  "weaknesses": ["Weak conclusion"],
  "improvements": ["Strengthen conclusion", "Improve introduction"]
}`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a speech structure analyst for public speaking training.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 400,
        temperature: 0.3
      });

      return this.parseStructureAnalysis(response.choices[0].message.content);
    } catch (error) {
      logger.error('Speech structure analysis failed:', error);
      return this.getDefaultStructureAnalysis();
    }
  }

  async generateCoherenceExercises(coherenceScore, improvementAreas, difficulty = 'beginner') {
    try {
      const prompt = `Generate coherence improvement exercises for a public speaking student.

Current Coherence Score: ${coherenceScore}/100
Improvement Areas: ${improvementAreas.join(', ')}
Difficulty: ${difficulty}

Create specific exercises that help improve:
1. Topic adherence
2. Logical flow
3. Transition quality
4. Message clarity
5. Structure organization

Format as JSON with: topicAdherence, logicalFlow, transitions, messageClarity, structure, practiceScenarios`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a speech coach creating coherence improvement exercises.'
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
      logger.error('Failed to generate coherence exercises:', error);
      return this.getDefaultCoherenceExercises(difficulty);
    }
  }

  async analyzeRapidFireCoherence(prompts, responses, responseTimes) {
    try {
      const prompt = `Analyze the coherence of rapid-fire analogy responses:

Prompts and Responses:
${prompts.map((p, i) => `Prompt: "${p}"\nResponse: "${responses[i] || 'No response'}"\nTime: ${responseTimes[i] || 0}ms`).join('\n\n')}

Analyze:
1. Response relevance to prompts
2. Consistency in analogy quality
3. Logical connection strength
4. Creativity and originality
5. Overall coherence pattern

Provide analysis in JSON format:
{
  "overallCoherence": 80,
  "responseRelevance": "good",
  "consistency": "moderate",
  "logicalConnections": "strong",
  "creativity": "good",
  "pattern": "consistent improvement",
  "feedback": "Good responses with room for growth"
}`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a rapid-fire response analyst for public speaking training.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.3
      });

      return this.parseRapidFireAnalysis(response.choices[0].message.content);
    } catch (error) {
      logger.error('Rapid fire coherence analysis failed:', error);
      return this.getDefaultRapidFireAnalysis();
    }
  }

  parseCoherenceAnalysis(analysisText) {
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return this.fallbackCoherenceParsing(analysisText);
    } catch (error) {
      logger.warn('Failed to parse coherence analysis, using fallback:', error);
      return this.fallbackCoherenceParsing(analysisText);
    }
  }

  parseWordIntegrationAnalysis(analysisText) {
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return this.getDefaultWordIntegrationAnalysis();
    } catch (error) {
      logger.warn('Failed to parse word integration analysis, using default:', error);
      return this.getDefaultWordIntegrationAnalysis();
    }
  }

  parseTopicDeviationAnalysis(analysisText) {
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return this.getDefaultTopicDeviationAnalysis();
    } catch (error) {
      logger.warn('Failed to parse topic deviation analysis, using default:', error);
      return this.getDefaultTopicDeviationAnalysis();
    }
  }

  parseStructureAnalysis(analysisText) {
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return this.getDefaultStructureAnalysis();
    } catch (error) {
      logger.warn('Failed to parse structure analysis, using default:', error);
      return this.getDefaultStructureAnalysis();
    }
  }

  parseExerciseResponse(responseText) {
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return this.getDefaultCoherenceExercises('beginner');
    } catch (error) {
      logger.warn('Failed to parse exercise response, using default:', error);
      return this.getDefaultCoherenceExercises('beginner');
    }
  }

  parseRapidFireAnalysis(analysisText) {
    try {
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return this.getDefaultRapidFireAnalysis();
    } catch (error) {
      logger.warn('Failed to parse rapid fire analysis, using default:', error);
      return this.getDefaultRapidFireAnalysis();
    }
  }

  fallbackCoherenceParsing(analysisText) {
    // Extract numerical scores using regex
    const coherenceMatch = analysisText.match(/coherence.*?(\d+)/i);
    const adherenceMatch = analysisText.match(/adherence.*?(\d+)/i);
    
    return {
      coherenceScore: parseInt(coherenceMatch?.[1]) || 75,
      topicAdherence: parseInt(adherenceMatch?.[1]) || 75,
      logicalFlow: "moderate",
      transitions: "adequate",
      messageClarity: "moderate",
      strengths: ["Good effort", "Clear communication"],
      weaknesses: ["Room for improvement", "Focus needed"],
      improvementAreas: ["Practice coherence", "Stay on topic"],
      overallAssessment: "Good effort with room for improvement"
    };
  }

  getDefaultCoherenceAnalysis() {
    return {
      coherenceScore: 75,
      topicAdherence: 75,
      logicalFlow: "moderate",
      transitions: "adequate",
      messageClarity: "moderate",
      strengths: ["Good effort", "Clear communication"],
      weaknesses: ["Room for improvement", "Focus needed"],
      improvementAreas: ["Practice coherence", "Stay on topic"],
      overallAssessment: "Good effort with room for improvement"
    };
  }

  getDefaultWordIntegrationAnalysis() {
    return {
      integrationScore: 75,
      naturalness: "moderate",
      coherenceMaintained: true,
      flowPreserved: true,
      creativity: "moderate",
      feedback: "Good integration effort",
      suggestions: ["Practice more", "Focus on natural flow"]
    };
  }

  getDefaultTopicDeviationAnalysis() {
    return {
      overallAdherence: 75,
      deviationPatterns: ["Minor tangents", "Quick recovery"],
      recoveryEffectiveness: "moderate",
      coherenceMaintained: true,
      deviationPoints: ["Some segments"],
      recommendations: ["Stay focused", "Practice transitions"]
    };
  }

  getDefaultStructureAnalysis() {
    return {
      structureScore: 75,
      introduction: "moderate",
      body: "good",
      conclusion: "moderate",
      overallCoherence: "moderate",
      strengths: ["Good body organization"],
      weaknesses: ["Weak introduction", "Poor conclusion"],
      improvements: ["Strengthen introduction", "Improve conclusion"]
    };
  }

  getDefaultCoherenceExercises(difficulty) {
    return {
      topicAdherence: [
        "Practice staying on one topic for 2 minutes",
        "Use topic sentences to guide speech",
        "Practice topic transitions"
      ],
      logicalFlow: [
        "Outline your speech before speaking",
        "Use transition words and phrases",
        "Practice logical progression exercises"
      ],
      transitions: [
        "Practice connecting ideas smoothly",
        "Use bridge sentences between topics",
        "Practice pause and transition timing"
      ],
      messageClarity: [
        "Practice clear main points",
        "Use examples to illustrate ideas",
        "Practice summarizing key messages"
      ],
      structure: [
        "Practice introduction-body-conclusion format",
        "Use signposting language",
        "Practice structural transitions"
      ],
      practiceScenarios: [
        "Impromptu speaking on assigned topics",
        "Topic switching exercises",
        "Coherence maintenance challenges"
      ]
    };
  }

  getDefaultRapidFireAnalysis() {
    return {
      overallCoherence: 75,
      responseRelevance: "moderate",
      consistency: "moderate",
      logicalConnections: "moderate",
      creativity: "moderate",
      pattern: "consistent effort",
      feedback: "Good responses with room for improvement"
    };
  }

  // Utility method to calculate coherence score
  calculateCoherenceScore(topicAdherence, logicalFlow, transitions, messageClarity) {
    const flowScore = logicalFlow === 'excellent' ? 100 : 
                     logicalFlow === 'good' ? 85 :
                     logicalFlow === 'moderate' ? 70 : 50;
    
    const transitionScore = transitions === 'excellent' ? 100 : 
                           transitions === 'good' ? 85 :
                           transitions === 'moderate' ? 70 : 50;
    
    const clarityScore = messageClarity === 'excellent' ? 100 : 
                        messageClarity === 'good' ? 85 :
                        messageClarity === 'moderate' ? 70 : 50;
    
    return Math.round((topicAdherence + flowScore + transitionScore + clarityScore) / 4);
  }
}
