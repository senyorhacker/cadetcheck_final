const jwt = require('jsonwebtoken');
require('dotenv').config();

const SECRET_KEY = process.env.JWT_SECRET;
const ADMIN_SECRET_KEY = process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET; // Fallback or distinct

const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ message: "No token provided" });

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) return res.status(403).json({ message: "Invalid token" });
        req.user = decoded;
        next();
    });
};

const verifyAdmin = (req, res, next) => {
    // Assuming admin role is stored in token or we check a separate admin token
    // For simplicity given prev context, checking role 'admin'
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
    }
    next();
};

module.exports = {
    SECRET_KEY,
    verifyToken,
    verifyAdmin
};
