const express = require('express');
const router = express.Router();
const { getUsersByOrganization } = require('../controllers/userController');
const { authenticateUser } = require('../middleware/authMiddleware'); // adjust path as needed

// Protected route: get all users from current user's organization
router.get('/organization/:projectId', authenticateUser, getUsersByOrganization);

module.exports = router;
