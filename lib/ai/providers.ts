import { customProvider } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { db } from '../db/queries';
import { models as modelsTable } from '../db/schema';
import { createOllama } from 'ollama-ai-provider-v2';

export async function getDynamicProvider() {
  const dbModels = await db.select().from(modelsTable);
  const languageModels: Record<string, any> = {};

  for (const m of dbModels) {
    if (m.type === 'openai') {
      const openai = createOpenAI({
        apiKey: m.api_key || process.env.OPENAI_API_KEY,
        baseURL: m.api_base_url || process.env.OPENAI_BASE_URL,
      });
      languageModels[m.id] = openai.chat(m.api_id);
    } else if (m.type === 'ollama') {
      const ollama = createOllama({
         baseURL: m.api_base_url || process.env.OLLAMA_BASE_URL,
      });
      languageModels[m.id] = ollama.chat(m.api_id);
    }
  }

  return customProvider({ languageModels });
}
