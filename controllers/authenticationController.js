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

    req.session.username = username;
    req.session.challenge = options.challenge;

    res.status(200).json(options);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

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
