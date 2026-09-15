require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
const configuredOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);
const allowedOrigins = [
  'http://localhost:5174',
  'https://accounts-dashboard-one.vercel.app',
  ...configuredOrigins
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('CORS origin not allowed'));
  },
  credentials: true
}));
app.use(express.json());

// Import and register all routes (to be added in later phases)
const authRoutes = require('./src/routes/authRoutes');
const transactionRoutes = require('./src/routes/transactionRoutes');
const dashboardRoutes = require('./src/routes/dashboardRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'Accounts Dashboard API is running',
    health: '/api/health'
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Accounts Dashboard API' });
});

// Import booking database connection
const { connectBookingDB } = require('./src/config/bookingDb');

// Keep the database connection available for both local and Vercel execution.
const databaseReady = mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log("Connected to MongoDB");
    await connectBookingDB();
  });

// Vercel waits for the exported Express app; local requests wait for the DB too.
app.use(async (req, res, next) => {
  try {
    await databaseReady;
    next();
  } catch (err) {
    console.error("MongoDB connection error:", err);
    res.status(503).json({ error: "Database unavailable" });
  }
});

if (require.main === module) {
  databaseReady
    .then(() => app.listen(PORT, () => console.log("Accounts backend running on http://localhost:" + PORT)))
    .catch(err => {
      console.error("MongoDB connection error:", err);
      process.exit(1);
    });
}

module.exports = app;