import { NextResponse } from "next/server";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const issuerMetadata = {
    issuer: baseUrl,
    authorization_servers: [baseUrl],
    credential_issuer: baseUrl,
    credential_endpoint: `${baseUrl}/api/issue/credential`,
    token_endpoint: `${baseUrl}/api/issue/token`,
    authorization_endpoint: `${baseUrl}/api/issue/authorize`,

    // Support for transaction codes (PIN)
    pre_authorized_grant_anonymous_access_supported: true,

    display: [
      {
        name: "Corbado Credentials Issuer",
        locale: "en-US",
      },
    ],
    credential_configurations_supported: {
      "eu.europa.ec.eudi.pid.1": {
        format: "jwt_vc",
        doctype: "eu.europa.ec.eudi.pid.1",
        scope: "eu.europa.ec.eudi.pid.1",
        cryptographic_binding_methods_supported: ["jwk", "did"],
        credential_signing_alg_values_supported: ["ES256"],
        proof_types_supported: {
          jwt: {
            proof_signing_alg_values_supported: ["ES256", "ES384", "ES512"],
          },
          did: {
            proof_signing_alg_values_supported: ["ES256", "ES384", "ES512"],
          },
        },

        // PIN/Transaction code support for this credential type
        order: ["given_name", "family_name", "birth_date", "issuing_country"],

        display: [
          {
            name: "Corbado Credential Issuer",
            locale: "en-US",
            logo: {
              uri: `${baseUrl}/logo.png`,
              alt_text: "EU Digital Identity",
            },
            background_color: "#003399",
            text_color: "#FFFFFF",
          },
        ],
        claims: {
          "eu.europa.ec.eudi.pid.1": {
            given_name: {
              mandatory: true,
              display: [
                {
                  name: "Given Name",
                  locale: "en-US",
                },
              ],
            },
            family_name: {
              mandatory: true,
              display: [
                {
                  name: "Family Name",
                  locale: "en-US",
                },
              ],
            },
            birth_date: {
              mandatory: true,
              display: [
                {
                  name: "Date of Birth",
                  locale: "en-US",
                },
              ],
            },
            age_over_18: {
              mandatory: false,
              display: [
                {
                  name: "Over 18",
                  locale: "en-US",
                },
              ],
            },
            document_number: {
              mandatory: false,
              display: [
                {
                  name: "Document Number",
                  locale: "en-US",
                },
              ],
            },
            expiry_date: {
              mandatory: false,
              display: [
                {
                  name: "Expiry Date",
                  locale: "en-US",
                },
              ],
            },
            issuing_country: {
              mandatory: false,
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
    },
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
    grant_types_supported: [
      "authorization_code",
      "urn:ietf:params:oauth:grant-type:pre-authorized_code",
    ],
  };

  return NextResponse.json(issuerMetadata, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}
