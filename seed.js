const mongoose = require('mongoose');
const Inventory = require('./models/Inventory'); // adjust path if needed

// 🔗 Replace this with your MongoDB connection string
const MONGODB_URI = 'mongodb+srv://Jay-s-on:LALAmove@cluster0.ettfth2.mongodb.net/Blue52db?retryWrites=true&w=majority';

async function seedInventory() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing records
    await Inventory.deleteMany({});
    console.log('🧹 Cleared existing inventory data');

    // Sample inventory data
    const inventoryData = [
      { type: 'Drinks', name: 'Mocha', amount: 190 },
      { type: 'Beverage', name: 'Coffee', amount: 50 },
      
 
    ];

    // Insert new records
    await Inventory.insertMany(inventoryData);
    console.log('🌱 Seed data inserted successfully');

  } catch (err) {
    console.error('❌ Error seeding data:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

seedInventory();
