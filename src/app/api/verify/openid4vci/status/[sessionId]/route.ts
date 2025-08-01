import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getVerificationSession } from "../../../../../../lib/database";

export async function GET(
  request: NextRequest,
  context:
    | { params: { sessionId: string } }
    | { params: Promise<{ sessionId: string }> }
) {
  try {
    // Support both sync and async params (Next.js 14+)
    let sessionId: string;
    if (typeof (context.params as any).then === "function") {
      // params is a Promise
      ({ sessionId } = await (context.params as Promise<{
        sessionId: string;
      }>));
    } else {
      // params is an object
      ({ sessionId } = context.params as { sessionId: string });
    }

    // Get verification session
    const session = await getVerificationSession(sessionId);
    if (!session) {
      return NextResponse.json(
        { error: "Verification session not found" },
        { status: 404 }
      );
    }

    // Return session status and data
    return NextResponse.json({
      sessionId,
      status: session.status,
      credentialData: session.presentation_data,
      error: session.error,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
    });
  } catch (error) {
    console.error("Error getting verification status:", error);
    return NextResponse.json(
      { error: "Failed to get verification status" },
      { status: 500 }
    );
  }
}
