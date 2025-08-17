import OpenAI from 'openai';
import { logger } from '../../utils/logger.js';

export class PromptGenerationService {
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
      logger.info('OpenAI connection test successful for prompt generation');
      return true;
    } catch (error) {
      logger.error('OpenAI connection test failed for prompt generation:', error);
      throw error;
    }
  }

  async generateRapidFirePrompts(count = 10, difficulty = 'beginner', theme = null) {
    try {
      const prompt = `Generate ${count} creative analogy prompts for a public speaking training game.

Difficulty: ${difficulty}
${theme ? `Theme: ${theme}` : 'Theme: General business and life concepts'}

Requirements:
- Each prompt should be an incomplete analogy that starts with "X is like"
- Prompts should be appropriate for the difficulty level
- Vary between abstract and concrete concepts
- Make them engaging and thought-provoking
- Avoid overly complex or controversial topics

Difficulty guidelines:
- Beginner: Simple, everyday concepts (e.g., "Success is like", "Friendship is like")
- Intermediate: Business and personal development concepts (e.g., "Leadership is like", "Innovation is like")
- Advanced: Abstract and complex concepts (e.g., "Time is like", "Change is like")
- Expert: Philosophical and challenging concepts (e.g., "Truth is like", "Existence is like")

Please provide the prompts in this exact format:
[
  "Success is like",
  "Leadership is like",
  "Innovation is like"
]`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a creative writing expert specializing in analogy prompts for public speaking training.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.8
      });

      const prompts = this.parsePromptsResponse(response.choices[0].message.content);
      return prompts.slice(0, count);
    } catch (error) {
      logger.error('Failed to generate rapid fire prompts:', error);
      return this.getFallbackRapidFirePrompts(count, difficulty);
    }
  }

  async generateConductorTopics(count = 5, difficulty = 'beginner') {
    try {
      const prompt = `Generate ${count} engaging speaking topics for an energy modulation training game.

Difficulty: ${difficulty}
Game Purpose: Users must speak about these topics while adapting their energy levels on command.

Requirements:
- Topics should be engaging and relatable
- Appropriate for the difficulty level
- Allow for natural energy variation
- Not too controversial or sensitive
- Encourage personal reflection and storytelling

Difficulty guidelines:
- Beginner: Simple, everyday topics (e.g., "My favorite hobby", "A memorable vacation")
- Intermediate: Personal development topics (e.g., "The importance of teamwork", "How I overcame a challenge")
- Advanced: Complex, thought-provoking topics (e.g., "The future of technology", "Balancing work and life")
- Expert: Philosophical or abstract topics (e.g., "The meaning of success", "Human nature and society")

Please provide the topics in this exact format:
[
  "My favorite hobby and why I love it",
  "A memorable vacation experience",
  "The importance of teamwork in my life"
]`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a public speaking coach creating engaging topics for energy modulation training.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.7
      });

      const topics = this.parseTopicsResponse(response.choices[0].message.content);
      return topics.slice(0, count);
    } catch (error) {
      logger.error('Failed to generate conductor topics:', error);
      return this.getFallbackConductorTopics(count, difficulty);
    }
  }

  async generateTripleStepWords(mainTopic, count = 6, difficulty = 'beginner') {
    try {
      const prompt = `Generate ${count} random words for a word integration speaking game.

Main Topic: "${mainTopic}"
Difficulty: ${difficulty}
Game Purpose: Users must naturally integrate these words into their speech about the main topic.

Requirements:
- Words should be diverse in type (nouns, adjectives, verbs)
- Mix concrete and abstract concepts
- Appropriate difficulty level
- Not too obscure or technical
- Allow for creative integration

Difficulty guidelines:
- Beginner: Simple, everyday words (e.g., "book", "happy", "run")
- Intermediate: Common but varied words (e.g., "adventure", "wisdom", "transform")
- Advanced: More complex or abstract words (e.g., "serendipity", "resilience", "synthesize")
- Expert: Challenging or specialized words (e.g., "ephemeral", "quintessential", "metamorphosis")

Please provide the words in this exact format:
[
  "adventure",
  "wisdom",
  "transform",
  "serendipity",
  "resilience",
  "synthesize"
]`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a vocabulary expert creating word lists for public speaking integration exercises.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.8
      });

      const words = this.parseWordsResponse(response.choices[0].message.content);
      return words.slice(0, count);
    } catch (error) {
      logger.error('Failed to generate triple step words:', error);
      return this.getFallbackTripleStepWords(count, difficulty);
    }
  }

  async generateCustomPrompt(category, difficulty, specificRequest = null) {
    try {
      let prompt = `Generate a custom ${category} prompt for public speaking training.

Category: ${category}
Difficulty: ${difficulty}
${specificRequest ? `Specific Request: ${specificRequest}` : ''}

Please provide a creative, engaging prompt that fits the category and difficulty level.`;

      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a creative writing expert specializing in public speaking prompts and exercises.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      return response.choices[0].message.content.trim();
    } catch (error) {
      logger.error('Failed to generate custom prompt:', error);
      return this.getFallbackCustomPrompt(category, difficulty);
    }
  }

  parsePromptsResponse(responseText) {
    try {
      // Try to extract JSON array from the response
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const prompts = JSON.parse(jsonMatch[0]);
        if (Array.isArray(prompts)) {
          return prompts;
        }
      }
      
      // Fallback: extract prompts using regex
      const promptMatches = responseText.match(/"([^"]+ is like)"/g);
      if (promptMatches) {
        return promptMatches.map(match => match.replace(/"/g, ''));
      }
      
      return this.getFallbackRapidFirePrompts(10, 'beginner');
    } catch (error) {
      logger.warn('Failed to parse prompts response, using fallback:', error);
      return this.getFallbackRapidFirePrompts(10, 'beginner');
    }
  }

  parseTopicsResponse(responseText) {
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const topics = JSON.parse(jsonMatch[0]);
        if (Array.isArray(topics)) {
          return topics;
        }
      }
      
      return this.getFallbackConductorTopics(5, 'beginner');
    } catch (error) {
      logger.warn('Failed to parse topics response, using fallback:', error);
      return this.getFallbackConductorTopics(5, 'beginner');
    }
  }

  parseWordsResponse(responseText) {
    try {
      const jsonMatch = responseText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const words = JSON.parse(jsonMatch[0]);
        if (Array.isArray(words)) {
          return words;
        }
      }
      
      return this.getFallbackTripleStepWords(6, 'beginner');
    } catch (error) {
      logger.warn('Failed to parse words response, using fallback:', error);
      return this.getFallbackTripleStepWords(6, 'beginner');
    }
  }

  getFallbackRapidFirePrompts(count, difficulty) {
    const prompts = {
      beginner: [
        "Success is like",
        "Friendship is like",
        "Learning is like",
        "Teamwork is like",
        "Creativity is like",
        "Patience is like",
        "Growth is like",
        "Communication is like",
        "Trust is like",
        "Change is like"
      ],
      intermediate: [
        "Leadership is like",
        "Innovation is like",
        "Problem-solving is like",
        "Adaptability is like",
        "Collaboration is like",
        "Resilience is like",
        "Vision is like",
        "Excellence is like",
        "Balance is like",
        "Progress is like"
      ],
      advanced: [
        "Time is like",
        "Truth is like",
        "Wisdom is like",
        "Freedom is like",
        "Justice is like",
        "Beauty is like",
        "Love is like",
        "Death is like",
        "God is like",
        "Infinity is like"
      ],
      expert: [
        "Existence is like",
        "Consciousness is like",
        "Reality is like",
        "Perception is like",
        "Meaning is like",
        "Chaos is like",
        "Order is like",
        "Duality is like",
        "Unity is like",
        "Transcendence is like"
      ]
    };

    const selectedPrompts = prompts[difficulty] || prompts.beginner;
    return selectedPrompts.slice(0, count);
  }

  getFallbackConductorTopics(count, difficulty) {
    const topics = {
      beginner: [
        "My favorite hobby and why I love it",
        "A memorable vacation experience",
        "The best meal I've ever had",
        "My favorite movie and what makes it special",
        "A person who has influenced my life"
      ],
      intermediate: [
        "The importance of teamwork in modern business",
        "How I overcame a significant challenge",
        "The benefits of continuous learning",
        "The impact of technology on daily life",
        "Why effective communication matters"
      ],
      advanced: [
        "The future of remote work and collaboration",
        "Balancing personal and professional priorities",
        "The role of creativity in problem-solving",
        "Building resilience in uncertain times",
        "The psychology of motivation and achievement"
      ],
      expert: [
        "The nature of human consciousness and awareness",
        "The balance between tradition and progress",
        "The meaning of success in modern society",
        "The relationship between technology and humanity",
        "The pursuit of happiness and fulfillment"
      ]
    };

    const selectedTopics = topics[difficulty] || topics.beginner;
    return selectedTopics.slice(0, count);
  }

  getFallbackTripleStepWords(count, difficulty) {
    const words = {
      beginner: [
        "book", "happy", "run", "blue", "tree", "smile",
        "water", "friend", "home", "food", "music", "sun"
      ],
      intermediate: [
        "adventure", "wisdom", "transform", "serendipity", "resilience", "synthesize",
        "harmony", "innovation", "perspective", "authenticity", "momentum", "clarity"
      ],
      advanced: [
        "serendipity", "resilience", "synthesize", "quintessential", "ephemeral", "metamorphosis",
        "serendipity", "resilience", "synthesize", "quintessential", "ephemeral", "metamorphosis"
      ],
      expert: [
        "ephemeral", "quintessential", "metamorphosis", "serendipity", "resilience", "synthesize",
        "ephemeral", "quintessential", "metamorphosis", "serendipity", "resilience", "synthesize"
      ]
    };

    const selectedWords = words[difficulty] || words.beginner;
    return selectedWords.slice(0, count);
  }

  getFallbackCustomPrompt(category, difficulty) {
    const fallbacks = {
      analogy: "Success is like a journey because...",
      topic: "The importance of effective communication in today's world",
      word: "serendipity",
      question: "What does success mean to you?",
      scenario: "Imagine you're giving a presentation to a skeptical audience..."
    };

    return fallbacks[category] || fallbacks.topic;
  }
}
