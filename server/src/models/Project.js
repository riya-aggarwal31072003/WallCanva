const mongoose = require('mongoose');

const selectionSchema = new mongoose.Schema(
  {
    // polygon points stored as 0-1 fractions of image width/height
    points: [{ x: Number, y: Number }],
    colorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Color' },
    patternId: { type: mongoose.Schema.Types.ObjectId, ref: 'Pattern' },
    hex: { type: String, default: '' },
    opacity: { type: Number, default: 0.7, min: 0, max: 1 },
    finish: { type: String, enum: ['matte', 'satin', 'glossy'], default: 'matte' },
        blend: { type: String, enum: ['multiply', 'overlay', 'soft-light'], default: 'multiply' },
  },
  { _id: true }
);

const projectSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'Untitled design', trim: true },
    originalImageUrl: { type: String, required: true },
    imagePublicId: { type: String, required: true },
    selections: [selectionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Project', projectSchema);