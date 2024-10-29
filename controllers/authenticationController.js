const base64url = require("base64url");
const {
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} = require("@simplewebauthn/server");
const User = require("../models/Users");

exports.startAuthentication = async (req, res) => {
  try {
    // Generate authentication options
    const options = await generateAuthenticationOptions({
      rpID: process.env.RP_ID || "localhost",
      rpName: "pwa",
      timeout: 60000,
      allowCredentials: [], // Optionally populate this if you want to restrict to certain credentials
    });

    // Store challenge in session for later verification
    req.session.challenge = options.challenge;

    res.status(200).json(options);
  } catch (error) {
    console.error("Error in startAuthentication:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.verifyAuthentication = async (req, res) => {
  try {
    const { body } = req;
    const expectedChallenge = req.session.challenge;

    if (!expectedChallenge) {
      return res
        .status(400)
        .json({ message: "Session expired. Please restart authentication." });
    }

    // Convert rawId to the same format used for storage
    const encodedRawId = base64url.encode(body.rawId);

    // Find user by credentialId
    const user = await User.findOne({ credentialId: encodedRawId });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const credentialPublicKey = base64url.toBuffer(user.publicKey);

    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: expectedChallenge,
      expectedOrigin: process.env.EXPECTED_ORIGIN || "http://localhost:5000",
      expectedRPID: process.env.RP_ID || "localhost",
      authenticator: {
        credentialID: base64url.toBuffer(user.credentialId),
        credentialPublicKey,
        counter: user.counter,
      },
    });

    if (!verification.verified) {
      return res.status(400).json({ message: "Verification failed" });
    }

    if (!verification.authenticationInfo) {
      return res
        .status(400)
        .json({ message: "Authentication info is missing" });
    }

    // Update counter
    user.counter = verification.authenticationInfo.newCounter;
    await user.save();

    res.status(200).json({ message: "Authentication successful" });
  } catch (error) {
    console.error("Error in verifyAuthentication:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
