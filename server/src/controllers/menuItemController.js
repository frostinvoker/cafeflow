import MenuItem from "../models/MenuItem.js";
import Inventory from "../models/Inventory.js";
import mongoose from "mongoose";

async function isFullyStocked(ingredientIds) {
  const zeroExists = await Inventory.exists({
    _id: { $in: ingredientIds },
    quantity: { $lte: 0 },
  });
  return !zeroExists;
}
function validateRecipe(raw, allowedIds, isDrink) {
  if (!Array.isArray(raw)) return [];
  const allowed = new Set((allowedIds || []).map(String));
  return raw
    .filter((r) => r && allowed.has(String(r.ingredient)))
    .map((r) => {
      const entry = {
        ingredient: r.ingredient,
        qtyPerUnit: Math.max(0, Number(r.qtyPerUnit ?? 0)),
      };
      if (isDrink && r.perSize) {
        const oz12 = Number(r.perSize.oz12);
        const oz16 = Number(r.perSize.oz16);
        entry.perSize = {
          ...(Number.isFinite(oz12) && oz12 >= 0 ? { oz12 } : {}),
          ...(Number.isFinite(oz16) && oz16 >= 0 ? { oz16 } : {}),
        };
        if (!Object.keys(entry.perSize).length) delete entry.perSize;
      }
      return entry;
    });
}

export async function listMenuItems(req, res) {
  try {
    const { q, category, available } = req.query;
    const match = {};
    if (category) match.category = category;
    if (q) match.name = { $regex: q, $options: "i" };

    const pipeline = [
      { $match: match },
      {
        $lookup: {
          from: "inventories",
          localField: "ingredients",
          foreignField: "_id",
          as: "ing",
        },
      },
      {
        $addFields: {
          stockOk: {
            $not: {
              $anyElementTrue: {
                $map: {
                  input: "$ing",
                  as: "i",
                  in: { $lte: ["$$i.quantity", 0] },
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          availableComputed: "$stockOk",
          effectiveAvailable: { $and: ["$available", "$stockOk"] },
        },
      },
      { $project: { ing: 0, stockOk: 0 } },
      { $sort: { createdAt: -1 } },
    ];

    if (available === "true")
      pipeline.splice(4, 0, { $match: { effectiveAvailable: true } });
    if (available === "false")
      pipeline.splice(4, 0, { $match: { effectiveAvailable: false } });

    const items = await MenuItem.aggregate(pipeline);
    res.json(items);
  } catch {
    res.status(500).json({ message: "Failed to list menu items" });
  }
}

export async function getMenuItem(req, res) {
  try {
    const _id = new mongoose.Types.ObjectId(req.params.id);
    const [doc] = await MenuItem.aggregate([
      { $match: { _id } },
      {
        $lookup: {
          from: "inventories",
          localField: "ingredients",
          foreignField: "_id",
          as: "ing",
        },
      },
      {
        $addFields: {
          stockOk: {
            $not: {
              $anyElementTrue: {
                $map: {
                  input: "$ing",
                  as: "i",
                  in: { $lte: ["$$i.quantity", 0] },
                },
              },
            },
          },
        },
      },
      {
        $addFields: {
          availableComputed: "$stockOk",
          effectiveAvailable: { $and: ["$available", "$stockOk"] },
        },
      },
      { $project: { ing: 0, stockOk: 0 } },
    ]);
    if (!doc) return res.status(404).json({ message: "Menu item not found" });
    res.json(doc);
  } catch {
    res.status(400).json({ message: "Invalid menu item id" });
  }
}

export async function createMenuItem(req, res) {
  try {
    const { name, category, price, sizePrices, ingredients, recipe } = req.body;

    const baseIds = Array.isArray(ingredients)
      ? [...new Set(ingredients.map(String))]
      : [];
    if (baseIds.length === 0)
      return res
        .status(400)
        .json({ message: "Select at least one ingredient." });

    const count = await Inventory.countDocuments({ _id: { $in: baseIds } });
    if (count !== baseIds.length)
      return res
        .status(400)
        .json({ message: "One or more ingredient items are invalid." });

    const available = await isFullyStocked(baseIds);

    const cat = (category || "").toLowerCase();
    if (cat === "drinks") {
      if (
        !sizePrices ||
        typeof sizePrices.oz12 !== "number" ||
        typeof sizePrices.oz16 !== "number"
      )
        return res
          .status(400)
          .json({
            message: "Drinks require sizePrices.oz12 and sizePrices.oz16",
          });
    } else {
      if (typeof price !== "number")
        return res.status(400).json({ message: "Non-drinks require price" });
    }

    const isDrinkType = (category || "").toLowerCase() === "drinks";
    const normalizedRecipe =
      Array.isArray(recipe) && recipe.length
        ? validateRecipe(recipe, baseIds, isDrinkType)
        : baseIds.map((id) => ({ ingredient: id, qtyPerUnit: 0 }));
    const item = await MenuItem.create({
      name,
      category,
      price,
      sizePrices,
      ingredients: baseIds,
      recipe: normalizedRecipe,
      available,
    });

    res.status(201).json(item);
  } catch (err) {
    if (err?.code === 11000)
      return res.status(409).json({ message: "Menu item already exists" });
    if (err?.name === "ValidationError" && err?.errors) {
      const msg = Object.values(err.errors)
        .map((e) => e.message)
        .join(", ");
      return res.status(400).json({ message: msg });
    }
    return res
      .status(400)
      .json({ message: err?.message || "Failed to create menu item" });
  }
}

export async function updateMenuItem(req, res) {
  try {
    const patch = req.body;
    const doc = await MenuItem.findById(req.params.id);
    if (!doc) return res.status(404).json({ message: "Menu item not found" });

    if (!Array.isArray(patch.ingredients) || patch.ingredients.length === 0)
      return res
        .status(400)
        .json({ message: "Select at least one ingredient." });

    doc.name = patch.name?.trim() ?? doc.name;
    doc.category = patch.category ?? doc.category;
    doc.available = !!patch.available;
    doc.ingredients = patch.ingredients;

    const isDrink = (doc.category || "").toLowerCase() === "drinks";
    if (isDrink) {
      const oz12 = Number(patch.sizePrices?.oz12);
      const oz16 = Number(patch.sizePrices?.oz16);
      if (!Number.isFinite(oz12) || !Number.isFinite(oz16))
        return res
          .status(400)
          .json({ message: "Drinks require numeric 12oz and 16oz prices" });
      doc.sizePrices = { oz12, oz16 };
      doc.price = undefined;
    } else {
      const price = Number(patch.price);
      if (!Number.isFinite(price))
        return res
          .status(400)
          .json({ message: "Non-drinks require a numeric price" });
      doc.price = price;
      doc.sizePrices = undefined;
    }

    doc.recipe =
      Array.isArray(patch.recipe) && patch.recipe.length
        ? validateRecipe(patch.recipe, doc.ingredients, isDrink)
        : doc.ingredients.map((id) => ({ ingredient: id, qtyPerUnit: 0 }));

    const saved = await doc.save();
    return res.json(saved);
  } catch (err) {
    return res
      .status(400)
      .json({ message: err?.message || "Failed to update menu item" });
  }
}

export async function deleteMenuItem(req, res) {
  try {
    const deleted = await MenuItem.findByIdAndDelete(req.params.id);
    if (!deleted)
      return res.status(404).json({ message: "Menu item not found" });
    res.json({ message: "Menu item deleted" });
  } catch {
    res.status(400).json({ message: "Failed to delete menu item" });
  }
}
