import MenuItem from '../models/MenuItem.js';
import Inventory from '../models/Inventory.js';
import mongoose from 'mongoose';
async function isFullyStocked(ingredientIds) {
  const zeroExists = await Inventory.exists({ _id: { $in: ingredientIds }, quantity: { $lte: 0 } });
  return !zeroExists;
}

export async function listMenuItems(req, res) {
  try {
    const { q, category, available } = req.query;

    const match = {};
    if (category) match.category = category;
    if (q) match.name = { $regex: q, $options: 'i' };

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: 'inventories',           
          localField: 'ingredients',
          foreignField: '_id',
          as: 'ing',
        }
      },
      {
        $addFields: {
          availableComputed: {
            $not: {
              $anyElementTrue: {
                $map: {
                  input: '$ing',
                  as: 'i',
                  in: { $lte: ['$$i.quantity', 0] }
                }
              }
            }
          }
        }
      },
    ];

    if (available === 'true')  pipeline.push({ $match: { availableComputed: true } });
    if (available === 'false') pipeline.push({ $match: { availableComputed: false } });

    pipeline.push({ $project: { ing: 0 } }, { $sort: { createdAt: -1 } });

    const items = await MenuItem.aggregate(pipeline);
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list menu items' });
  }
}


export async function getMenuItem(req, res) {
  try {
    const _id = new mongoose.Types.ObjectId(req.params.id);
    const [doc] = await MenuItem.aggregate([
      { $match: { _id } },
      {
        $lookup: { from: 'inventories', localField: 'ingredients', foreignField: '_id', as: 'ing' }
      },
      {
        $addFields: {
          availableComputed: {
            $not: {
              $anyElementTrue: {
                $map: { input: '$ing', as: 'i', in: { $lte: ['$$i.quantity', 0] } }
              }
            }
          }
        }
      },
      { $project: { ing: 0 } }
    ]);
    if (!doc) return res.status(404).json({ message: 'Menu item not found' });
    res.json(doc);
  } catch {
    res.status(400).json({ message: 'Invalid menu item id' });
  }
}
  
export async function createMenuItem(req, res) {
  try {
    const { name, category, price, ingredients } = req.body;

    if (!Array.isArray(ingredients) || ingredients.length === 0)
      return res.status(400).json({ message: 'Select at least one ingredient.' });

    const uniq = [...new Set(ingredients.map(String))];
    const count = await Inventory.countDocuments({ _id: { $in: uniq } });
    if (count !== uniq.length)
      return res.status(400).json({ message: 'One or more ingredient items are invalid.' });

    const available = await isFullyStocked(uniq);

    const item = await MenuItem.create({ name, category, price, ingredients: uniq, available });
    res.status(201).json(item);
} catch (err) {
  console.error('createMenuItem error:', err);

  if (err?.code === 11000) {
    return res.status(409).json({ message: 'Menu item already exists' });
  }

  if (err?.name === 'ValidationError' && err?.errors) {
    const msg = Object.values(err.errors).map(e => e.message).join(', ');
    return res.status(400).json({ message: msg });
  }

  if (err?.name === 'CastError') {
    return res.status(400).json({ message: `Invalid ID for ${err.path}: ${err.value}` });
  }

  return res.status(400).json({ message: err?.message || 'Failed to create menu item' });
}

}

export async function updateMenuItem(req, res) {
  try {
    const patch = req.body;

    if (patch.ingredients) {
      if (!Array.isArray(patch.ingredients) || patch.ingredients.length === 0)
        return res.status(400).json({ message: 'Select at least one ingredient.' });

      const uniq = [...new Set(patch.ingredients.map(String))];
      const count = await Inventory.countDocuments({ _id: { $in: uniq } });
      if (count !== uniq.length)
        return res.status(400).json({ message: 'One or more ingredient items are invalid.' });

      // whenever ingredients change, recompute availability
      patch.available = await isFullyStocked(uniq);
      patch.ingredients = uniq;
    }

    const updated = await MenuItem.findByIdAndUpdate(req.params.id, patch, {
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

