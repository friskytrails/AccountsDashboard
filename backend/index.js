require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const app = express();
const PORT = process.env.PORT || 5001;

// CORS setup supporting local development, configured FRONTEND_URL, and Vercel preview domains
const configuredOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(origin => origin.trim().replace(/\/$/, ''))
  .filter(Boolean);

const allowedOrigins = [
  'http://localhost:5174',
  'http://localhost:5173',
  'http://localhost:3000',
  'https://accounts-dashboard-one.vercel.app',
  ...configuredOrigins
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, mobile, server-to-server)
    if (!origin) return callback(null, true);
    if (
      allowedOrigins.includes('*') ||
      allowedOrigins.includes(origin) ||
      origin.endsWith('.vercel.app') ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }
    return callback(new Error('CORS origin not allowed'));
  },
  credentials: true
}));

app.use(express.json());

// Import booking database connection
const { connectBookingDB, getBookingDB } = require('./src/config/bookingDb');

// Database connection helper supporting both standalone server and Vercel serverless
let dbPromise = null;
let isConnecting = false;

async function connectDB() {
  const bookingDb = getBookingDB();
  const isConnected = mongoose.connection.readyState === 1 && Boolean(bookingDb && bookingDb.readyState === 1);

  if (isConnected) {
    if (dbPromise) await dbPromise;
    return;
  }

  if (!isConnecting) {
    isConnecting = true;
    dbPromise = (async () => {
      if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is missing');
      }
      if (mongoose.connection.readyState !== 1) {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');
      }
      await connectBookingDB();
    })()
      .finally(() => {
        isConnecting = false;
      })
      .catch(err => {
        dbPromise = null;
        throw err;
      });
  }

  await dbPromise;
}

// Keep connection starting immediately for serverless/cold starts
const databaseReady = connectDB().catch(err => {
  console.error('MongoDB initialization error:', err);
  throw err;
});

// Middleware to ensure DB is connected before processing API requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error('Database connection error:', err);
    res.status(503).json({ error: 'Database unavailable', message: err.message });
  }
});

// Import and register all routes
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

// Start local server if run directly (node index.js)
if (require.main === module || (!process.env.VERCEL && process.env.NODE_ENV !== 'test')) {
  databaseReady
    .then(() => {
      app.listen(PORT, () => console.log(`Accounts backend running on http://localhost:${PORT}`));
    })
    .catch(err => {
      console.error('MongoDB startup error:', err);
      process.exit(1);
    });
}

app.databaseReady = databaseReady;
module.exports = app;