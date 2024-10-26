const base64url = require("base64url");
const {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");
const User = require("../models/Users");

exports.startAuthentication = async (req, res) => {
  try {
    const { username } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("User object:", user);

    // Generate authentication options with retrieved passkeys
    const options = await generateAuthenticationOptions({
      rpID: "localhost",
      rpName: "pwa",
      timeout: 6000,
      allowCredentials: [],
    });

    console.log("Generated options:", options); // Debugging line to check options

    // Store challenge in session
    req.session.username = username;
    req.session.challenge = options.challenge;

    res.status(200).json(options);
  } catch (error) {
    console.error("Error in startAuthentication:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// verifyAuthentication remains unchanged

exports.verifyAuthentication = async (req, res) => {
  try {
    const { body } = req;
    const username = req.session.username;
    const expectedChallenge = req.session.challenge;

    if (!username || !expectedChallenge) {
      return res
        .status(400)
        .json({ message: "Session expired. Please restart authentication." });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log(body);

    const credentialPublicKey = base64url.toBuffer(user.publicKey);

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

    console.log(verification);

    if (!verification.verified) {
      return res.status(400).json({ message: "Verification failed" });
    }

    if (!verification.authenticationInfo) {
      return res
        .status(400)
        .json({ message: "Authentication info is missing" });
    }

    user.counter = verification.authenticationInfo.newCounter;
    await user.save();

    res.status(200).json({ message: "Authentication successful" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
