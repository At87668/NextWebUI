export const DEFAULT_CHAT_MODEL: string = 'model1';
export const DEFAULT_CHAT_MODEL_GUEST: string = 'model1';

export interface ChatModel {
  id: string;
  name: string;
  description: string;
}

export const chatModels: Array<ChatModel> = [
  {
    id: 'model1',
    name: 'Model-1',
    description: 'models.model1.description',
  },
  {
    id: 'model2',
    name: 'Model-2',
    description: 'models.model2.description',
  }
];

export interface ImageModel {
  id: string;
  name: string;
  description: string;
}

export const imageModels: Array<ImageModel> = [
  {
    id: 'stable-diffusion-v1-5-inpainting',
    name: 'SD1.5-Inpainting',
    description: 'Stable Diffusion 1.5 Inpainting',
  },
];
