import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getVerifiedCredentialsBySession } from "../../../../../lib/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Get verified credentials for the session
    const verifiedCredentials = await getVerifiedCredentialsBySession(
      sessionId
    );

    if (verifiedCredentials.length === 0) {
      return NextResponse.json(
        { error: "No verified credentials found for this session" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      sessionId,
      verifiedCredentials,
      count: verifiedCredentials.length,
    });
  } catch (error) {
    console.error("Error retrieving verified credentials:", error);
    return NextResponse.json(
      { error: "Failed to retrieve verified credentials" },
      { status: 500 }
    );
  }
}
