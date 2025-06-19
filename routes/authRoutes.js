const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Invite = require('../models/Invite');

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout); // ✅ Added logout route

//set Password route
router.post('/set-password', authController.setpassword);

module.exports = router;
