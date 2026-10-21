const User = require('../models/User');

exports.getFavouriteColors = (req, res) => {
  res.json(req.user.favouriteColors);
};

exports.toggleFavouriteColor = async (req, res, next) => {
  try {
    const id = req.params.id;
    const has = req.user.favouriteColors.map(String).includes(id);
    const update = has
      ? { $pull: { favouriteColors: id } }
      : { $addToSet: { favouriteColors: id } };
    const user = await User.findByIdAndUpdate(req.user._id, update, { new: true });
    res.json(user.favouriteColors);
  } catch (err) {
    next(err);
  }
};