import Checkout from '../models/Checkout.js';
import User from '../models/User.js';

export async function changeMyPassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Password cannot be empty' });
    }

    const me = await User.findById(req.userId);
    if (!me) return res.status(404).json({ message: 'User not found' });

    const ok = await me.validatePassword(currentPassword);
    if (!ok) return res.status(400).json({ message: 'Current password is incorrect' });

    await me.setPassword(newPassword);
    await me.save();
    return res.json({ message: 'Password updated' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}

export async function createBarista(req, res) {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ message: 'Password cannot be empty' });

    const exists = await User.findOne({ email });
    if (exists) return res.status(409).json({ message: 'Email already registered' });

    const u = new User({ name, email, role: 'barista', status: 'active' });
    await u.setPassword(password);
    await u.save();

    return res.status(201).json({ _id: u._id, name: u.name, email: u.email, status: u.status });
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}

export async function listBaristas(_req, res) {
  try {
    const users = await User.find({ role: 'barista' })
      .select('_id name email status createdAt');
    return res.json(users);
  } catch {
    return res.status(500).json({ message: 'Server error' });
  }
}

export async function updateBaristaStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!['active', 'disabled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }
    if (id === req.userId) {
      return res.status(400).json({ message: "You can't change your own status" });
    }

    const updated = await User.findOneAndUpdate(
      { _id: id, role: 'barista' },
      { $set: { status } },
      { new: true }
    ).select('_id name email status');

    if (!updated) return res.status(404).json({ message: 'Barista not found' });
    return res.json(updated);
  } catch {
    return res.status(500).json({ message: 'Server error' });
  }
}

export async function resetBaristaPassword(req, res) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body || {};
    if (!newPassword) return res.status(400).json({ message: 'Missing newPassword' });

    if (id === req.userId) {
      return res.status(400).json({ message: 'Use /me/password to change your own password' });
    }

    const u = await User.findOne({ _id: id, role: 'barista' });
    if (!u) return res.status(404).json({ message: 'Barista not found' });

    await u.setPassword(newPassword);
    await u.save();

    return res.json({ message: 'Password reset' });
  } catch {
    return res.status(500).json({ message: 'Server error' });
  }
}

// --- Analytics endpoints -------------------------------------------------
export async function salesTrend(req, res) {
  try {
    const days = Math.max(1, Math.min(365, Number(req.query.days) || 30));
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1));

    const agg = await Checkout.aggregate([
      { $match: { status: 'completed', createdAt: { $gte: since } } },
      { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, total: { $sum: "$total" } } },
      { $sort: { _id: 1 } },
    ]);

    return res.json((agg || []).map(a => ({ date: a._id, total: a.total || 0 })));
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}

export async function bestSellers(req, res) {
  try {
    const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 10));

    const agg = await Checkout.aggregate([
      { $match: { status: 'completed' } },
      { $unwind: "$items" },
      { $group: { _id: "$items.menuItem", name: { $first: "$items.name" }, qty: { $sum: "$items.quantity" }, revenue: { $sum: "$items.subtotal" } } },
      { $sort: { qty: -1 } },
      { $limit: limit },
    ]);

    return res.json((agg || []).map(a => ({ menuItemId: a._id, name: a.name, quantity: a.qty || 0, revenue: a.revenue || 0 })));
  } catch (err) {
    return res.status(500).json({ message: 'Server error' });
  }
}

