import { NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";

// In a real application, you would store challenges to verify them later.
// For this example, we'll keep it simple and in-memory.
const challenges = new Map<string, Date>();

export async function GET() {
  const challenge = uuidv4();
  const challengeExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
  challenges.set(challenge, challengeExpires);

  // Clean up expired challenges (simple in-memory cleanup)
  const now = new Date();
  for (const [key, value] of challenges.entries()) {
    if (value < now) {
      challenges.delete(key);
    }
  }

  const presentationDefinition = {
    id: "12345678-90ab-cdef-1234-567890abcdef",
    input_descriptors: [
      {
        id: "user_has_driving_license",
        name: "Driving License",
        purpose: "We need to verify you have a driving license.",
        constraints: {
          fields: [
            {
              path: ["$.type"],
              filter: {
                type: "string",
                const: "VerifiableCredential",
              },
            },
            {
              path: ["$.credentialSubject.hasDrivingLicense"],
              purpose:
                'The credential must contain a "hasDrivingLicense" claim.',
            },
          ],
        },
      },
    ],
  };

  return NextResponse.json({
    challenge,
    presentationDefinition,
  });
}
