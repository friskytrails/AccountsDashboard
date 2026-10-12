const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || '').trim();
if (!ADMIN_PASSWORD) {
  throw new Error('ADMIN_PASSWORD environment variable is missing or empty');
}
const JWT_SECRET = (process.env.JWT_SECRET || '').trim();
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is missing or empty');
}

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

module.exports = { login, getMe, JWT_SECRET };
