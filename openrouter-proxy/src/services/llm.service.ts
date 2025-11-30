import axios from 'axios';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openrouter/auto';

// System prompts for different services
const SYSTEM_PROMPTS = {
  chatbot: `You are a helpful banking assistant. Answer customer questions about accounts, credits, transfers, and services in Russian. Be friendly and concise. If you don't know, suggest contacting support.`,
  
  score_explain: `You are a financial analyst. Explain credit scoring decisions in simple, friendly Russian. Focus on key factors that influenced the score.`,
  
  fraud_summary: `You are a fraud analyst. Summarize transaction anomalies in professional Russian for internal review.`,
  
  assistant: `You are a personal financial advisor. Provide personalized financial recommendations in Russian based on user data. Be encouraging and practical.`,
  
  default: `You are a helpful banking assistant. Respond in Russian.`,
};

export const callOpenRouter = async (
  userMessage: string,
  context: any = {},
  service: string = 'default'
): Promise<any> => {
  try {
    const systemPrompt = SYSTEM_PROMPTS[service as keyof typeof SYSTEM_PROMPTS] || SYSTEM_PROMPTS.default;

    // Prepare messages
    const messages = [
      {
        role: 'system',
        content: systemPrompt,
      },
      ...(context.history || []),
      {
        role: 'user',
        content: userMessage,
      },
    ];

    // Add context if provided
    if (context.data) {
      messages[messages.length - 1].content += `\n\nContext: ${JSON.stringify(context.data)}`;
    }

    // Call OpenRouter API
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: OPENROUTER_MODEL,
        messages,
        temperature: 0.7,
        max_tokens: 1000,
      },
      {
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'http://localhost:3001',
          'X-Title': 'RiseUp Banking Platform',
        },
      }
    );

    return {
      message: response.data.choices[0].message.content,
      tokens: response.data.usage.total_tokens,
      model: response.data.model,
      cost: response.data.usage.prompt_tokens * 0.00001 + response.data.usage.completion_tokens * 0.00002,
    };
  } catch (error: any) {
    console.error('OpenRouter API error:', error.response?.data || error.message);
    throw new Error(`LLM API failed: ${error.message}`);
  }
};

export const generateCacheKey = (service: string, message: string): string => {
  const hash = crypto.createHash('sha256').update(`${service}:${message}`).digest('hex');
  return `llm_cache:${service}:${hash}`;
};
