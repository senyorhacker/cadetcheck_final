const express = require('express');
const router = express.Router();
const db = require('../database');
const { verifyToken } = require('../middleware/auth');

// Protect all routes
router.use(verifyToken);

// Save Game Result
router.post('/', async (req, res) => {
    const { game_name, score, level } = req.body;
    const userId = req.user.id;

    if (!game_name || !score) {
        return res.status(400).json({ message: "Missing game data" });
    }

    try {
        await db.query(
            'INSERT INTO results (user_id, game_name, score, level) VALUES ($1, $2, $3, $4)',
            [userId, game_name, score, level || 1]
        );
        res.status(201).json({ message: "Score saved successfully" });
    } catch (err) {
        console.error("Save Score Error:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// Get User Stats (For Dashboard)
router.get('/stats', async (req, res) => {
    const userId = req.user.id;

    try {
        // 1. Total Tests
        const totalTestsRes = await db.query('SELECT COUNT(*) as count FROM results WHERE user_id = $1', [userId]);
        const totalTests = parseInt(totalTestsRes.rows[0].count);

        // 2. Highest Score (Generic - just taking max score string if comparable, or count)
        // Since score is TEXT, simple MAX might be wrong, but good enough for now or we count unique games.
        // Let's get unique games played count instead or "Level" max.
        // Let's get AVG level across all games as a metric.
        const avgLevelRes = await db.query('SELECT AVG(level) as avg_level FROM results WHERE user_id = $1', [userId]);
        const avgLevel = parseFloat(avgLevelRes.rows[0].avg_level || 0).toFixed(1);

        // 3. Recent Activity (Last 5)
        const recentRes = await db.query(
            'SELECT game_name, score, level, played_at FROM results WHERE user_id = $1 ORDER BY played_at DESC LIMIT 5',
            [userId]
        );

        // 4. Calculate "Streak" (Mock logic or based on dates) - For now simple count
        const distinctDaysRes = await db.query(
            `SELECT COUNT(DISTINCT DATE(played_at)) as days FROM results WHERE user_id = $1`,
            [userId]
        );
        const activeDays = parseInt(distinctDaysRes.rows[0].days);

        // 5. Daily Trend (Last 7 Days)
        const trendRes = await db.query(
            `SELECT DATE(played_at) as date, 
                    AVG(COALESCE(SUBSTRING(score FROM '(\d+)%'), SUBSTRING(score FROM '^(\d+)$'), '0')::FLOAT) as avg_score 
             FROM results 
             WHERE user_id = $1 
             GROUP BY DATE(played_at) 
             ORDER BY DATE(played_at) DESC 
             LIMIT 7`,
            [userId]
        );
        // Note: Score is text, so CAST might fail if non-numeric scores exist (e.g. "Level 5"). 
        // Ideally we filter by game_name or handle this. For now assuming Physics/Cognition scores are numeric or we skip.

        res.json({
            totalTests,
            avgLevel,
            activeDays,
            recentActivity: recentRes.rows,
            dailyTrend: trendRes.rows.reverse() // Oldest first for chart
        });

    } catch (err) {
        console.error("User Stats Error:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// Get Full History
router.get('/history', async (req, res) => {
    const userId = req.user.id;
    try {
        const historyRes = await db.query(
            'SELECT game_name, score, level, played_at FROM results WHERE user_id = $1 ORDER BY played_at DESC LIMIT 50',
            [userId]
        );
        res.json(historyRes.rows);
    } catch (err) {
        console.error("History Error:", err);
        res.status(500).json({ message: "Database error" });
    }
});

module.exports = router;
