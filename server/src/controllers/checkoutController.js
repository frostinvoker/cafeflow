// controllers/checkoutController.js
import mongoose from 'mongoose';
import Checkout from '../models/Checkout.js';
import MenuItem from '../models/MenuItem.js';
import Customer from '../models/Customer.js';
import AddOn from '../models/AddOn.js';

export async function listCheckouts(req, res) {
  try {
    const checkouts = await Checkout.find()
      .populate('customer', 'name email loyaltyPoints')
      .sort({ createdAt: -1 });
    res.json(checkouts);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list checkouts' });
  }
}

export async function getCheckout(req, res) {
  try {
    const checkout = await Checkout.findById(req.params.id)
      .populate('customer', 'name email loyaltyPoints')
      .populate('items.menuItem', 'name price')
      .populate('items.addons.addon', 'name price');
    if (!checkout) return res.status(404).json({ message: 'Checkout not found' });
    res.json(checkout);
  } catch {
    res.status(400).json({ message: 'Invalid checkout id' });
  }
}

export async function createCheckout(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      items = [],
      customer: customerId,
      status = 'pending',
      paymentMethod = 'cash',
      payment = {},              // { tendered, referenceId }
      orderType = 'takeout',
      redeemFreeDrink = false    // optional boolean to redeem 100 pts
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      throw new Error('Checkout must include at least one item');
    }

    // Load menu + add-ons
    const menuIds = items.map(i => i.menuItem).filter(Boolean);
    const menuDocs = await MenuItem.find({ _id: { $in: menuIds }, available: true }).session(session);
    const itemById = new Map(menuDocs.map(m => [m._id.toString(), m]));

    const addonIds = Array.from(new Set(items.flatMap(i => Array.isArray(i.addons) ? i.addons : [])));
    const addonDocs = await AddOn.find({ _id: { $in: addonIds }, active: true }).session(session);
    const addonById = new Map(addonDocs.map(a => [a._id.toString(), a]));

    const isDrink = (mi) => (mi?.category || '').toLowerCase() === 'drinks';

    // Build line item snapshots
    const lineItems = items.map((i) => {
      const doc = itemById.get(String(i.menuItem));
      if (!doc) throw new Error('Invalid or unavailable menu item');
      const qty = Math.max(1, Number(i.quantity) || 1);

      // Add-ons
      const requestedAddons = Array.isArray(i.addons) ? i.addons : [];
      let addonsSnapshots = [];
      if (requestedAddons.length > 0) {
        if (!isDrink(doc)) throw new Error(`Add-ons only allowed for drinks: ${doc.name}`);
        const allowed = (doc.allowedAddOns || []).map(id => id.toString());
        addonsSnapshots = requestedAddons.map((aid) => {
          const a = addonById.get(String(aid));
          if (!a) throw new Error('Invalid or inactive add-on');
          if (allowed.length > 0 && !allowed.includes(String(a._id))) {
            throw new Error(`Add-on not allowed for ${doc.name}: ${a.name}`);
          }
          return { addon: a._id, name: a.name, price: a.price };
        });
      }

      return {
        menuItem: doc._id,
        name: doc.name,
        price: Number(doc.price) || 0,
        quantity: qty,
        addons: addonsSnapshots,
        lineDiscount: 0, // per-unit discount; controller may set for 100-pt redemption
        subtotal: 0      // computed by pre-validate
      };
    });

    // Optional: redeem 100 pts => make ONE drink free (base price only)
    // You can switch to include add-ons in the free value by changing basePerUnit below.
    let pointsSpent = 0;
    if (redeemFreeDrink && customerId) {
      const cust = await Customer.findById(customerId).session(session);
      if (cust && cust.loyaltyPoints >= 100) {
        // choose the first drink line (or pick the highest-priced drink if you prefer)
        const drinkIndex = lineItems.findIndex(li => {
          const src = itemById.get(String(li.menuItem));
          return isDrink(src);
        });
        if (drinkIndex >= 0) {
          const li = lineItems[drinkIndex];
          const basePerUnit = Number(li.price) || 0; // free base drink only
          // To discount exactly one unit across the whole line, distribute as per-unit:
          // perUnitDiscount * quantity = total discount for 1 unit
          const perUnitDiscount = li.quantity > 0 ? basePerUnit / li.quantity : 0;
          li.lineDiscount = Math.min(li.lineDiscount + perUnitDiscount, li.price); // cap per-unit
          pointsSpent = 100;
        }
      }
    }

    // Build customer snapshot
    let customerSnapshot;
    if (customerId) {
      const cust = await Customer.findById(customerId).session(session);
      if (cust) {
        customerSnapshot = { name: cust.name || '', email: cust.email || '' };
      }
    }

    // Create checkout
    const checkout = new Checkout({
      items: lineItems,
      customer: customerId || undefined,
      customerSnapshot,
      status,
      paymentMethod,
      payment: {
        tendered: Number(payment.tendered) || 0,
        referenceId: payment.referenceId || ''
      },
      orderType
    });

    // let model compute subtotals/totals
    await checkout.validate({ session });
    // compute change (cash only)
    if (paymentMethod === 'cash') {
      checkout.payment.change = Math.max(0, (checkout.payment.tendered || 0) - (checkout.total || 0));
    } else {
      checkout.payment.change = 0;
    }

    // Earn 10% points on what they paid (after redemption).
    // Round down to an integer.
    const pointsEarned = Math.floor((checkout.total || 0) * 0.10);
    checkout.pointsEarned = pointsEarned;
    checkout.pointsSpent = pointsSpent;

    await checkout.save({ session });

    // Update customer points atomically
    if (customerId) {
      await Customer.findByIdAndUpdate(
        customerId,
        { $inc: { loyaltyPoints: pointsEarned - pointsSpent } },
        { new: true, session }
      );
    }

    await session.commitTransaction();
    res.status(201).json(checkout);
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ message: err?.message || 'Failed to create checkout' });
  } finally {
    session.endSession();
  }
}

export async function updateCheckout(req, res) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { status, paymentMethod, payment } = req.body;

    const checkout = await Checkout.findById(req.params.id).session(session);
    if (!checkout) return res.status(404).json({ message: 'Checkout not found' });

    if (status) checkout.status = status;
    if (paymentMethod) checkout.paymentMethod = paymentMethod;
    if (payment) {
      checkout.payment.tendered = Number(payment.tendered) || checkout.payment.tendered || 0;
      checkout.payment.referenceId = payment.referenceId ?? checkout.payment.referenceId;
    }

    await checkout.validate({ session });
    if (checkout.paymentMethod === 'cash') {
      checkout.payment.change = Math.max(0, (checkout.payment.tendered || 0) - (checkout.total || 0));
    } else {
      checkout.payment.change = 0;
    }

    await checkout.save({ session });
    await session.commitTransaction();
    res.json(checkout);
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ message: err?.message || 'Failed to update checkout' });
  } finally {
    session.endSession();
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
