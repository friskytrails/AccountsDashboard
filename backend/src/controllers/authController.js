const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '12345';
const JWT_SECRET = process.env.JWT_SECRET || 'accounts_dashboard_jwt_secret_2026';

async function login(req, res) {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    if (password.trim() !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Incorrect authorization password' });
    }

    const payload = {
      userId: new mongoose.Types.ObjectId().toString(),
      name: 'Finance Administrator',
      role: 'ADMIN'
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      token,
      user: {
        name: payload.name,
        role: payload.role
      }
    });
  } catch (err) {
    console.error('Auth login error:', err);
    res.status(500).json({ error: 'Authentication service error' });
  }
}

async function getMe(req, res) {
  res.json({
    authenticated: true,
    user: req.user
  });
}

module.exports = { login, getMe };
