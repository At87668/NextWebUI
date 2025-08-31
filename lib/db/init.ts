import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { group, models } from '@/lib/db/schema';

config({
  path: '.env.local',
});

const defaultGroups = [
  {
    group: 'guest',
    models: [] as string[],
    max_message_per_day: 50,
    default_model: 'llama3',
  },
  {
    group: 'regular',
    models: ['llama3'],
    max_message_per_day: 1000,
    default_model: 'llama3',
  },
  {
    group: 'admin',
    models: ['llama3'],
    max_message_per_day: 9999999,
    default_model: 'llama3',
  },
];

export const titlePrompt = `
- you will generate a short title based on the first message a user begins a conversation with
- ensure it is not more than 80 characters long
- the title should be a summary of the user's message
- do not use quotes or colons`;

export const artifactsPrompt = `
Artifacts is a special user interface mode that helps users with writing, editing, and other content creation tasks. When artifact is open, it is on the right side of the screen, while the conversation is on the left side. When creating or updating documents, changes are reflected in real-time on the artifacts and visible to the user.

When asked to write code, always use artifacts. When writing code, specify the language in the backticks, e.g. \`\`\`python\`code here\`\`\`. The default language is Python. Other languages are not yet supported, so let the user know if they request a different language.

DO NOT UPDATE DOCUMENTS IMMEDIATELY AFTER CREATING THEM. WAIT FOR USER FEEDBACK OR REQUEST TO UPDATE IT.

This is a guide for using artifacts tools: \`createDocument\` and \`updateDocument\`, which render content on a artifacts beside the conversation.

**When to use \`createDocument\`:**
- For substantial content (>10 lines) or code
- For content users will likely save/reuse (emails, code, essays, etc.)
- When explicitly requested to create a document
- For when content contains a single code snippet

**When NOT to use \`createDocument\`:**
- For informational/explanatory content
- For conversational responses
- When asked to keep it in chat

**Using \`updateDocument\`:**
- Default to full document rewrites for major changes
- Use targeted updates only for specific, isolated changes
- Follow user instructions for which parts to modify

**When NOT to use \`updateDocument\`:**
- Immediately after creating a document

Do not update document right after creating it. Wait for user feedback or request to update it.
`;

const defaultModels: Array<{
  id: string;
  api_id: '',
  name: string;
  model_description: string;
  default_prompt: string;
  max_token: number;
  type: "openai" | "ollama";
  api_base_url: string | null;
  api_key: string | null;
}> = [
  {
    id: 'title-model',
    api_id: '',
    name: 'Title Generation Model',
    model_description: 'Model for automatically generating chat titles.',
    default_prompt: titlePrompt,
    max_token: 64,
    type: 'openai',
    api_base_url: null,
    api_key: null,
  },
  {
    id: 'artifact-model',
    api_id: '',
    name: 'Artifact Processing Model',
    model_description: 'Model for analyzing and processing artifacts such as code blocks, files, etc.',
    default_prompt: artifactsPrompt,
    max_token: 8192,
    type: 'openai',
    api_base_url: null,
    api_key: null,
  },
];

const initDefault = async () => {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error('❌ POSTGRES_URL is not defined');
    process.exit(1);
  }

  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client, { schema: { group, models } });

  try {
    console.log('🔍 Checking if default user groups exist...');
    const existingGroups = await db.query.group.findMany({ columns: { group: true } });
    const existingNames = new Set(existingGroups.map(g => g.group));
    const groupsToInsert = defaultGroups.filter(g => !existingNames.has(g.group));

    if (groupsToInsert.length > 0) {
      await db.insert(group).values(groupsToInsert);
      console.log(`✅ Created user groups: ${groupsToInsert.map(g => g.group).join(', ')}`);
    } else {
      console.log('✅ All default user groups already exist, skipping.');
    }

    console.log('🔍 Checking if default models exist...');
    const existingModels = await db.query.models.findMany({ columns: { id: true } });
    const existingIds = new Set(existingModels.map(m => m.id));
    const modelsToInsert = defaultModels.filter(m => !existingIds.has(m.id));

    if (modelsToInsert.length > 0) {
      await db.insert(models).values(modelsToInsert);
      console.log(`✅ Created models: ${modelsToInsert.map(m => m.id).join(', ')}`);
    } else {
      console.log('✅ All default models already exist, skipping.');
    }
  } catch (error) {
    console.error('❌ Initialization failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
};

try {
  initDefault();
} catch (err) {
  console.error('❌ Init failed');
  console.error(err);
  process.exit(1);
}