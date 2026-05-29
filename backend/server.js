require('dotenv').config();

const app = require('./src/app');
const prisma = require('./src/config/database');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`🏥 MEDOX server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// ── Graceful Shutdown ─────────────────────────────────────────
// AWS ECS / EC2 / Docker send SIGTERM before terminating
const gracefulShutdown = async (signal) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

    server.close(async () => {
        console.log('🔌 HTTP server closed');
        try {
            await prisma.$disconnect();
            console.log('🗄️  Database connection closed');
        } catch (err) {
            console.error('Error closing database connection:', err);
        }
        process.exit(0);
    });

    // Force exit if graceful shutdown hangs after 10s
    setTimeout(() => {
        console.error('⚠️  Graceful shutdown timed out. Forcing exit.');
        process.exit(1);
    }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

// Catch unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
