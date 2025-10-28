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
      payment = {},
      orderType = 'takeout',
      redeemFreeDrink = false
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

    // Build line items
    const lineItems = items.map((i) => {
      // controllers/checkoutController.js (inside createCheckout, in the map over items)
      const doc = itemById.get(String(i.menuItem));
      if (!doc) throw new Error('Invalid or unavailable menu item');
      const qty = Math.max(1, Number(i.quantity) || 1);

      let unitPrice = 0;
      let chosenSize;

      // If it's a drink, require a size and use sizePrices
      if (isDrink(doc)) {
        const s = String(i.size || '').toLowerCase();
        if (s !== '12oz' && s !== '16oz') {
          throw new Error(`Drink requires size 12oz or 16oz: ${doc.name}`);
        }
        chosenSize = s;
        const sp = doc.sizePrices || {};
        unitPrice = s === '12oz' ? Number(sp.oz12) || 0 : Number(sp.oz16) || 0;
      } else {
        // Non-drinks: use single price; ignore any provided size
        unitPrice = Number(doc.price) || 0;
      }

      const addonsSnapshots = (Array.isArray(i.addons) ? i.addons : []).map((aid) => {
      const a = addonById.get(String(aid));
      if (!a) throw new Error('Invalid or inactive add-on');
      return { addon: a._id, name: a.name, price: Number(a.price) || 0 };
      });

      return {
        menuItem: doc._id,
        name: doc.name,
        price: unitPrice,
        size: chosenSize,          // <-- keep it on the line for receipts/history
        quantity: qty,
        addons: addonsSnapshots,
        lineDiscount: 0,
        subtotal: 0,
      };
    });

    // ---- ENFORCE: redeem only if exactly 1 item AND it's a drink ----
    const singleDrinkOnly =
      lineItems.length === 1 &&
      isDrink(itemById.get(String(lineItems[0].menuItem)));

    let pointsSpent = 0;
    if (redeemFreeDrink && customerId) {
      const cust = await Customer.findById(customerId).session(session);

      if (!(cust && cust.loyaltyPoints >= 100 && singleDrinkOnly)) {
        // Choose one behavior:
        // 1) HARD FAIL (strict):
        // throw new Error('Free drink redemption requires exactly one drink item and at least 100 points.');
        // 2) SOFT IGNORE (don’t redeem if not eligible):
        // do nothing; pointsSpent remains 0
      } else {
        // Apply a discount equal to ONE base unit price (not add-ons) on that single drink line
        const li = lineItems[0];
        const basePerUnit = Number(li.price) || 0;
        const perUnitDiscount = li.quantity > 0 ? basePerUnit / li.quantity : 0;
        li.lineDiscount = Math.min(li.lineDiscount + perUnitDiscount, li.price);
        pointsSpent = 100;
      }
    }
    // ----------------------------------------------------------------

    // Customer snapshot
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

    await checkout.validate({ session });
    if (paymentMethod === 'cash') {
      checkout.payment.change = Math.max(0, (checkout.payment.tendered || 0) - (checkout.total || 0));
    } else {
      checkout.payment.change = 0;
    }

    // ---- NO EARNING WHEN REDEEMING ----
    let pointsEarned = Math.floor((checkout.total || 0) * 0.10);
    if (pointsSpent > 0) pointsEarned = 0;
    checkout.pointsEarned = pointsEarned;
    checkout.pointsSpent  = pointsSpent;
    // -----------------------------------

    await checkout.save({ session });

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
