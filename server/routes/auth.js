const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../database');
const { SECRET_KEY } = require('../middleware/auth');

// Register
router.post('/register', async (req, res) => {
    const { full_name, email, password } = req.body;

    // Basic validation
    if (!full_name || !email || !password) {
        return res.status(400).json({ message: "All fields are required" });
    }

    // Password Validation
    const passwordRegex = /^(?=.*[A-Z])(?=.*[.!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    if (!passwordRegex.test(password)) {
        return res.status(400).json({
            message: "Password must be at least 8 characters long, contain at least one uppercase letter and one special character."
        });
    }

    try {
        // 1. Check if user exists
        const userCheck = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: "User already exists" });
        }

        // 2. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Create User
        // Note: 'role' defaults to 'user' in DB schema, but we can be explicit
        const newUserRes = await db.query(
            "INSERT INTO users (full_name, email, password, role, created_at) VALUES ($1, $2, $3, 'user', NOW()) RETURNING id, full_name, email, role",
            [full_name, email, hashedPassword]
        );
        const newUser = newUserRes.rows[0];

        // 4. Generate Token
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email, role: newUser.role },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: "User registered successfully",
            token,
            user: newUser
        });

    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ message: "Server error during registration" });
    }
});

// Login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Check User
        const userRes = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const user = userRes.rows[0];

        // 2. Check Password
        const validPass = await bcrypt.compare(password, user.password);
        if (!validPass) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // 3. Update Last Login
        await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

        // 4. Generate Token
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            SECRET_KEY,
            { expiresIn: '24h' }
        );

        res.json({
            message: "Login successful",
            token,
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (err) {
        console.error("Login Error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

// Get Current User Profile
router.get('/me', async (req, res) => {
    // Note: We need to verify token here manually or use middleware. 
    // Since this file doesn't import verifyToken middleware globally (it's in other files),
    // let's assume we can import it or check header manually for this specific route 
    // OR better, we use the same verifyToken logic.
    // Ideally refactor: router.use(verifyToken) but that would break login/register public routes.
    // So we'll accept header and verify local logic or import middleware.

    // Quick fix: Import middleware at top of file, but I don't want to break existing imports without checking.
    // Auth middleware is in ../middleware/auth. Let's use it.

    // Wait, I can't easily change top of file with this tool call without replacing everything.
    // I'll implement inline verification using the already imported jwt and SECRET_KEY.

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: "No token" });

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const userRes = await db.query('SELECT id, full_name, email, role FROM users WHERE id = $1', [decoded.id]);
        if (userRes.rows.length === 0) return res.status(404).json({ message: "User not found" });

        res.json(userRes.rows[0]);
    } catch (err) {
        res.status(403).json({ message: "Invalid token" });
    }
});

// Update Profile
router.put('/update', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: "No token" });

    const { currentPassword, newPassword } = req.body;

    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const userId = decoded.id;

        // 1. Verify Current Password
        const userRes = await db.query('SELECT * FROM users WHERE id = $1', [userId]);
        if (userRes.rows.length === 0) return res.status(404).json({ message: "User not found" });
        const user = userRes.rows[0];

        const validPass = await bcrypt.compare(currentPassword, user.password);
        if (!validPass) {
            return res.status(401).json({ message: "Incorrect current password" });
        }

        // 2. Update Fields
        // Update Password if provided
        if (newPassword) {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            await db.query('UPDATE users SET password = $1 WHERE id = $2', [hashedPassword, userId]);
        }

        res.json({ message: "Profile updated successfully" });

    } catch (err) {
        console.error("Update Error:", err);
        res.status(500).json({ message: "Server error" });
    }
});

module.exports = router;
