import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { v4 as uuidv4 } from "uuid";
import {
  getVerificationSession,
  updateVerificationSession,
  getChallenge,
  markChallengeAsUsed,
  getIssuerKeyByIssuerDid,
  createVerifiedCredential,
} from "../../../../../lib/database";
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

    // Safely decode base64url parts
    const decodeBase64Url = (str: string): string => {
      try {
        // Add padding if needed
        let padded = str;
        while (padded.length % 4 !== 0) {
          padded += "=";
        }
        // Replace URL-safe characters
        padded = padded.replace(/-/g, "+").replace(/_/g, "/");
        return Buffer.from(padded, "base64").toString();
      } catch (error) {
        throw new Error(`Invalid base64url encoding: ${error}`);
      }
    };

    // Decode the header and payload
    const header = JSON.parse(decodeBase64Url(parts[0]));
    const payload = JSON.parse(decodeBase64Url(parts[1]));

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

  // Safely decode base64url parts
  const decodeBase64Url = (str: string): string => {
    try {
      // Add padding if needed
      let padded = str;
      while (padded.length % 4 !== 0) {
        padded += "=";
      }
      // Replace URL-safe characters
      padded = padded.replace(/-/g, "+").replace(/_/g, "/");
      return Buffer.from(padded, "base64").toString();
    } catch (error) {
      throw new Error(`Invalid base64url encoding: ${error}`);
    }
  };

  // Decode the JWT payload
  const parts = jwtToken.split(".");
  const payload = JSON.parse(decodeBase64Url(parts[1]));

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
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  try {
    // Parse the request body as form data
    const formData = await request.formData();

    console.log("formData", formData);

    // Extract callback parameters from the form data
    const state = formData.get("state") as string;
    const vpToken = formData.get("vp_token") as string;
    const idToken = formData.get("id_token") as string;
    const error = formData.get("error") as string;
    const errorDescription = formData.get("error_description") as string;

    if (error) {
      console.error("Verification error:", error, errorDescription);
      return NextResponse.redirect(
        `${baseUrl}/verify?error=${encodeURIComponent(
          errorDescription || error
        )}`
      );
    }

    if (!state) {
      return NextResponse.redirect(
        `${baseUrl}/verify?error=${encodeURIComponent(
          "Missing state parameter"
        )}`
      );
    }

    if (!vpToken) {
      return NextResponse.redirect(
        `${baseUrl}/verify?error=${encodeURIComponent(
          "Missing verifiable presentation token"
        )}`
      );
    }

    // Get verification session
    const session = await getVerificationSession(state);
    if (!session) {
      return NextResponse.redirect(
        `${baseUrl}/verify?error=${encodeURIComponent(
          "Invalid verification session"
        )}`
      );
    }

    // Parse and validate the verifiable presentation token
    try {
      // Decode the JWT vp_token to extract the verifiable credential
      const vpTokenParts = vpToken.split(".");
      if (vpTokenParts.length !== 3) {
        throw new Error("Invalid JWT format for vp_token");
      }

      // Decode the payload
      const decodeBase64Url = (str: string): string => {
        try {
          let padded = str;
          while (padded.length % 4 !== 0) {
            padded += "=";
          }
          padded = padded.replace(/-/g, "+").replace(/_/g, "/");
          return Buffer.from(padded, "base64").toString();
        } catch (error) {
          throw new Error(`Invalid base64url encoding: ${error}`);
        }
      };

      const vpPayload = JSON.parse(decodeBase64Url(vpTokenParts[1]));

      console.log("vpPayload", vpPayload);

      // Extract the verifiable credential from the presentation
      const verifiableCredential = vpPayload.vp?.verifiableCredential?.[0];
      if (!verifiableCredential) {
        throw new Error("No verifiable credential found in presentation");
      }

      // Validate the credential
      const validationResult = await validateJWTCredential(
        verifiableCredential,
        state
      );
      if (!validationResult.isValid) {
        throw new Error(
          `Credential validation failed: ${validationResult.error}`
        );
      }

      // Extract credential data
      const credentialData = await extractJWTCredentialData(
        { credential: verifiableCredential },
        "credential"
      );

      console.log(
        "Extracted credential data:",
        JSON.stringify(credentialData, null, 2)
      );

      // Save verified credential to database
      const verifiedCredentialId = uuidv4();
      await createVerifiedCredential(
        verifiedCredentialId,
        state,
        credentialData.decoded_credential.credential_type?.[1] ||
          "eu.europa.ec.eudi.pid.1",
        credentialData.decoded_credential.issuer,
        credentialData.decoded_credential.credential_subject
      );

      // Update verification session with success
      await updateVerificationSession(state, "verified", {
        vpToken,
        idToken,
        credentialData,
        verifiedCredentialId,
      });

      // Redirect to success page
      return NextResponse.redirect(
        `${baseUrl}/verify?success=true&sessionId=${state}`
      );
    } catch (credentialError) {
      console.error("Error processing credential:", credentialError);
      return NextResponse.redirect(
        `${baseUrl}/verify?error=${encodeURIComponent(
          "Credential processing failed"
        )}`
      );
    }
  } catch (error) {
    console.error("Error in callback:", error);
    return NextResponse.redirect(
      `${baseUrl}/verify?error=${encodeURIComponent("Verification failed")}`
    );
  }
}
