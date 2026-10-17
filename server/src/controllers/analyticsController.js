const User = require('../models/User');
const Project = require('../models/Project');
const Feedback = require('../models/Feedback');
const Session = require('../models/Session');

// ---- any logged-in user ----
exports.startSession = async (req, res, next) => {
  try {
    const s = await Session.create({ user: req.user._id });
    res.status(201).json({ sessionId: s._id });
  } catch (err) { next(err); }
};

exports.pingSession = async (req, res, next) => {
  try {
    await Session.updateOne(
      { _id: req.params.id, user: req.user._id },
      { $set: { lastPingAt: new Date() } }
    );
    res.json({ ok: true });
  } catch (err) { next(err); }
};

exports.submitFeedback = async (req, res, next) => {
  try {
    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be 1 to 5' });
    }
    const f = await Feedback.create({
      user: req.user._id,
      rating,
      comment: req.body.comment || '',
    });
    res.status(201).json(f);
  } catch (err) { next(err); }
};

// ---- admin only ----
exports.stats = async (req, res, next) => {
  try {
    const weeks = 8;
    const since = new Date(Date.now() - weeks * 7 * 24 * 60 * 60 * 1000);

    const [totalUsers, totalProjects, projectsWithDesign, feedbackAgg, sessionAgg, usersByWeek] =
      await Promise.all([
        User.countDocuments(),
        Project.countDocuments(),
        Project.countDocuments({ 'selections.0': { $exists: true } }),
        Feedback.aggregate([{ $group: { _id: null, avg: { $avg: '$rating' }, n: { $sum: 1 } } }]),
        Session.aggregate([
          { $project: { ms: { $subtract: ['$lastPingAt', '$startedAt'] } } },
          { $group: { _id: null, avgMs: { $avg: '$ms' }, n: { $sum: 1 } } },
        ]),
        User.aggregate([
          { $match: { createdAt: { $gte: since } } },
          { $group: { _id: { $dateToString: { format: '%G-W%V', date: '$createdAt' } }, count: { $sum: 1 } } },
          { $sort: { _id: 1 } },
        ]),
      ]);

    res.json({
      totalUsers,
      imagesUploaded: totalProjects,
      designsSaved: projectsWithDesign,
      avgSessionMinutes: sessionAgg[0] ? +(sessionAgg[0].avgMs / 60000).toFixed(1) : 0,
      sessionCount: sessionAgg[0]?.n || 0,
      avgRating: feedbackAgg[0] ? +feedbackAgg[0].avg.toFixed(2) : 0,
      feedbackCount: feedbackAgg[0]?.n || 0,
      usersByWeek: usersByWeek.map((w) => ({ week: w._id, count: w.count })),
    });
  } catch (err) { next(err); }
};

exports.recentFeedback = async (req, res, next) => {
  try {
    const list = await Feedback.find().sort({ createdAt: -1 }).limit(10).populate('user', 'name');
    res.json(list);
  } catch (err) { next(err); }
};