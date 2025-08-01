import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getActiveIssuerKey } from "../../../lib/database";
import { generateIssuerDid, getVerifierKeyPair } from "../../../lib/crypto";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get("service");
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
    const hostname = new URL(baseUrl).hostname;

    // If requesting verifier DID, return verifier DID document
    if (service === "verifier") {
      const verifierDid = `did:web:${hostname}:verifier`;
      const { jwks } = await getVerifierKeyPair();
      const publicKeyJWK = jwks.keys[0];

      const didDocument = {
        "@context": [
          "https://www.w3.org/ns/did/v1",
          "https://w3id.org/security/suites/jws-2020/v1",
        ],
        id: verifierDid,
        controller: verifierDid,
        verificationMethod: [
          {
            id: `${verifierDid}#verifier-key-1`,
            type: "JsonWebKey2020",
            controller: verifierDid,
            publicKeyJwk: publicKeyJWK,
          },
        ],
        authentication: [`${verifierDid}#verifier-key-1`],
        assertionMethod: [`${verifierDid}#verifier-key-1`],
        service: [
          {
            id: `${verifierDid}#verifier-service`,
            type: "VerifierService",
            serviceEndpoint: `${baseUrl}/api/verify`,
          },
        ],
      };

      return NextResponse.json(didDocument, {
        headers: {
          "Content-Type": "application/did+json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Default: return issuer DID document
    const issuerKey = await getActiveIssuerKey();

    if (!issuerKey) {
      return NextResponse.json(
        { error: "No active issuer key found" },
        { status: 404 }
      );
    }

    // Parse the public key JWK
    const publicKeyJWK = JSON.parse(issuerKey.public_key);

    // Create the issuer DID document
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
