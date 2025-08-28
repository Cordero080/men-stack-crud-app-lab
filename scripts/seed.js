// scripts/seed.js
// Purpose: One-time seed of core Form names so /new dropdown has options.

require('dotenv').config();
const connectDB = require('../db');       // uses your existing db.js
const Form = require('../models/Form');   // Mongoose model

async function run() {
  await connectDB();

  // Wipe ALL existing forms (fresh start)
  await Form.deleteMany({});
  console.log("🗑️ All existing forms deleted. Seeding new data...");

  // Minimal starter set (you can expand later)
  const docs = [
    { name: 'Sanchin',        rankType: 'kyu', rankNumber: 10, category: 'Kata', beltColor: 'White' },
    { name: 'Tensho',         rankType: 'kyu', rankNumber: 6,  category: 'Kata', beltColor: 'Green' },
    { name: 'Geikisai #1',    rankType: 'kyu', rankNumber: 8,  category: 'Kata', beltColor: 'White' },
    { name: 'Geikisai #2',    rankType: 'kyu', rankNumber: 7,  category: 'Kata', beltColor: 'White' },
    { name: 'Geikisai #3',    rankType: 'kyu', rankNumber: 6,  category: 'Kata', beltColor: 'Green' },
    { name: 'Saifa',          rankType: 'kyu', rankNumber: 5,  category: 'Kata', beltColor: 'Green' },
    { name: 'Seisan',         rankType: 'kyu', rankNumber: 2,  category: 'Kata', beltColor: 'Brown' },
    { name: 'Seipai',         rankType: 'dan', rankNumber: 1,  category: 'Kata', beltColor: 'Black' },
    { name: 'Shisochin',      rankType: 'dan', rankNumber: 2,  category: 'Kata', beltColor: 'Black' },
    { name: 'Sanseiru',       rankType: 'dan', rankNumber: 3,  category: 'Kata', beltColor: 'Black' },
    { name: 'Kururunfa',      rankType: 'dan', rankNumber: 4,  category: 'Kata', beltColor: 'Black' },
    { name: 'Pichurin',       rankType: 'dan', rankNumber: 5,  category: 'Kata', beltColor: 'Black' },
  ];

  await Form.insertMany(docs);

  const count = await Form.countDocuments({ deletedAt: null });
  console.log(`✅ Seed complete. Active forms: ${count}`);

  process.exit(0);
}

run().catch(err => {
  console.error('❌ Seed error:', err);
  process.exit(1);
});
