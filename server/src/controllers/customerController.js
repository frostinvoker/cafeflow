import Customer from '../models/Customer.js';

export async function listCustomers(req, res) {
  try {
    const { q } = req.query;
    const filter = q ? { name: { $regex: q, $options: 'i' } } : {};
    const customers = await Customer.find(filter).sort({ createdAt: -1 });
    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: 'Failed to list customers' });
  }
}

export async function getCustomer(req, res) {
  try {
    const customer = await Customer.findById(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });
    res.json(customer);
  } catch {
    res.status(400).json({ message: 'Invalid customer id' });
  }
}

export async function createCustomer(req, res) {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json(customer);
  } catch (err) {
    if (err?.code === 11000) return res.status(409).json({ message: 'Contact number already exists' });
    res.status(400).json({ message: 'Failed to create customer' });
  }
}

export async function updateCustomer(req, res) {
  try {
    const updated = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!updated) return res.status(404).json({ message: 'Customer not found' });
    res.json(updated);
  } catch {
    res.status(400).json({ message: 'Failed to update customer' });
  }
}

export async function deleteCustomer(req, res) {
  try {
    const deleted = await Customer.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Customer not found' });
    res.json({ message: 'Customer deleted' });
  } catch {
    res.status(400).json({ message: 'Failed to delete customer' });
  }
}

