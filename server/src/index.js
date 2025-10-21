import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import requireAuth from './middleware/requireAuth.js';
import authRoutes from './routes/auth.js';
import User from './models/User.js';

const app = express();

const PORT = process.env.PORT || 5000;
const ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = 'blue52cafeflow'; // <- your intended DB

console.log('Using MONGO_URI:', MONGO_URI);

// helpful connection logs
mongoose.connection.on('connected', () => {
  console.log('✅ Mongo connected to DB:', mongoose.connection.name);
});
mongoose.connection.on('error', (err) => {
  console.error('❌ Mongo connection error:', err.message);
});

// middleware
app.use(cors({ origin: ORIGIN, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// preflight helper
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', ORIGIN);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// routes
app.use('/api/auth', authRoutes);
app.use('/api', requireAuth);
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// debug: confirm DB + user count
app.get('/api/debug/users-count', async (_req, res) => {
  res.json({ db: mongoose.connection.name, users: await User.countDocuments() });
});

// SINGLE connect only, then start server
async function start() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: DB_NAME }); // <-- FORCE DB NAME HERE
    app.listen(PORT, () => {
      console.log(`API on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}
start();
