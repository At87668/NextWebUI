import { compare } from 'bcrypt-ts';
import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { getUser, createGuestUser } from '@/lib/db/queries';
import { authConfig } from './auth.config';
import { DUMMY_PASSWORD } from '@/lib/constants';
import type { DefaultJWT } from 'next-auth/jwt';
import redis from '@/lib/redis/redis';

export type UserType = 'guest' | 'regular';

declare module 'next-auth' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      type: UserType;
      jti: string;
      exp: number;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    email?: string | null;
    nick?: string | null;
    type: UserType;
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    id: string;
    type: UserType;
    session_jti: string;
  }
}

const JWT_EXPIRES_IN = 30 * 24 * 60 * 60;
const GUEST_JWT_EXPIRES_IN = Math.floor(Date.now() / 1000) + 2 * 60 * 60;

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {},
      async authorize({ email, password }: any) {
        const users = await getUser(email);

        if (users.length === 0) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const [user] = users;

        if (!user.password) {
          await compare(password, DUMMY_PASSWORD);
          return null;
        }

        const passwordsMatch = await compare(password, user.password);
        if (!passwordsMatch) return null;

        return {
          id: user.id,
          email: user.email,
          nick: user.nick,
          type: 'regular',
        };
      },
    }),
    Credentials({
      id: 'guest',
      credentials: {},
      async authorize() {
        const [guestUser] = await createGuestUser();
        return {
          id: guestUser.id,
          email: guestUser.email,
          nick: '',
          type: 'guest' as UserType,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ session, trigger, token, user }) {
      if (user) {
        token.id = user.id as string;
        token.type = user.type;
        token.nick = user.nick;

        if (user.type === 'guest') {
          token.exp = GUEST_JWT_EXPIRES_IN;
        }

        if (!token.session_jti) {
          token.session_jti = crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`;
          //token.session_jti = '00000000-0000-0000-0000-00000000000'
        }

        if (token.type !== 'guest' && token.session_jti) {
          try {
            const userId = token.id;
            const session_jti = token.session_jti;

            await redis.setex(`jti:whitelist:${session_jti}`, JWT_EXPIRES_IN, userId);

            await redis.sadd(`user:jti:set:${userId}`, session_jti);

            await redis.expire(`user:jti:set:${userId}`, JWT_EXPIRES_IN);
          } catch (error) {
            console.error('Failed to add/update JWT in Redis whitelist:', error);
          }
        }
      }

      if (trigger === 'update') {
        if (session?.user) {
          token.id = session.user.id;
          token.type = session.user.type;
        }
        if (session?.nick) {
          token.nick = session.nick;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.type = token.type;
        session.user.nick = token.nick as string;
        session.user.jti = token.session_jti;
      }
      return session;
    },
  },

  session: {
    strategy: 'jwt',
    maxAge: JWT_EXPIRES_IN,
  },
});