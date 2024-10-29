const base64url = require("base64url");
const {
  generateRegistrationOptions,
  verifyRegistrationResponse,
} = require("@simplewebauthn/server");
const User = require("../models/Users");

exports.startRegistration = async (req, res) => {
  const { username } = req.body;

  try {
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Generate WebAuthn registration options
    const options = await generateRegistrationOptions(
      {
        rpID: process.env.RP_ID || "localhost",
        rpName: "pwa",
        userName: username,
        timeout: 60000,
        attestationType: "indirect",
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

    // Respond with registration options
    res.status(200).json(options);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.verifyRegistration = async (req, res) => {
  const { body } = req;
  const username = req.session.username;

  try {
    const verification = await verifyRegistrationResponse({
      response: {
        id: body.id,
        rawId: body.rawId,
        type: body.type,
        response: {
          attestationObject: body.response.attestationObject,
          clientDataJSON: body.response.clientDataJSON,
        },
      },
      expectedChallenge: req.session.challenge,
      expectedOrigin: process.env.EXPECTED_ORIGIN || "http://localhost:5000",
      expectedRPID: process.env.RP_ID || "localhost",
    });

    if (!verification.verified) {
      return res.status(400).json({ message: "Registration failed" });
    }

    // Create a new user in the database
    const newUser = new User({
      username,
      credentialId: base64url.encode(
        verification.registrationInfo.credentialID
      ),
      publicKey: base64url.encode(
        verification.registrationInfo.credentialPublicKey
      ),
      counter: verification.registrationInfo.counter,
    });

    await newUser.save();
    res
      .status(201)
      .json({ status: "success", message: "Registration successful" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
