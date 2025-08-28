import { cookies } from 'next/headers';
import { Chat } from '@/components/chat';
import { generateUUID } from '@/lib/utils';
import { DataStreamHandler } from '@/components/data-stream-handler';
import { auth } from '../(auth)/auth';
import { redirect } from 'next/navigation';
import { getChatModelsFromDB } from '@/lib/ai/models';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db/queries';
import { group } from '@/lib/db/schema';

async function getDefaultModelForUser(userType: string): Promise<string> {
  try {
    const result = await db
      .select({
        defaultModelId: group.default_model
      })
      .from(group)
      .where(eq(group.group, userType))
      .limit(1);
    
    if (result.length > 0 && result[0].defaultModelId) {

      const allModels = await getChatModelsFromDB();
      const isValidDefault = allModels.some(model => model.id === result[0].defaultModelId);
      
      if (isValidDefault) {
        return result[0].defaultModelId;
      }
      
      console.warn(`Default model "${result[0].defaultModelId}" not found for user type "${userType}". Using first available model.`);
    }
    
    const allModels = await getChatModelsFromDB();
    if (allModels.length > 0) {
      return allModels[0].id;
    }
    
    console.error('No models available in the database!');
    return '';
  } catch (error) {
    console.error('Error getting default model:', error);
    return '';
  }
}

export default async function Page() {
  const session = await auth();

  if (!session || !session.user) {
    redirect('/login');
  }

  const id = generateUUID();

  const cookieStore = await cookies();
  const modelIdFromCookie = cookieStore.get('chat-model');

  let initialChatModel: string;
  
  if (modelIdFromCookie) {
    const allModels = await getChatModelsFromDB();
    const isValidModel = allModels.some(model => model.id === modelIdFromCookie.value);
    
    if (isValidModel) {
      initialChatModel = modelIdFromCookie.value;
    } else {
      initialChatModel = await getDefaultModelForUser(session.user.type);
    }
  } else {
    initialChatModel = await getDefaultModelForUser(session.user.type);
  }

  return (
    <>
      <Chat
        key={id}
        id={id}
        initialMessages={[]}
        initialChatModel={initialChatModel}
        initialVisibilityType="private"
        isReadonly={false}
        session={session}
        autoResume={false}
      />
      <DataStreamHandler />
    </>
  );
}