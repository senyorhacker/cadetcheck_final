require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const db = require('./database');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.set('trust proxy', 1); // Trust first proxy (Netlify)
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public'))); // Serve static frontend files

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/results', require('./routes/results'));
app.use('/api/feedback', require('./routes/feedback'));

// Protected Frontend Check
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Export for Serverless
module.exports.app = app;

// Start Server locally
if (require.main === module) {
    app.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
        console.log(`Admin Panel: http://localhost:${PORT}/admin-panel.html`);
    });
}
