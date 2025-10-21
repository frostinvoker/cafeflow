// AddOn controllers: CRUD for drink add-ons (e.g., syrups, extra shots)
import AddOn from '../models/AddOn.js';

export async function listAddOns(req, res) {
  try {
    const { q, active } = req.query;
    const filter = {};
    if (q) filter.name = { $regex: q, $options: 'i' };
    if (active === 'true') filter.active = true;
    if (active === 'false') filter.active = false;
    const items = await AddOn.find(filter).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list add-ons' });
  }
}

export async function getAddOn(req, res) {
  try {
    const item = await AddOn.findById(req.params.id);
    if (!item) return res.status(404).json({ message: 'Add-on not found' });
    res.json(item);
  } catch {
    res.status(400).json({ message: 'Invalid add-on id' });
  }
}

export async function createAddOn(req, res) {
  try {
    const item = await AddOn.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: 'Add-on already exists' });
    res.status(400).json({ message: 'Failed to create add-on' });
  }
}

export async function updateAddOn(req, res) {
  try {
    const updated = await AddOn.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!updated) return res.status(404).json({ message: 'Add-on not found' });
    res.json(updated);
  } catch {
    res.status(400).json({ message: 'Failed to update add-on' });
  }
}

export async function deleteAddOn(req, res) {
  try {
    const deleted = await AddOn.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Add-on not found' });
    res.json({ message: 'Add-on deleted' });
  } catch {
    res.status(400).json({ message: 'Failed to delete add-on' });
  }
}

