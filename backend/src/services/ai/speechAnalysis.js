import OpenAI from 'openai';
import { logger } from '../../utils/logger.js';

export class SpeechAnalysisService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    this.model = process.env.OPENAI_MODEL || 'gpt-4';
    this.maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS) || 1000;
  }

  async testConnection() {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 5
      });
      logger.info('OpenAI connection test successful');
      return true;
    } catch (error) {
      logger.error('OpenAI connection test failed:', error);
      throw error;
    }
  }

  async analyzeSpeechQuality(transcript, gameType, context = {}) {
    try {
      const analysisPrompt = this.buildAnalysisPrompt(transcript, gameType, context);
      
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: `You are an expert public speaking coach and speech analyst. Analyze the given speech transcript and provide detailed feedback on various aspects of public speaking. Be constructive, specific, and actionable in your feedback.`
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
      return this.parseAnalysisResponse(analysis);
    } catch (error) {
      logger.error('Speech analysis failed:', error);
      throw new Error('Failed to analyze speech quality');
    }
  }

  buildAnalysisPrompt(transcript, gameType, context) {
    let basePrompt = `Please analyze the following speech transcript for a ${gameType} game session:\n\n"${transcript}"\n\n`;
    
    switch (gameType) {
      case 'rapidFire':
        basePrompt += `Context: This is from a rapid-fire analogy game where users must complete analogies quickly. Focus on:
        - Response speed and spontaneity
        - Creativity and originality
        - Clarity of expression
        - Confidence in delivery
        - Ability to think on feet`;
        break;
        
      case 'conductor':
        basePrompt += `Context: This is from an energy modulation game where users must match energy levels. Focus on:
        - Energy consistency and variation
        - Voice modulation and dynamics
        - Emotional expression
        - Breathing and pacing
        - Adaptability to energy changes`;
        break;
        
      case 'tripleStep':
        basePrompt += `Context: This is from a word integration game where users must weave random words into their speech. Focus on:
        - Topic coherence and flow
        - Natural word integration
        - Speech continuity
        - Adaptability and flexibility
        - Maintaining message clarity`;
        break;
    }

    basePrompt += `\n\nPlease provide analysis in the following JSON format:
    {
      "overallRating": 85,
      "speechClarity": 80,
      "energyLevel": 75,
      "coherence": 90,
      "confidence": 85,
      "fluency": 80,
      "strengths": ["Clear articulation", "Good pacing"],
      "areasForImprovement": ["Voice projection", "Energy variation"],
      "feedback": [
        {
          "type": "positive",
          "message": "Excellent topic coherence and natural flow"
        },
        {
          "type": "improvement",
          "message": "Consider varying your speaking pace for better engagement"
        }
      ],
      "score": 85,
      "detailedAnalysis": "Your speech demonstrates strong coherence and natural integration of concepts..."
    }`;

    return basePrompt;
  }

  parseAnalysisResponse(analysisText) {
    try {
      // Try to extract JSON from the response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback parsing if JSON extraction fails
      return this.fallbackParsing(analysisText);
    } catch (error) {
      logger.warn('Failed to parse AI analysis response, using fallback:', error);
      return this.fallbackParsing(analysisText);
    }
  }

  fallbackParsing(analysisText) {
    // Extract numerical scores using regex
    const scoreMatch = analysisText.match(/overall.*?(\d+)/i);
    const clarityMatch = analysisText.match(/clarity.*?(\d+)/i);
    const energyMatch = analysisText.match(/energy.*?(\d+)/i);
    const coherenceMatch = analysisText.match(/coherence.*?(\d+)/i);
    const confidenceMatch = analysisText.match(/confidence.*?(\d+)/i);
    const fluencyMatch = analysisText.match(/fluency.*?(\d+)/i);

    return {
      overallRating: parseInt(scoreMatch?.[1]) || 75,
      speechClarity: parseInt(clarityMatch?.[1]) || 75,
      energyLevel: parseInt(energyMatch?.[1]) || 75,
      coherence: parseInt(coherenceMatch?.[1]) || 75,
      confidence: parseInt(confidenceMatch?.[1]) || 75,
      fluency: parseInt(fluencyMatch?.[1]) || 75,
      strengths: ['Good effort', 'Clear communication'],
      areasForImprovement: ['Continue practicing', 'Focus on energy variation'],
      feedback: [
        {
          type: 'positive',
          message: 'Good effort in completing the exercise'
        },
        {
          type: 'suggestion',
          message: 'Continue practicing to improve your skills'
        }
      ],
      score: parseInt(scoreMatch?.[1]) || 75,
      detailedAnalysis: analysisText
    };
  }

  async analyzeRapidFireResponse(prompt, response, responseTime) {
    try {
      const analysisPrompt = `Analyze this rapid-fire analogy response:

Prompt: "${prompt}"
Response: "${response}"
Response Time: ${responseTime}ms

Evaluate:
1. Creativity and originality (1-100)
2. Relevance to the prompt (1-100)
3. Clarity and coherence (1-100)
4. Speed appropriateness (1-100)

Provide scores and brief feedback.`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a public speaking coach evaluating rapid-fire responses. Be encouraging but honest.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_tokens: 300,
        temperature: 0.3
      });

      return this.parseRapidFireAnalysis(response.choices[0].message.content);
    } catch (error) {
      logger.error('Rapid fire analysis failed:', error);
      return this.getDefaultRapidFireAnalysis();
    }
  }

  parseRapidFireAnalysis(analysisText) {
    try {
      const creativityMatch = analysisText.match(/creativity.*?(\d+)/i);
      const relevanceMatch = analysisText.match(/relevance.*?(\d+)/i);
      const clarityMatch = analysisText.match(/clarity.*?(\d+)/i);
      const speedMatch = analysisText.match(/speed.*?(\d+)/i);

      return {
        creativity: parseInt(creativityMatch?.[1]) || 75,
        relevance: parseInt(relevanceMatch?.[1]) || 75,
        clarity: parseInt(clarityMatch?.[1]) || 75,
        speed: parseInt(speedMatch?.[1]) || 75,
        overallQuality: Math.round((
          (parseInt(creativityMatch?.[1]) || 75) +
          (parseInt(relevanceMatch?.[1]) || 75) +
          (parseInt(clarityMatch?.[1]) || 75) +
          (parseInt(speedMatch?.[1]) || 75)
        ) / 4)
      };
    } catch (error) {
      return this.getDefaultRapidFireAnalysis();
    }
  }

  getDefaultRapidFireAnalysis() {
    return {
      creativity: 75,
      relevance: 75,
      clarity: 75,
      speed: 75,
      overallQuality: 75
    };
  }

  async analyzeEnergyTransition(fromLevel, toLevel, speechSegment) {
    try {
      const analysisPrompt = `Analyze this energy transition in speech:

From Energy Level: ${fromLevel}/9
To Energy Level: ${toLevel}/9
Speech Segment: "${speechSegment}"

Evaluate how well the speaker adapted their energy level. Consider:
- Voice volume and intensity
- Speaking pace and rhythm
- Emotional expression
- Smoothness of transition

Rate the transition success (1-100) and provide feedback.`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a voice coach evaluating energy transitions in speech.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_tokens: 200,
        temperature: 0.3
      });

      return this.parseEnergyTransitionAnalysis(response.choices[0].message.content);
    } catch (error) {
      logger.error('Energy transition analysis failed:', error);
      return { success: true, score: 75, feedback: 'Good energy transition' };
    }
  }

  parseEnergyTransitionAnalysis(analysisText) {
    try {
      const scoreMatch = analysisText.match(/(\d+)/);
      const successMatch = analysisText.match(/(successful|good|excellent|poor|failed)/i);
      
      return {
        success: !successMatch || !['poor', 'failed'].includes(successMatch[1].toLowerCase()),
        score: parseInt(scoreMatch?.[1]) || 75,
        feedback: analysisText.substring(0, 100) + '...'
      };
    } catch (error) {
      return { success: true, score: 75, feedback: 'Good energy transition' };
    }
  }

  async analyzeWordIntegration(mainTopic, word, speechContext) {
    try {
      const analysisPrompt = `Analyze this word integration in speech:

Main Topic: "${mainTopic}"
Word to Integrate: "${word}"
Speech Context: "${speechContext}"

Evaluate how naturally and effectively the word was integrated:
- Seamlessness of integration (1-100)
- Topic coherence maintained (1-100)
- Natural flow preservation (1-100)
- Creativity in usage (1-100)

Provide scores and brief feedback.`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a speech coach evaluating word integration exercises.'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        max_tokens: 200,
        temperature: 0.3
      });

      return this.parseWordIntegrationAnalysis(response.choices[0].message.content);
    } catch (error) {
      logger.error('Word integration analysis failed:', error);
      return { success: true, score: 75, feedback: 'Good word integration' };
    }
  }

  parseWordIntegrationAnalysis(analysisText) {
    try {
      const seamlessnessMatch = analysisText.match(/seamlessness.*?(\d+)/i);
      const coherenceMatch = analysisText.match(/coherence.*?(\d+)/i);
      const flowMatch = analysisText.match(/flow.*?(\d+)/i);
      const creativityMatch = analysisText.match(/creativity.*?(\d+)/i);

      const seamlessness = parseInt(seamlessnessMatch?.[1]) || 75;
      const coherence = parseInt(coherenceMatch?.[1]) || 75;
      const flow = parseInt(flowMatch?.[1]) || 75;
      const creativity = parseInt(creativityMatch?.[1]) || 75;

      return {
        success: (seamlessness + coherence + flow + creativity) / 4 >= 60,
        score: Math.round((seamlessness + coherence + flow + creativity) / 4),
        seamlessness,
        coherence,
        flow,
        creativity,
        feedback: analysisText.substring(0, 100) + '...'
      };
    } catch (error) {
      return { success: true, score: 75, feedback: 'Good word integration' };
    }
  }
}
