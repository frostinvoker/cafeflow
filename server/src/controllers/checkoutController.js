// Checkout controllers: manage POS transactions.
// Create maps minimal POS input (menuItem + quantity) to stored line items
// with name and price snapshots for reliable receipts.
import Checkout from '../models/Checkout.js';
import MenuItem from '../models/MenuItem.js';
import Customer from '../models/Customer.js';
import AddOn from '../models/AddOn.js';

export async function listCheckouts(req, res) {
  try {
    const checkouts = await Checkout.find()
      .populate('customer', 'name contactNo')
      .sort({ createdAt: -1 });
    res.json(checkouts);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list checkouts' });
  }
}

export async function getCheckout(req, res) {
  try {
    const checkout = await Checkout.findById(req.params.id)
      .populate('customer', 'name contactNo')
      .populate('items.menuItem', 'name price')
      .populate('items.addons.addon', 'name price');
    if (!checkout) return res.status(404).json({ message: 'Checkout not found' });
    res.json(checkout);
  } catch {
    res.status(400).json({ message: 'Invalid checkout id' });
  }
}

export async function createCheckout(req, res) {
  try {
    const { items = [], customer, status = 'paid', paymentMethod, notes } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Checkout must include at least one item' });
    }

    // Accept input like [{ menuItem, quantity, addons?: [addonId,...] }]
    const menuIds = items.map((i) => i.menuItem).filter(Boolean);
    const menuDocs = await MenuItem.find({ _id: { $in: menuIds } });
    const itemById = new Map(menuDocs.map((m) => [m._id.toString(), m]));

    // Gather all addon ids referenced across items
    const addonIds = Array.from(
      new Set(
        items.flatMap((i) => Array.isArray(i.addons) ? i.addons : [])
      )
    );
    const addonDocs = await AddOn.find({ _id: { $in: addonIds }, active: true });
    const addonById = new Map(addonDocs.map((a) => [a._id.toString(), a]));

    const isDrink = (mi) => {
      if (mi?.itemType === 'drink') return true;
      // Fallback heuristic from category text if itemType not set
      const cat = (mi?.category || '').toLowerCase();
      return /(coffee|drink|beverage|tea)/.test(cat);
    };

    const lineItems = items.map((i) => {
      const doc = itemById.get(String(i.menuItem));
      if (!doc) throw new Error('Invalid menu item in items');
      const qty = Math.max(1, Number(i.quantity) || 1);

      // If addons provided, enforce drinks-only and allowedAddOns if defined
      let addonsSnapshots = [];
      const requestedAddons = Array.isArray(i.addons) ? i.addons : [];
      if (requestedAddons.length > 0) {
        if (!isDrink(doc)) {
          throw new Error(`Add-ons are only allowed for drinks: ${doc.name}`);
        }
        // Restrict to allowedAddOns if specified on menu item
        const allowed = (doc.allowedAddOns || []).map((id) => id.toString());
        addonsSnapshots = requestedAddons.map((aid) => {
          const a = addonById.get(String(aid));
          if (!a) throw new Error('Invalid or inactive add-on provided');
          if (allowed.length > 0 && !allowed.includes(String(a._id))) {
            throw new Error(`Add-on not allowed for this item: ${a.name}`);
          }
          // Ensure addon is applicable to drinks
          if (a.applicableTo !== 'drink') {
            throw new Error(`Add-on not applicable to drinks: ${a.name}`);
          }
          return { addon: a._id, name: a.name, price: a.price };
        });
      }

      return {
        menuItem: doc._id,
        name: doc.name,
        price: doc.price,
        quantity: qty,
        addons: addonsSnapshots,
        // subtotal will be recomputed by schema pre-validate
        subtotal: 0
      };
    });

    const checkout = new Checkout({ items: lineItems, customer, status, paymentMethod, notes });
    await checkout.validate(); // ensure totals & items are valid
    await checkout.save();

    // Optional simple loyalty rule: +1 point per currency unit spent
    if (customer) {
      const points = Math.floor(checkout.total);
      await Customer.findByIdAndUpdate(
        customer,
        { $inc: { loyaltyPoints: points }, $set: { lastPurchaseAt: new Date() } },
        { new: true }
      );
    }

    res.status(201).json(checkout);
  } catch (err) {
    res.status(400).json({ message: err?.message || 'Failed to create checkout' });
  }
}

export async function updateCheckout(req, res) {
  try {
    const { status, paymentMethod, notes, items } = req.body;

    const checkout = await Checkout.findById(req.params.id);
    if (!checkout) return res.status(404).json({ message: 'Checkout not found' });

    // Update basic fields
    if (status) checkout.status = status;
    if (paymentMethod !== undefined) checkout.paymentMethod = paymentMethod;
    if (notes !== undefined) checkout.notes = notes;

    // Optionally replace items by repeating the create logic
    if (Array.isArray(items)) {
      const menuIds = items.map((i) => i.menuItem).filter(Boolean);
      const menuDocs = await MenuItem.find({ _id: { $in: menuIds } });
      const itemById = new Map(menuDocs.map((m) => [m._id.toString(), m]));

      const addonIds = Array.from(new Set(items.flatMap((i) => Array.isArray(i.addons) ? i.addons : [])));
      const addonDocs = await AddOn.find({ _id: { $in: addonIds }, active: true });
      const addonById = new Map(addonDocs.map((a) => [a._id.toString(), a]));

      const isDrink = (mi) => {
        if (mi?.itemType === 'drink') return true;
        const cat = (mi?.category || '').toLowerCase();
        return /(coffee|drink|beverage|tea)/.test(cat);
      };

      checkout.items = items.map((i) => {
        const doc = itemById.get(String(i.menuItem));
        if (!doc) throw new Error('Invalid menu item in items');
        const qty = Math.max(1, Number(i.quantity) || 1);

        let addonsSnapshots = [];
        const requestedAddons = Array.isArray(i.addons) ? i.addons : [];
        if (requestedAddons.length > 0) {
          if (!isDrink(doc)) {
            throw new Error(`Add-ons are only allowed for drinks: ${doc.name}`);
          }
          const allowed = (doc.allowedAddOns || []).map((id) => id.toString());
          addonsSnapshots = requestedAddons.map((aid) => {
            const a = addonById.get(String(aid));
            if (!a) throw new Error('Invalid or inactive add-on provided');
            if (allowed.length > 0 && !allowed.includes(String(a._id))) {
              throw new Error(`Add-on not allowed for this item: ${a.name}`);
            }
            if (a.applicableTo !== 'drink') {
              throw new Error(`Add-on not applicable to drinks: ${a.name}`);
            }
            return { addon: a._id, name: a.name, price: a.price };
          });
        }

        return {
          menuItem: doc._id,
          name: doc.name,
          price: doc.price,
          quantity: qty,
          addons: addonsSnapshots,
          subtotal: 0
        };
      });
    }

    await checkout.validate();
    await checkout.save();
    res.json(checkout);
  } catch (err) {
    res.status(400).json({ message: err?.message || 'Failed to update checkout' });
  }
}

export async function deleteCheckout(req, res) {
  try {
    const deleted = await Checkout.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Checkout not found' });
    res.json({ message: 'Checkout deleted' });
  } catch {
    res.status(400).json({ message: 'Failed to delete checkout' });
  }
}
