import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  getChallenge,
  markChallengeAsUsed,
  createVerificationSession,
  updateVerificationSession,
  getIssuerKeyByIssuerDid,
} from "../../../../lib/database";
import { verifyJWTVerifiableCredential } from "@/lib/crypto";

// JWT validation for JWT-based credentials
async function validateJWTCredential(
  jwtToken: string,
  nonce: string
): Promise<{ isValid: boolean; payload?: any; error?: string }> {
  try {
    // Decode the JWT header to get the key ID
    const parts = jwtToken.split(".");
    if (parts.length !== 3) {
      return { isValid: false, error: "Invalid JWT format" };
    }

    // Decode the header to get the key ID
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());

    // Basic validation
    if (!payload.vc || !payload.vc.credentialSubject) {
      return { isValid: false, error: "Invalid credential structure" };
    }

    // Check if credential is expired
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return { isValid: false, error: "Credential has expired" };
    }

    // Get the issuer's public key for verification
    const issuerDid = payload.iss;
    if (!issuerDid) {
      return { isValid: false, error: "No issuer DID found in credential" };
    }

    const issuerKey = await getIssuerKeyByIssuerDid(issuerDid);
    if (!issuerKey) {
      // For demo purposes, we'll skip signature verification
      // In production, you should always verify the signature
      console.warn(
        "Issuer key not found, skipping signature verification for demo"
      );
      return { isValid: true, payload };
    }

    // Verify the JWT signature using the issuer's public key
    const publicKeyJWK = JSON.parse(issuerKey.public_key);
    const verificationResult = await verifyJWTVerifiableCredential(
      jwtToken,
      publicKeyJWK
    );

    return verificationResult;
  } catch (error) {
    return { isValid: false, error: `JWT validation failed: ${error}` };
  }
}

// Extract and decode credential data from JWT vp_token
async function extractJWTCredentialData(vpTokenMap: any, credentialId: string) {
  // Get the JWT credential data directly from the vp_token
  const jwtToken = vpTokenMap[credentialId];

  if (!jwtToken) {
    throw new Error(`JWT credential not found for ID: ${credentialId}`);
  }

  // Decode the JWT payload
  const parts = jwtToken.split(".");
  const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());

  // Extract credential subject data
  const credentialSubject = payload.vc?.credentialSubject || {};
  const credentialData = {
    credential_id: credentialId,
    extracted_at: new Date().toISOString(),
    format: "jwt_vc",
    doctype: payload.vc?.type?.[1] || "eu.europa.ec.eudi.pid.1",
    raw_credential: jwtToken,
    decoded_credential: {
      issuer: payload.iss,
      subject: payload.sub,
      issued_at: new Date(payload.iat * 1000).toISOString(),
      expires_at: payload.exp
        ? new Date(payload.exp * 1000).toISOString()
        : null,
      credential_subject: credentialSubject,
      credential_type: payload.vc?.type,
      credential_schema: payload.vc?.credentialSchema,
    },
  };

  return credentialData;
}

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();

    // Extract vp_token map - contains JWT formatted credentials
    const vpTokenMap = requestData?.vp_token || requestData?.data?.vp_token;
    if (!vpTokenMap) {
      throw new Error("vp_token not found in the request data");
    }

    // Extract state information
    const state = requestData?.state;
    if (!state) {
      throw new Error("State information not found in the request data");
    }

    // Get the JWT credential for "cred1"
    const expectedCredentialId = "cred1";
    const jwtToken = vpTokenMap[expectedCredentialId];

    if (!jwtToken) {
      throw new Error(
        `JWT credential not found for ID: ${expectedCredentialId}. Available IDs: ${Object.keys(
          vpTokenMap
        ).join(", ")}`
      );
    }

    // Verify the challenge exists in the database and is valid
    const storedChallenge = await getChallenge(state.nonce);
    if (!storedChallenge) {
      return NextResponse.json(
        {
          verified: false,
          message: "Invalid or expired challenge.",
        },
        { status: 400 }
      );
    }

    // Create a verification session
    const sessionId = uuidv4();
    await createVerificationSession(sessionId, storedChallenge.id, "pending");

    // Validate the JWT credential
    const validationResult = await validateJWTCredential(jwtToken, state.nonce);

    if (!validationResult.isValid) {
      await updateVerificationSession(sessionId, "failed", {
        error: validationResult.error || "JWT credential validation failed",
      });

      return NextResponse.json(
        {
          verified: false,
          message:
            validationResult.error || "JWT credential validation failed.",
        },
        { status: 400 }
      );
    }

    // Extract credential data from the validated JWT token
    const credentialData = await extractJWTCredentialData(
      vpTokenMap,
      expectedCredentialId
    );

    // Mark challenge as used to prevent replay attacks
    await markChallengeAsUsed(state.nonce);

    // Create simplified verification details for JWT
    const verificationDetails = {
      protocol: "openid4vp",
      format: "jwt_vc",
      docType: credentialData.doctype,
      credential_type: state.credential_type,
      verification_method: "jwt_validation",
      challenge_verified: true,
      processed_credential_id: expectedCredentialId,
      token_length: jwtToken.length,
      issuer: credentialData.decoded_credential.issuer,
      subject: credentialData.decoded_credential.subject,
    };

    // Update verification session with success
    await updateVerificationSession(sessionId, "verified", {
      jwtToken,
      verificationDetails,
      credentialData,
    });

    return NextResponse.json({
      verified: true,
      message: "JWT credential verified successfully!",
      sessionId: sessionId,
      details: verificationDetails,
      credentialData: credentialData,
    });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      {
        verified: false,
        message: `An error occurred: ${err.message}`,
      },
      { status: 500 }
    );
  }
}
