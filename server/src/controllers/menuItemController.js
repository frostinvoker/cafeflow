// MenuItem controllers: CRUD operations for menu items.
// Keep business logic thin here; calculations belong in models/services.
import MenuItem from '../models/MenuItem.js';

export async function listMenuItems(req, res) {
  try {
    const { q, category, available } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (available === 'true') filter.available = true;
    if (available === 'false') filter.available = false;
    if (q) filter.name = { $regex: q, $options: 'i' };

    const items = await MenuItem.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list menu items' });
  }
}

export async function getMenuItem(req, res) {
  try {
    const item = await MenuItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Menu item not found' });
    res.json(item);
  } catch {
    res.status(400).json({ message: 'Invalid menu item id' });
  }
}

export async function createMenuItem(req, res) {
  try {
    const item = await MenuItem.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: 'Menu item already exists' });
    res.status(400).json({ message: 'Failed to create menu item' });
  }
}

export async function updateMenuItem(req, res) {
  try {
    const updated = await MenuItem.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!updated) return res.status(404).json({ message: 'Menu item not found' });
    res.json(updated);
  } catch {
    res.status(400).json({ message: 'Failed to update menu item' });
  }
}

export async function deleteMenuItem(req, res) {
  try {
    const deleted = await MenuItem.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Menu item not found' });
    res.json({ message: 'Menu item deleted' });
  } catch {
    res.status(400).json({ message: 'Failed to delete menu item' });
  }
}

