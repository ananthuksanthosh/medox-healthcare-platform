const { PrismaClient } = require('@prisma/client');

const isDev = process.env.NODE_ENV !== 'production';

const prisma = new PrismaClient({
    log: isDev
        ? ['query', 'warn', 'error']
        : ['warn', 'error']
});

module.exports = prisma;