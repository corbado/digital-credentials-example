import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3001";

  const openidConfiguration = {
    // Core OpenID4VCI endpoints
    credential_issuer: baseUrl,
    credential_endpoint: `${baseUrl}/api/issue/credential`,
    authorization_endpoint: `${baseUrl}/api/issue/authorize`,
    token_endpoint: `${baseUrl}/api/issue/token`,

    // EUDI wallet specific configuration
    credential_configurations_supported: {
      "eu.europa.ec.eudi.pid.1": {
        format: "jwt_vc",
        doctype: "eu.europa.ec.eudi.pid.1",
        scope: "eu.europa.ec.eudi.pid.1",
        cryptographic_binding_methods_supported: ["jwk"],
        credential_signing_alg_values_supported: ["ES256", "ES384", "ES512"],
        proof_types_supported: {
          jwt: {
            proof_signing_alg_values_supported: ["ES256", "ES384", "ES512"],
          },
        },
        order: ["given_name", "family_name", "birth_date", "issuing_country"],
        claims: {
          given_name: {
            mandatory: true,
            value_type: "string",
            display: [
              {
                name: "Given Name",
                locale: "en-US",
              },
            ],
          },
          family_name: {
            mandatory: true,
            value_type: "string",
            display: [
              {
                name: "Family Name",
                locale: "en-US",
              },
            ],
          },
          birth_date: {
            mandatory: true,
            value_type: "string",
            display: [
              {
                name: "Date of Birth",
                locale: "en-US",
              },
            ],
          },
          issuing_country: {
            mandatory: true,
            value_type: "string",
            display: [
              {
                name: "Issuing Country",
                locale: "en-US",
              },
            ],
          },
        },
      },
    },

    // Grant types for EUDI wallet
    grant_types_supported: [
      "authorization_code",
      "urn:ietf:params:oauth:grant-type:pre-authorized_code",
    ],

    // Pre-authorization code configuration
    pre_authorized_grant_anonymous_access_supported: true,

    // PKCE support (required for mobile wallets)
    code_challenge_methods_supported: ["S256"],

    // Token endpoint authentication
    token_endpoint_auth_methods_supported: ["none"],

    // Response types
    response_types_supported: ["code"],
    response_modes_supported: ["query"],

    // Scopes for EUDI credentials
    scopes_supported: ["eu.europa.ec.eudi.pid.1"],

    // Display information
    display: [
      {
        name: "Corbado Issuer",
        locale: "en-US",
      },
    ],
  };

  return NextResponse.json(openidConfiguration, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
