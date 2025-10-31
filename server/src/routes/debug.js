import { Router } from 'express';
import mongoose from 'mongoose';
import Checkout from '../models/Checkout.js';
import User from '../models/User.js';

const router = Router();

// Basic connection and collection stats
router.get('/stats', async (_req, res) => {
  try {
    const stats = {
      dbName: mongoose.connection.name,
      connected: mongoose.connection.readyState === 1,
      collections: {
        users: await User.countDocuments(),
        checkouts: await Checkout.countDocuments(),
      }
    };
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sample checkout to verify document structure
router.get('/sample-checkout', async (_req, res) => {
  try {
    const sample = await Checkout.findOne().sort({ createdAt: -1 });
    res.json(sample || { message: 'No checkouts found' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Test analytics aggregation
router.get('/analytics-test', async (_req, res) => {
  try {
    const since = new Date();
    since.setDate(since.getDate() - 7); // Last 7 days
    
    const agg = await Checkout.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, total: { $sum: "$total" } } },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      query: { since: since.toISOString() },
      results: agg,
      count: agg.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;