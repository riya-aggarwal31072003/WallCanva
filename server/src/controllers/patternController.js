const Pattern = require('../models/Pattern');

const FIELDS = ['name', 'description', 'category', 'imageUrl', 'scale'];

function pickFields(body) {
  const data = {};
  FIELDS.forEach((f) => {
    if (body[f] !== undefined) data[f] = body[f];
  });
  return data;
}

exports.getPatterns = async (req, res, next) => {
  try {
    const filter = req.query.category ? { category: req.query.category } : {};
    res.json(await Pattern.find(filter).sort({ name: 1 }));
  } catch (err) {
    next(err);
  }
};

exports.getPattern = async (req, res, next) => {
  try {
    const pattern = await Pattern.findById(req.params.id);
    if (!pattern) return res.status(404).json({ message: 'Pattern not found' });
    res.json(pattern);
  } catch (err) {
    next(err);
  }
};

exports.createPattern = async (req, res, next) => {
  try {
    res.status(201).json(await Pattern.create(pickFields(req.body)));
  } catch (err) {
    next(err);
  }
};

exports.updatePattern = async (req, res, next) => {
  try {
    const pattern = await Pattern.findByIdAndUpdate(req.params.id, pickFields(req.body), {
      new: true,
      runValidators: true,
    });
    if (!pattern) return res.status(404).json({ message: 'Pattern not found' });
    res.json(pattern);
  } catch (err) {
    next(err);
  }
};

exports.deletePattern = async (req, res, next) => {
  try {
    const pattern = await Pattern.findByIdAndDelete(req.params.id);
    if (!pattern) return res.status(404).json({ message: 'Pattern not found' });
    res.json({ message: 'Pattern deleted' });
  } catch (err) {
    next(err);
  }
};