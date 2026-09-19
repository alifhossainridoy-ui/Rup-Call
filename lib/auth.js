const CredentialsProvider = require('next-auth/providers/credentials').default;
const { PrismaAdapter } = require('@next-auth/prisma-adapter');
const { prisma } = require('./prisma');
const bcrypt = require('bcryptjs');

const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'ইমেইল', type: 'email' },
        password: { label: 'পাসওয়ার্ড', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('ইমেইল এবং পাসওয়ার্ড প্রয়োজন');
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error('ইমেইল বা পাসওয়ার্ড ভুল');
        }

        if (!user.active) {
          throw new Error('ইমেইল বা পাসওয়ার্ড ভুল');
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isPasswordValid) {
          throw new Error('ইমেইল বা পাসওয়ার্ড ভুল');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          active: user.active,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.active = user.active;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.active = token.active;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

module.exports = { authOptions };
