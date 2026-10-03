const mongoose = require('mongoose');

const colorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    hex: { type: String, required: true, uppercase: true, match: /^#[0-9A-F]{6}$/ },
    rgb: { r: Number, g: Number, b: Number },
    brand: { type: String, trim: true, default: '' },
    finishes: [{ type: String, enum: ['matte', 'satin', 'glossy'] }],
    tags: [{ type: String, trim: true }],
    swatchUrl: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Color', colorSchema);