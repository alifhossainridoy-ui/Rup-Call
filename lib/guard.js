const { getServerSession } = require('next-auth/next');
const { authOptions } = require('./auth');

async function requireRole(requiredRole) {
  const session = await getServerSession(authOptions);

  if (!session) {
    const error = new Error('Unauthorized');
    error.status = 401;
    throw error;
  }

  if (session.user.role !== requiredRole) {
    const error = new Error('Forbidden');
    error.status = 403;
    throw error;
  }

  return session;
}

module.exports = { requireRole };
