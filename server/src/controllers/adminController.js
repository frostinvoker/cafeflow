import Checkout from "../models/Checkout.js";
import User from "../models/User.js";

export async function changeMyPassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Password cannot be empty" });
    }

    const me = await User.findById(req.userId);
    if (!me) return res.status(404).json({ message: "User not found" });

    const ok = await me.validatePassword(currentPassword);
    if (!ok)
      return res.status(400).json({ message: "Current password is incorrect" });

    await me.setPassword(newPassword);
    await me.save();
    return res.json({ message: "Password updated" });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function createBarista(req, res) {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password)
      return res.status(400).json({ message: "Password cannot be empty" });

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(409).json({ message: "Email already registered" });

    const u = new User({ name, email, role: "barista", status: "active" });
    await u.setPassword(password);
    await u.save();

    return res
      .status(201)
      .json({ _id: u._id, name: u.name, email: u.email, status: u.status });
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function listBaristas(_req, res) {
  try {
    const users = await User.find({ role: "barista" }).select(
      "_id name email status createdAt"
    );
    return res.json(users);
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function updateBaristaStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!["active", "disabled"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    if (id === req.userId) {
      return res
        .status(400)
        .json({ message: "You can't change your own status" });
    }

    const updated = await User.findOneAndUpdate(
      { _id: id, role: "barista" },
      { $set: { status } },
      { new: true }
    ).select("_id name email status");

    if (!updated) return res.status(404).json({ message: "Barista not found" });
    return res.json(updated);
  } catch {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function resetBaristaPassword(req, res) {
  try {
    const { id } = req.params;
    const { newPassword } = req.body || {};
    if (!newPassword)
      return res.status(400).json({ message: "Missing newPassword" });

    if (id === req.userId) {
      return res
        .status(400)
        .json({ message: "Use /me/password to change your own password" });
    }

    const u = await User.findOne({ _id: id, role: "barista" });
    if (!u) return res.status(404).json({ message: "Barista not found" });

    await u.setPassword(newPassword);
    await u.save();

    return res.json({ message: "Password reset" });
  } catch {
    return res.status(500).json({ message: "Server error" });
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
      { $match: { status: "completed", createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          total: { $sum: "$total" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return res.json(
      (agg || []).map((a) => ({ date: a._id, total: a.total || 0 }))
    );
  } catch (err) {
    return res.status(500).json({ message: "Server error" });
  }
}

export async function bestSellers(req, res) {
  try {
    const limit = Math.max(1, Math.min(50, Number(req.query.limit) || 5));
    const days = Math.max(1, Math.min(365, Number(req.query.days) || 30));
    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1));

    const categories = ["Meals", "Snacks", "Drinks"];

    // 1) Total completed orders in period (denominator for % of orders)
    const totalOrders = await Checkout.countDocuments({
      status: "completed",
      createdAt: { $gte: since },
    });

    // 2) Per-item metrics within the same period
    const itemAgg = await Checkout.aggregate([
      { $match: { status: "completed", createdAt: { $gte: since } } },
      { $unwind: "$items" },
      {
        $group: {
          _id: { menuItem: "$items.menuItem" },
          // sum quantities and revenue
          quantity: { $sum: "$items.quantity" },
          revenue: { $sum: "$items.subtotal" },
          // track distinct orders where item appeared
          orderIds: { $addToSet: "$_id" },
        },
      },
      {
        $project: {
          _id: 0,
          menuItemId: "$_id.menuItem",
          quantity: 1,
          revenue: 1,
          orderCount: { $size: "$orderIds" },
        },
      },
      // join to menuitems to get name & category
      {
        $lookup: {
          from: "menuitems",
          localField: "menuItemId",
          foreignField: "_id",
          as: "menuItem",
        },
      },
      { $unwind: "$menuItem" },
      {
        $project: {
          menuItemId: 1,
          name: "$menuItem.name",
          category: "$menuItem.category",
          quantity: 1,
          revenue: 1,
          orderCount: 1,
        },
      },
      { $match: { category: { $in: categories } } },
      { $sort: { category: 1, quantity: -1 } },
      {
        $group: {
          _id: "$category",
          items: {
            $push: {
              menuItemId: "$menuItemId",
              name: "$name",
              quantity: "$quantity",
              revenue: "$revenue",
              orderCount: "$orderCount",
            },
          },
        },
      },
      {
        $project: {
          _id: 1,
          items: { $slice: ["$items", limit] },
        },
      },
    ]);

    const result = categories.map((cat) => {
      const found = itemAgg.find((a) => a._id === cat);
      const items = (found?.items || []).map((it) => {
        const share = totalOrders > 0 ? (it.orderCount / totalOrders) * 100 : 0;
        return { ...it, orderShare: Number(share.toFixed(2)) };
      });
      return { _id: cat, items };
    });

    return res.json(result);
  } catch (err) {
    console.error("Best sellers error:", err);
    return res.status(500).json({ message: "Server error" });
  }
}
