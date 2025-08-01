import { NextResponse } from "next/server";
import { getVerifierKeyPair } from "../../../../lib/crypto";

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const { jwks } = await getVerifierKeyPair();

    // Return verifier metadata when client_id URL is accessed
    const verifierMetadata = {
      issuer: `${baseUrl}/api/verify/openid4vci`,
      jwks_uri: `${baseUrl}/api/verify/openid4vci/jwks`,
      authorization_endpoint: `${baseUrl}/api/verify/openid4vci/auth`,
      token_endpoint: `${baseUrl}/api/verify/openid4vci/token`,
      response_types_supported: ["id_token"],
      subject_types_supported: ["public"],
      id_token_signing_alg_values_supported: ["ES256"],
      scopes_supported: ["openid"],
      claims_supported: ["iss", "sub", "aud", "exp", "iat", "nonce"],
      grant_types_supported: ["authorization_code"],
      response_modes_supported: ["form_post"],
      // Include JWKS inline for immediate verification
      jwks: jwks,
    };

    return NextResponse.json(verifierMetadata, {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Error serving verifier metadata:", error);
    return NextResponse.json(
      { error: "Failed to serve verifier metadata" },
      { status: 500 }
    );
  }
}
