import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { randomBytes } from "crypto";
import {
  createChallenge,
  cleanupExpiredChallenges,
} from "../../../../lib/database";

export async function GET() {
  try {
    const challenge = uuidv4();
    const challengeId = uuidv4();
    const challengeExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store challenge in database
    await createChallenge(challengeId, challenge, challengeExpires);

    // Clean up expired challenges (background cleanup)
    cleanupExpiredChallenges().catch(console.error);

    // DCQL query for European digital identity
    const dcqlQuery = {
      credentials: [
        {
          claims: [
            {
              path: ["eu.europa.ec.eudi.pid.1", "family_name"],
            },
            {
              path: ["eu.europa.ec.eudi.pid.1", "birth_date"],
            },
            {
              path: ["eu.europa.ec.eudi.pid.1", "birth_place"],
            },
            {
              path: ["eu.europa.ec.eudi.pid.1", "given_name"],
            },
            {
              path: ["eu.europa.ec.eudi.pid.1", "age_over_18"],
            },
          ],
          format: "mso_mdoc",
          id: "cred1",
          meta: {
            doctype_value: "eu.europa.ec.eudi.pid.1",
          },
        },
      ],
    };

    // Return response in the format that matches OpenID4VP with state for verification simulation
    return NextResponse.json({
      protocol: "openid4vp",
      request: {
        dcql_query: dcqlQuery,
        nonce: challenge,
        response_mode: "dc_api",
        response_type: "vp_token",
      },
      state: {
        credential_type: "mso_mdoc",
        nonce: challenge,
        challenge_id: challengeId,
      },
    });
  } catch (error) {
    console.error("Error creating challenge:", error);
    return NextResponse.json(
      { error: "Failed to create challenge" },
      { status: 500 }
    );
  }
}
