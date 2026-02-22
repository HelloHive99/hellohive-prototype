import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { authUsers } from '@/lib/auth-users';
import { users } from '@/data/seed-data';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const authUser = authUsers.find(
          (u) => u.email.toLowerCase() === credentials.email.toLowerCase()
        );
        if (!authUser) return null;

        const passwordValid = await bcrypt.compare(credentials.password, authUser.passwordHash);
        if (!passwordValid) return null;

        return { id: authUser.userId, email: authUser.email };
      },
    }),
  ],

  session: { strategy: 'jwt' },

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        const seedUser = users.find((u) => u.id === user.id);
        if (seedUser) token.role = seedUser.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token?.userId) {
        session.user.userId = token.userId as string;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
