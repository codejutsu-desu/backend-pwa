const {
  generateRegistrationOptions,
  registerUser,
} = require("../controllers/authController");

const router = express.Router();

// Step 1: Generate WebAuthn registration options
router.post("/register/options", generateRegistrationOptions);

// Step 2: Register the user with WebAuthn credentials
router.post("/register", registerUser);

module.exports = router;
