const Worker = require('../models/Worker');

// Get all workers
const getAllWorkers = async (req, res) => {
  try {
    const workers = await Worker.find().populate('project', 'name');
    res.status(200).json(workers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get active workers
const getActiveWorkers = async (req, res) => {
  try {
    const workers = await Worker.find({ active: true }).populate('project', 'name');
    res.status(200).json(workers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get workers by project
const getWorkersByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const workers = await Worker.find({ project: projectId }).populate('project', 'name');
    res.status(200).json(workers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a specific worker
const getWorkerById = async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id).populate('project', 'name');
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    res.status(200).json(worker);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new worker
const createWorker = async (req, res) => {
  try {
    const worker = new Worker(req.body);
    const newWorker = await worker.save();
    res.status(201).json(newWorker);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a worker
const updateWorker = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const worker = await Worker.findByIdAndUpdate(
      id, 
      updates, 
      { new: true, runValidators: true }
    ).populate('project', 'name');
    
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    
    res.status(200).json(worker);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a worker
const deleteWorker = async (req, res) => {
  try {
    const worker = await Worker.findByIdAndDelete(req.params.id);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    res.status(200).json({ message: 'Worker deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getAllWorkers,
  getWorkerById,
  createWorker,
  updateWorker,
  deleteWorker,
  getWorkersByProject,
  getActiveWorkers
};