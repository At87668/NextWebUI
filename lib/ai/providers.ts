import {
  customProvider,
  wrapLanguageModel,
  extractReasoningMiddleware,
} from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { xai } from '@ai-sdk/xai';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

export const myProvider = customProvider({
  languageModels: {
    'model1': openai.chat(''),
    'model2': openai.chat(''),
  }
});
