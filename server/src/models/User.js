const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    favouriteColors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Color' }],
    favouritePatterns: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pattern' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);