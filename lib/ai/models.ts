import { db } from '../db/queries';
import { models as modelsTable } from '../db/schema';
export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export async function getChatModelsFromDB(): Promise<ChatModel[]> {
  const result = await db.select({
    id: modelsTable.id,
    name: modelsTable.name,
    description: modelsTable.model_description,
  }).from(modelsTable);
  return result.map(({ id, name, description }) => ({
    id,
    name,
    description: description ?? '',
  }));
}

export interface ImageModel {
  id: string;
  name: string;
  description: string;
}

export const imageModels: Array<ImageModel> = [];
