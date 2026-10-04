const Project = require('../models/Project');
const cloudinary = require('../config/cloudinary');

function uploadBuffer(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'wallcanva/rooms', resource_type: 'image' },
      (err, result) => (err ? reject(err) : resolve(result))
    );
    stream.end(buffer);
  });
}

// only the owner may touch a project
async function findOwned(id, userId) {
  const project = await Project.findById(id);
  if (!project || String(project.owner) !== String(userId)) return null;
  return project;
}

exports.upload = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Image file is required' });

    const result = await uploadBuffer(req.file.buffer);
    const project = await Project.create({
      owner: req.user._id,
      title: req.body.title || 'Untitled design',
      originalImageUrl: result.secure_url,
      imagePublicId: result.public_id,
    });
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
};

exports.list = async (req, res, next) => {
  try {
    const projects = await Project.find({ owner: req.user._id }).sort({ updatedAt: -1 });
    res.json(projects);
  } catch (err) {
    next(err);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const project = await findOwned(req.params.id, req.user._id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const project = await findOwned(req.params.id, req.user._id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (req.body.title !== undefined) project.title = req.body.title;
    if (req.body.selections !== undefined) project.selections = req.body.selections;
    await project.save();
    res.json(project);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const project = await findOwned(req.params.id, req.user._id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    await cloudinary.uploader.destroy(project.imagePublicId);
    await project.deleteOne();
    res.json({ message: 'Project deleted' });
  } catch (err) {
    next(err);
  }
};