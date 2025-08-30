import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

config({
  path: '.env.local',
});

const defaultGroups = [
  {
    group: 'guest',
    models: [] as string[],
    max_message_per_day: 10,
    default_model: 'llama3',
  },
  {
    group: 'regular',
    models: ['llama3'],
    max_message_per_day: 100,
    default_model: 'llama3',
  },
];

const initDefaultGroups = async () => {
  const connectionString = process.env.POSTGRES_URL;
  if (!connectionString) {
    console.error('❌ POSTGRES_URL is not defined');
    process.exit(1);
  }

  const client = postgres(connectionString);
  const db = drizzle(client, { schema });

  console.log('🔍 Check if the default user group exists...');

  const existingGroups = await db.query.group.findMany({
    columns: { group: true },
  });
  const existingNames = new Set(existingGroups.map(g => g.group));

  const groupsToInsert = defaultGroups.filter(g => !existingNames.has(g.group));

  if (groupsToInsert.length === 0) {
    console.log('✅ All default user groups already exist and do not need to be initialized.');
    process.exit(0);
  }

  await db.insert(schema.group).values(groupsToInsert);
  console.log(`✅ Successfully create a user group: ${groupsToInsert.map(g => g.group).join(', ')}`);

  process.exit(0);
};

initDefaultGroups().catch((err) => {
  console.error('❌ Group init failed');
  console.error(err);
  process.exit(1);
});