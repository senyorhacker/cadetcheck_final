const express = require('express');
const router = express.Router();
const db = require('../database');
const { verifyToken, verifyAdmin } = require('../middleware/auth');

// Submit Feedback (Authenticated Users)
router.post('/', verifyToken, async (req, res) => {
    const { test_type, general_rating, issues, experience, suggestions, other_comments } = req.body;
    const userId = req.user.id;

    if (!test_type || !general_rating) {
        return res.status(400).json({ message: "Test type and rating are required" });
    }

    try {
        await db.query(
            `INSERT INTO feedback 
            (user_id, test_type, general_rating, issues, experience, suggestions, other_comments, created_at) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
            [
                userId,
                test_type,
                general_rating,
                JSON.stringify(issues || []),
                experience,
                JSON.stringify(suggestions || []),
                other_comments
            ]
        );
        res.status(201).json({ message: "Feedback submitted successfully" });
    } catch (err) {
        console.error("Feedback Submit Error:", err);
        res.status(500).json({ message: "Database error" });
    }
});

// Get All Feedback (Admin Only)
router.get('/', verifyToken, verifyAdmin, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT f.*, u.full_name, u.email 
             FROM feedback f 
             JOIN users u ON f.user_id = u.id 
             ORDER BY f.created_at DESC`
        );
        res.json(result.rows);
    } catch (err) {
        console.error("Fetch Feedback Error:", err);
        res.status(500).json({ message: "Database error" });
    }
});

module.exports = router;
