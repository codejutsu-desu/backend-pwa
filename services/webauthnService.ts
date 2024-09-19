const webauthn = require("webauthn-server");

// Generate WebAuthn registration options
exports.generateRegistrationOptions = (username) => {
  const options = webauthn.generateRegistrationOptions({
    challenge: webauthn.generateChallenge(),
    userID: username, // Use username as userID
    userName: username, // Display name
    attestationType: "indirect", // Can be 'direct', 'indirect', or 'none'
    authenticatorSelection: {
      userVerification: "preferred", // Could be 'required', 'preferred', or 'discouraged'
    },
  });
  return options;
};

// Verify the registration response
exports.verifyRegistration = async (credential, challenge) => {
  try {
    const result = await webauthn.verifyAttestationResponse({
      credential,
      expectedChallenge: challenge,
      expectedOrigin: "https://your-app-domain.com", // Replace with your actual origin
      expectedRPID: "your-app-domain.com", // Replace with your actual RPID
    });

    if (result.verified) {
      return { verified: true, attestationObject: result.attestationObject };
    }

    return { verified: false };
  } catch (error) {
    throw new Error("Failed to verify registration: " + error.message);
  }
};
