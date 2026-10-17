const User = require('../models/User');
const Project = require('../models/Project');

exports.listUsers = async (req, res, next) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).lean();
    const counts = await Project.aggregate([
      { $group: { _id: '$owner', count: { $sum: 1 } } },
    ]);
    const countMap = new Map(counts.map((c) => [String(c._id), c.count]));

    res.json(
      users.map((u) => ({
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
        projectCount: countMap.get(String(u._id)) || 0,
      }))
    );
  } catch (err) {
    next(err);
  }
};

exports.userProjects = async (req, res, next) => {
  try {
    const projects = await Project.find({ owner: req.params.id }).sort({ updatedAt: -1 });
    res.json(projects);
  } catch (err) {
    next(err);
  }
};