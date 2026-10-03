const Color = require('../models/Color');

const FIELDS = ['name', 'hex', 'brand', 'finishes', 'tags', 'swatchUrl'];

function pickFields(body) {
  const data = {};
  FIELDS.forEach((f) => {
    if (body[f] !== undefined) data[f] = body[f];
  });
  if (data.hex) {
    const h = data.hex.replace('#', '');
    data.rgb = {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }
  return data;
}

exports.getColors = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.tag) filter.tags = req.query.tag;
    if (req.query.q) {
      const safe = req.query.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      filter.name = new RegExp(safe, 'i');
    }
    const colors = await Color.find(filter).sort({ name: 1 });
    res.json(colors);
  } catch (err) {
    next(err);
  }
};

exports.getColor = async (req, res, next) => {
  try {
    const color = await Color.findById(req.params.id);
    if (!color) return res.status(404).json({ message: 'Colour not found' });
    res.json(color);
  } catch (err) {
    next(err);
  }
};

exports.createColor = async (req, res, next) => {
  try {
    const color = await Color.create(pickFields(req.body));
    res.status(201).json(color);
  } catch (err) {
    next(err);
  }
};

exports.updateColor = async (req, res, next) => {
  try {
    const color = await Color.findByIdAndUpdate(req.params.id, pickFields(req.body), {
      new: true,
      runValidators: true,
    });
    if (!color) return res.status(404).json({ message: 'Colour not found' });
    res.json(color);
  } catch (err) {
    next(err);
  }
};

exports.deleteColor = async (req, res, next) => {
  try {
    const color = await Color.findByIdAndDelete(req.params.id);
    if (!color) return res.status(404).json({ message: 'Colour not found' });
    res.json({ message: 'Colour deleted' });
  } catch (err) {
    next(err);
  }
};