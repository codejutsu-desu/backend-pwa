// authRoutes.js

const express = require("express");
const router = express.Router();
const registrationController = require("../controllers/registrationController");
const authenticationController = require("../controllers/authenticationController");

// Registration routes
router.post("/register/start", registrationController.startRegistration);
router.post("/register/verify", registrationController.verifyRegistration);

// Authentication routes
router.post("/login/start", authenticationController.startAuthentication);
router.post("/login/verify", authenticationController.verifyAuthentication);

module.exports = router;
