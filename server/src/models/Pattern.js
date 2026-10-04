const mongoose = require('mongoose');

const patternSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    category: { type: String, trim: true, default: 'General' },
    imageUrl: { type: String, required: true },
    scale: { type: Number, default: 1, min: 0.1 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Pattern', patternSchema);