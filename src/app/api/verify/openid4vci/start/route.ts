import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { randomBytes } from "crypto";
import {
  createChallenge,
  cleanupExpiredChallenges,
  createVerificationSession,
} from "../../../../../lib/database";

export async function POST() {
  try {
    const sessionId = uuidv4();
    const challenge = uuidv4();
    const challengeId = uuidv4();
    const challengeExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store challenge in database
    await createChallenge(challengeId, challenge, challengeExpires);

    // Create verification session
    await createVerificationSession(sessionId, challengeId, "pending");

    // Clean up expired challenges (background cleanup)
    cleanupExpiredChallenges().catch(console.error);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Create OpenID4VP verification request
    const verifierClientId = `${baseUrl}/api/verify/openid4vci`;
    const verificationRequest = {
      client_id: verifierClientId,
      redirect_uri: `${baseUrl}/api/verify/openid4vci/callback`,
      response_type: "id_token",
      scope: "openid",
      state: sessionId,
      nonce: challenge,
      request_uri: `${baseUrl}/api/verify/openid4vci/request/${sessionId}`,
    };

    // Create verification URL with SIOPv2 + OpenID4VP parameters
    const verificationUrl = new URL("/verify/auth", baseUrl);
    verificationUrl.searchParams.set(
      "client_id",
      verificationRequest.client_id
    );
    verificationUrl.searchParams.set(
      "response_uri",
      verificationRequest.redirect_uri
    );
    verificationUrl.searchParams.set(
      "request_uri",
      verificationRequest.request_uri
    );

    return NextResponse.json({
      sessionId,
      verificationUrl: verificationUrl.toString(),
      challenge,
      expiresAt: challengeExpires.toISOString(),
    });
  } catch (error) {
    console.error("Error creating verification session:", error);
    return NextResponse.json(
      { error: "Failed to create verification session" },
      { status: 500 }
    );
  }
}
