const base64url = require("base64url");
const {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");
const User = require("../models/Users");

// Authentication request (step 3)
exports.startAuthentication = async (req, res) => {
  try {
    const { username } = req.body;

    // Retrieve user from the database
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate authentication options
    const options = await generateAuthenticationOptions(
      {
        rpID: process.env.RP_ID || "localhost",
        rpName: "pwa",
        userName: username,
        timeout: 60000,
        attestationType: "indirect",
      },
      {
        allowCredentials: [],
        userVerification: "preferred",
      },
      {
        authenticatorSelection: {
          residentKey: "required",
          userVerification: "preferred",
        },
      }
    );

    // Store the challenge and username in session
    req.session.username = username;
    req.session.challenge = options.challenge;

    // Send authentication options in response
    res.status(200).json(options);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Verify authentication response (step 4)
exports.verifyAuthentication = async (req, res) => {
  try {
    const { body } = req;
    const username = req.session.username;
    const expectedChallenge = req.session.challenge;

    // Check for valid session data
    if (!username || !expectedChallenge) {
      return res
        .status(400)
        .json({ message: "Session expired. Please restart authentication." });
    }

    // Retrieve user from the database
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Decode publicKey from Base64url to Uint8Array
    const credentialPublicKey = base64url.toBuffer(user.publicKey);

    // Verify the authentication response
    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: expectedChallenge,
      expectedOrigin: process.env.EXPECTED_ORIGIN || "http://localhost:5000",
      expectedRPID: process.env.RP_ID || "localhost",
      authenticator: {
        credentialID: user.credentialId,
        credentialPublicKey,
        counter: user.counter,
      },
    });

    // Check if the verification was successful
    if (!verification.verified) {
      return res.status(400).json({ message: "Verification failed" });
    }

    // Check if authenticationInfo is defined
    if (!verification.authenticationInfo) {
      return res
        .status(400)
        .json({ message: "Authentication info is missing" });
    }

    // Update the user's counter based on the newCounter value
    user.counter = verification.authenticationInfo.newCounter;
    await user.save();

    // Respond with success message
    res.status(200).json({ message: "Authentication successful" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
