const webauthnService = require("../services/webauthnService");
const User = require("../models/userModel");

// Step 1: Generate registration options
exports.generateRegistrationOptions = async (req, res) => {
  const { username } = req.body;

  // Check if the user already exists
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(400).json({ error: "User already exists" });
  }

  const options = webauthnService.generateRegistrationOptions(username);

  // Store challenge in the session or DB for later verification
  req.session.challenge = options.challenge;

  res.json(options);
};

// Step 2: Verify registration response and save user data
exports.registerUser = async (req, res) => {
  const { username, credential } = req.body;

  // Fetch the stored challenge from the session or database
  const challenge = req.session.challenge;

  if (!challenge) {
    return res.status(400).json({ error: "No challenge found" });
  }

  try {
    const verification = await webauthnService.verifyRegistration(
      credential,
      challenge
    );

    if (verification.verified) {
      // Save user to the database
      const newUser = new User({
        username,
        publicKey: verification.attestationObject.publicKey,
        credentialID: verification.attestationObject.credentialID,
        // Other WebAuthn fields
      });

      await newUser.save();

      return res.json({ message: "User registered successfully" });
    } else {
      return res.status(400).json({ error: "Registration failed" });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
