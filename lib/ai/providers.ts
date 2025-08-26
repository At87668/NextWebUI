import {
  customProvider,
  wrapLanguageModel,
  extractReasoningMiddleware,
} from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL,
});

export const myProvider = customProvider({
  languageModels: {
    'model1': openai.chat('1'),
    'model2': openai.chat('2'),
    'title-model': openai.chat('title'),
    'artifact-model': openai.chat('artifact'),
  }
});
