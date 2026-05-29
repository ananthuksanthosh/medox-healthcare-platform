const express = require('express');
const os = require('os');

const router = express.Router();

const prisma = require('../config/database');

router.get('/test-db', async (req, res) => {

    try {

        const users = await prisma.user.findMany();

        res.json({
            success: true,
            users
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            error: error.message
        });

    }

});

router.get('/health', async (req, res) => {
    try {
        // Query DB to verify link is active
        await prisma.$queryRaw`SELECT 1`;
        
        const uptime = process.uptime();
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;
        const ramUsage = ((usedMem / totalMem) * 100).toFixed(2);
        
        // Load average (returns array of 1, 5, 15 min loads)
        const load = os.loadavg();
        const cpuUsage = load[0].toFixed(2);

        res.status(200).json({
            status: "healthy",
            database: "connected",
            server: "running",
            uptime: parseFloat(uptime.toFixed(1)),
            cpu: `${cpuUsage}%`,
            ram: {
                total: `${(totalMem / (1024 * 1024 * 1024)).toFixed(2)} GB`,
                free: `${(freeMem / (1024 * 1024 * 1024)).toFixed(2)} GB`,
                usage: `${ramUsage}%`
            }
        });
    } catch (err) {
        res.status(500).json({
            status: "unhealthy",
            database: "disconnected",
            server: "running",
            error: err.message
        });
    }
});

module.exports = router;