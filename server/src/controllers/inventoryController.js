import Inventory from '../models/Inventory.js';

export async function listInventory(req, res) {
  try {
    const { q, category, available } = req.query;
    const filter = {};
    if (category) filter.category = category;
    if (available === 'true') filter.available = true;
    if (available === 'false') filter.available = false;
    if (q) filter.name = { $regex: q, $options: 'i' };

    const items = await Inventory.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list inventory' });
  }
}

export async function getInventoryItem(req, res) {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Inventory item not found' });
    res.json(item);
  } catch {
    res.status(400).json({ message: 'Invalid inventory id' });
  }
}

export async function createInventoryItem(req, res) {
  try {
    const item = await Inventory.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: 'Inventory item already exists' });
    res.status(400).json({ message: 'Failed to create inventory item' });
  }
}

export async function updateInventoryItem(req, res) {
  try {
    const updated = await Inventory.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!updated) return res.status(404).json({ message: 'Inventory item not found' });
    res.json(updated);
  } catch {
    res.status(400).json({ message: 'Failed to update inventory item' });
  }
}

export async function deleteInventoryItem(req, res) {
  try {
    const deleted = await Inventory.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Inventory item not found' });
    res.json({ message: 'Inventory item deleted' });
  } catch {
    res.status(400).json({ message: 'Failed to delete inventory item' });
  }
}

