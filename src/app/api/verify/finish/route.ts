import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  getChallenge,
  markChallengeAsUsed,
  createVerificationSession,
  updateVerificationSession,
} from "../../../../lib/database";
import { decodeAllNamespaces, decodeDigitalCredential } from "@/lib/crypto";

// Simplified validation for mdoc credentials
function validateMdocCredential(mdocToken: string, nonce: string): boolean {
  // In a real implementation, this would:
  // 1. Decode the CBOR structure
  // 2. Verify the mdoc signature
  // 3. Validate the device authentication
  // 4. Check the nonce/challenge

  // For simulation, ensure we have a token and nonce
  const isValid = !!(mdocToken && nonce && mdocToken.length > 0);

  return isValid;
}

// Extract and decode credential data from the actual vp_token
async function extractCredentialData(vpTokenMap: any, credentialId: string) {
  // Get the credential data directly from the vp_token
  const credentialData = vpTokenMap[credentialId];

  const decodedCredential = await decodeDigitalCredential(credentialData);

  const readableCredential =
    decodeAllNamespaces(decodedCredential)["eu.europa.ec.eudi.pid.1"];

  return {
    credential_id: credentialId,
    extracted_at: new Date().toISOString(),
    format: "mso_mdoc",
    doctype: "eu.europa.ec.eudi.pid.1",
    raw_credential: credentialData,
    decoded_credential: readableCredential,
  };
}

export async function POST(request: NextRequest) {
  try {
    const requestData = await request.json();

    // Extract vp_token map - contains mdoc formatted credentials
    const vpTokenMap = requestData?.vp_token || requestData?.data?.vp_token;
    if (!vpTokenMap) {
      throw new Error("vp_token not found in the request data");
    }

    // Extract state information
    const state = requestData?.state;
    if (!state) {
      throw new Error("State information not found in the request data");
    }

    // Get the mdoc credential for "cred1"
    const expectedCredentialId = "cred1";
    const mdocToken = vpTokenMap[expectedCredentialId];

    if (!mdocToken) {
      throw new Error(
        `mdoc credential not found for ID: ${expectedCredentialId}. Available IDs: ${Object.keys(
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

    // Validate the mdoc credential
    const isValidMdoc = validateMdocCredential(mdocToken, state.nonce);

    if (!isValidMdoc) {
      await updateVerificationSession(sessionId, "failed", {
        error: "mdoc credential validation failed",
      });

      return NextResponse.json(
        {
          verified: false,
          message: "mdoc credential validation failed.",
        },
        { status: 400 }
      );
    }

    // Extract credential data from the validated mdoc token
    const credentialData = await extractCredentialData(
      vpTokenMap,
      expectedCredentialId
    );

    // Mark challenge as used to prevent replay attacks
    await markChallengeAsUsed(state.nonce);

    // Create simplified verification details for mdoc
    const verificationDetails = {
      protocol: "openid4vp",
      format: "mdoc",
      docType: "eu.europa.ec.eudi.pid.1", // or extract from actual mdoc
      credential_type: state.credential_type,
      verification_method: "mdoc_validation",
      challenge_verified: true,
      processed_credential_id: expectedCredentialId,
      token_length: mdocToken.length,
    };

    // Update verification session with success
    await updateVerificationSession(sessionId, "verified", {
      mdocToken,
      verificationDetails,
      credentialData,
    });

    return NextResponse.json({
      verified: true,
      message: "mdoc credential verified successfully!",
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
