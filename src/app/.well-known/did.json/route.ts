import { NextResponse } from "next/server";
import { getActiveIssuerKey } from "../../../lib/database";
import { generateIssuerDid } from "../../../lib/crypto";

export async function GET() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Get the active issuer key from the database
    const issuerKey = await getActiveIssuerKey();

    if (!issuerKey) {
      return NextResponse.json(
        { error: "No active issuer key found" },
        { status: 404 }
      );
    }

    // Parse the public key JWK
    const publicKeyJWK = JSON.parse(issuerKey.public_key);

    // Create the DID document
    const didId = generateIssuerDid();
    const didDocument = {
      "@context": [
        "https://www.w3.org/ns/did/v1",
        "https://w3id.org/security/suites/jws-2020/v1",
      ],
      id: didId,
      controller: didId,
      verificationMethod: [
        {
          id: `${didId}#${issuerKey.key_id}`,
          type: "JsonWebKey2020",
          controller: didId,
          publicKeyJwk: publicKeyJWK,
        },
      ],
      authentication: [`${didId}#${issuerKey.key_id}`],
      assertionMethod: [`${didId}#${issuerKey.key_id}`],
      keyAgreement: [],
      capabilityInvocation: [],
      capabilityDelegation: [],
      service: [
        {
          id: `${didId}#openid-credential-issuer`,
          type: "OpenIDCredentialIssuer",
          serviceEndpoint: `${baseUrl}/.well-known/openid-credential-issuer`,
        },
      ],
    };

    return NextResponse.json(didDocument, {
      headers: {
        "Content-Type": "application/did+json",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
  } catch (error) {
    console.error("Error generating DID document:", error);
    return NextResponse.json(
      { error: "Failed to generate DID document" },
      { status: 500 }
    );
  }
}
