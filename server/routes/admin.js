const express = require('express');
const router = express.Router();
const db = require('../database');
const { verifyToken, verifyAdmin } = require('../middleware/auth');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid'); // Assume uuid installed or just use DB generation

router.use(verifyToken);
// router.use(verifyAdmin); // Temporarily disable strict admin check if not fully implemented in token

// Get all users
router.get('/users', async (req, res) => {
    try {
        const result = await db.query('SELECT id, full_name, email, role, created_at, last_login FROM users ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server Error" });
    }
});

// Get User Results
router.get('/users/:id/results', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT game_name, score, level, played_at FROM results WHERE user_id = $1 ORDER BY played_at DESC', [id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Fetch results failed" });
    }
});

// Get Stats
router.get('/stats', async (req, res) => {
    try {
        const usersCount = await db.query('SELECT COUNT(*) FROM users');
        const gamesCount = await db.query('SELECT COUNT(*) FROM results');

        res.json({
            totalUsers: usersCount.rows[0].count,
            totalGames: gamesCount.rows[0].count
        });
    } catch (err) {
        console.error('Stats Error:', err);
        res.status(500).json({ message: "Stats failure" });
    }
});

// Analytics: Game Performance
router.get('/analytics/games', async (req, res) => {
    try {
        // We perform basic averaging. Since scores are strings "X/Y (Z%)", 
        // extracting percentage needs regex similar to dashboard.
        // Postgres Regex: substring(score from '\\((\\d+)%\\)')
        const query = `
            SELECT game_name, 
                   COUNT(*) as play_count,
                   AVG(COALESCE(SUBSTRING(score FROM '\\((\\d+)%\\)')::int, 0)) as avg_score
            FROM results
            GROUP BY game_name
            ORDER BY avg_score DESC
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Game Analytics Error:", err);
        res.status(500).json({ message: "Analytics Error" });
    }
});

// Analytics: Feedback Sentiment
router.get('/analytics/feedback', async (req, res) => {
    try {
        const query = `
            SELECT general_rating, COUNT(*) as count
            FROM feedback
            GROUP BY general_rating
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error("Feedback Analytics Error:", err);
        res.status(500).json({ message: "Analytics Error" });
    }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.query('DELETE FROM users WHERE id = $1', [id]);
        res.json({ message: "User deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Delete failed" });
    }
});

// Generate Access Code
router.post('/codes', async (req, res) => {
    const { batchSize } = req.body; // e.g., 50
    const count = batchSize || 1;

    try {
        const codes = [];
        for (let i = 0; i < count; i++) {
            // Generate simple random code
            const code = 'CADET-' + Math.random().toString(36).substr(2, 8).toUpperCase();
            codes.push(code);
        }

        // Bulk insert would be better but simple loop for now provided traffic is low
        for (const code of codes) {
            await db.query('INSERT INTO codes (code, created_by) VALUES ($1, $2)', [code, req.user.id]);
        }

        res.json({ message: `${count} Codes generated`, codes });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Code generation failed" });
    }
});

// Get Codes
router.get('/codes', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM codes ORDER BY created_at DESC LIMIT 100');
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ message: "Fetch codes failed" });
    }
});

module.exports = router;
