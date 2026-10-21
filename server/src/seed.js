require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Color = require('./models/Color');
const Pattern = require('./models/Pattern');

const COLORS = [
  ['Ocean Breeze Blue', '#4A90B8', 'Living Room'], ['Sky Whisper', '#A8D0E6', 'Bedroom'],
  ['Deep Navy', '#1F3A5F', 'Accent'], ['Sage Green', '#9DB4A0', 'Living Room'],
  ['Forest Moss', '#5B7F5B', 'Accent'], ['Mint Cream', '#CDEAD8', 'Kitchen'],
  ['Sunny Yellow', '#F6D55C', 'Kitchen'], ['Butter Cream', '#F8EBC0', 'Living Room'],
  ['Warm Peach', '#F4B393', 'Bedroom'], ['Terracotta', '#C8694B', 'Accent'],
  ['Coral Blush', '#F28B82', 'Bedroom'], ['Brick Red', '#A8432F', 'Accent'],
  ['Soft Lavender', '#B8A9D9', 'Bedroom'], ['Dusty Plum', '#7D5A7E', 'Accent'],
  ['Pearl White', '#F5F3EE', 'Living Room'], ['Warm Ivory', '#EDE4D3', 'Living Room'],
  ['Light Grey', '#D4D4D4', 'Office'], ['Slate Grey', '#6B7280', 'Office'],
  ['Charcoal', '#374151', 'Accent'], ['Sand Beige', '#D8C3A5', 'Living Room'],
  ['Mocha', '#8B6B52', 'Accent'], ['Teal Lagoon', '#2A8C8C', 'Accent'],
  ['Rose Dust', '#E3B7B7', 'Bedroom'], ['Olive Grove', '#8A8F4B', 'Kitchen'],
];

const svgUri = (svg) => 'data:image/svg+xml,' + encodeURIComponent(svg);
const PATTERNS = [
  ['Soft Stripes', 'Geometric', svgUri("<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect width='40' height='40' fill='#f3f4f6'/><rect width='20' height='40' fill='#cbd5e1'/></svg>")],
  ['Polka Dots', 'Playful', svgUri("<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect width='40' height='40' fill='#fef3c7'/><circle cx='20' cy='20' r='6' fill='#f59e0b'/></svg>")],
  ['Diamonds', 'Geometric', svgUri("<svg xmlns='http://www.w3.org/2000/svg' width='40' height='40'><rect width='40' height='40' fill='#e0e7ff'/><polygon points='20,4 36,20 20,36 4,20' fill='#818cf8'/></svg>")],
];

function toRgb(hex) {
  const h = hex.replace('#', '');
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI);

  for (const [name, hex, tag] of COLORS) {
    await Color.updateOne(
      { name },
      { $setOnInsert: { name, hex, rgb: toRgb(hex), brand: 'WallCanva', finishes: ['matte', 'satin', 'glossy'], tags: [tag] } },
      { upsert: true }
    );
  }
  for (const [name, category, imageUrl] of PATTERNS) {
    await Pattern.updateOne({ name }, { $setOnInsert: { name, category, imageUrl, scale: 1 } }, { upsert: true });
  }

  const email = (process.env.SEED_ADMIN_EMAIL || 'admin@wallcanva.com').toLowerCase();
  const exists = await User.findOne({ email });
  if (!exists) {
    const passwordHash = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'Admin12345', 10);
    await User.create({ name: 'Admin', email, passwordHash, role: 'admin' });
    console.log(`Admin created: ${email}`);
  } else {
    console.log(`Admin already exists: ${email}`);
  }

  console.log(`Colours: ${await Color.countDocuments()}, Patterns: ${await Pattern.countDocuments()}`);
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });