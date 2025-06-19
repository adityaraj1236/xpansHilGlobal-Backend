const express = require('express');
const router = express.Router();
const { 
  getAllWorkers,
  getWorkerById,
  createWorker,
  updateWorker,
  deleteWorker,
  getWorkersByProject,
  getActiveWorkers
} = require('../controllers/workerController');

// Get all workers
router.get('/', getAllWorkers);

// Get active workers
router.get('/active', getActiveWorkers);

// Get workers by project
router.get('/project/:projectId', getWorkersByProject);

// Get a specific worker
router.get('/:id', getWorkerById);

// Create a new worker
router.post('/', createWorker);

// Update a worker
router.put('/:id', updateWorker);

// Delete a worker
router.delete('/:id', deleteWorker);

module.exports = router;