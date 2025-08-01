import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getVerificationSession } from "../../../../../../lib/database";
import { SignJWT } from "jose";
import { getVerifierKeyPair } from "../../../../../../lib/crypto";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    // Get verification session
    const session = await getVerificationSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: "Verification session not found" },
        { status: 404 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Use HTTPS URL as client_id (some wallets prefer this over DID)
    const verifierClientId = `${baseUrl}/api/verify/openid4vci`;

    // Get the consistent key pair for signing the request object
    const { keyPair } = await getVerifierKeyPair();

    // Create SIOPv2 request object
    const requestObject = {
      client_id: "https://ec51beb176a4.ngrok-free.app",
      iss: "https://ec51beb176a4.ngrok-free.app",
      aud: "did:web:ec51beb176a4.ngrok-free.app:testing", // SIOPv2 audience should be the verifier's domain
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 300, // 5 minutes
      nonce: session.challenge_id,
      response_type: "id_token",
      scope: "openid",
      // SIOPv2 version indicators
      version: "2.0",
      siop_version: "2.0",
      state: sessionId,
      // SIOPv2 + OpenID4VP specific fields
      response_mode: "form_post",
      response_uri: `${baseUrl}/api/verify/openid4vci/callback`,
      vp_token: {
        presentation_definition: {
          id: "pid-verification",
          input_descriptors: [
            {
              id: "pid-credential",
              name: "EU Digital Identity (PID)",
              purpose: "We need to verify your EU Digital Identity credential",
              constraints: {
                fields: [
                  {
                    path: ["$.vc.credentialSubject.givenName"],
                    filter: {
                      type: "string",
                      pattern: ".*",
                    },
                  },
                  {
                    path: ["$.vc.credentialSubject.familyName"],
                    filter: {
                      type: "string",
                      pattern: ".*",
                    },
                  },
                  {
                    path: ["$.vc.credentialSubject.birthDate"],
                    filter: {
                      type: "string",
                      pattern: "\\d{4}-\\d{2}-\\d{2}",
                    },
                  },
                  {
                    path: ["$.vc.credentialSubject.ageOver18"],
                    filter: {
                      type: "string",
                      pattern: ".*",
                    },
                  },
                  {
                    path: ["$.vc.credentialSubject.ageOver21"],
                    filter: {
                      type: "string",
                      pattern: ".*",
                    },
                  },
                  {
                    path: ["$.vc.credentialSubject.documentNumber"],
                    filter: {
                      type: "string",
                      pattern: ".*",
                    },
                  },
                  {
                    path: ["$.vc.credentialSubject.issuingCountry"],
                    filter: {
                      type: "string",
                      pattern: ".*",
                    },
                  },
                  {
                    path: ["$.vc.credentialSubject.issuingAuthority"],
                    filter: {
                      type: "string",
                      pattern: ".*",
                    },
                  },
                  {
                    path: ["$.vc.credentialSubject.issueDate"],
                    filter: {
                      type: "string",
                      pattern: "\\d{4}-\\d{2}-\\d{2}",
                    },
                  },
                  {
                    path: ["$.vc.credentialSubject.expiryDate"],
                    filter: {
                      type: "string",
                      pattern: "\\d{4}-\\d{2}-\\d{2}",
                    },
                  },
                ],
              },
              format: {
                jwt_vc: {
                  alg: ["ES256", "ES384", "ES512", "RS256", "RS384", "RS512"],
                },
                jwt_vp: {
                  alg: ["ES256", "ES384", "ES512", "RS256", "RS384", "RS512"],
                },
                jwt: {
                  alg: ["ES256", "ES384", "ES512", "RS256", "RS384", "RS512"],
                },
                "vc+sd-jwt": {},
              },
            },
          ],
        },
      },
      registration: {
        jwks_uri: `${baseUrl}/api/verify/openid4vci/jwks`,
        client_name: "Digital Credentials Verifier",
        client_uri: baseUrl,
        logo_uri: `${baseUrl}/logo.png`,
        vp_formats: {
          jwt_vc: {
            alg: ["ES256", "ES384", "ES512", "RS256", "RS384", "RS512"],
          },
          jwt_vp: {
            alg: ["ES256", "ES384", "ES512", "RS256", "RS384", "RS512"],
          },
          jwt: {
            alg: ["ES256", "ES384", "ES512", "RS256", "RS384", "RS512"],
          },
        },
      },
    };

    console.log("SIOPv2 requestObject", requestObject);

    // Get public key JWK for embedding in header
    const { jwks } = await getVerifierKeyPair();
    const publicKeyJWK = jwks.keys[0];

    // Sign the request object as a JWT with embedded JWK in header
    const signedRequestObject = await new SignJWT(requestObject)
      .setProtectedHeader({
        alg: "ES256",
        typ: "JWT",
        kid: "did:web:ec51beb176a4.ngrok-free.app#verifier-key-1", // Include the key ID so wallet can resolve the key
        jwk: publicKeyJWK, // Embed the public key directly in the JWT header
      })
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(keyPair.privateKey);

    return new NextResponse(signedRequestObject, {
      headers: {
        "Content-Type": "text/plain",
      },
    });
  } catch (error) {
    console.error("Error serving SIOPv2 request object:", error);
    return NextResponse.json(
      { error: "Failed to serve SIOPv2 request object" },
      { status: 500 }
    );
  }
}
