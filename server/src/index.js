import cookieParser from 'cookie-parser';
import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import requireAuth from './middleware/requireAuth.js';
import User from './models/User.js';
import addOnRoutes from './routes/addons.js';
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import checkoutRoutes from './routes/checkouts.js';
import customerRoutes from './routes/customers.js';
import inventoryRoutes from './routes/inventory.js';
import menuItemRoutes from './routes/menuItems.js';

const app = express();

const PORT = process.env.PORT || 5000;
const ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = 'blue52cafeflow'; 

console.log('Using MONGO_URI:', MONGO_URI);

// ✅ MongoDB connection handlers
mongoose.connection.on('connected', () => {
  console.log('✅ Mongo connected to DB:', mongoose.connection.name);
});
mongoose.connection.on('error', (err) => {
  console.error('❌ Mongo connection error:', err.message);
});

// ✅ Middleware (put cookieParser + cors at the top, before routes)
app.use(cookieParser());
app.use(
  cors({
    origin: ORIGIN,
    credentials: true, // allow cookies from frontend
  })
);
app.use(express.json());

// ✅ Optional: Allow CORS preflight headers (for OPTIONS requests)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', ORIGIN);
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api', requireAuth);
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/menu-items', menuItemRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/checkouts', checkoutRoutes);
app.use('/api/addons', addOnRoutes);
app.use('/api/admin', adminRoutes);

// ✅ Debug route
app.get('/api/debug/users-count', async (_req, res) => {
  res.json({ db: mongoose.connection.name, users: await User.countDocuments() });
});

// ✅ Start server
async function start() {
  try {
    await mongoose.connect(MONGO_URI, { dbName: DB_NAME });
    app.listen(PORT, () => {
      console.log(`🚀 API running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  }
}

start();
