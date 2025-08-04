import { NextResponse } from "next/server";
import { NextRequest } from "next/server";
import { getVerifiedCredential } from "../../../../../../lib/database";

export async function GET(
  request: NextRequest,
  { params }: { params: { credentialId: string } }
) {
  try {
    const { credentialId } = params;

    if (!credentialId) {
      return NextResponse.json(
        { error: "Credential ID is required" },
        { status: 400 }
      );
    }

    // Get verified credential by ID
    const verifiedCredential = await getVerifiedCredential(credentialId);

    if (!verifiedCredential) {
      return NextResponse.json(
        { error: "Verified credential not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      verifiedCredential,
    });
  } catch (error) {
    console.error("Error retrieving verified credential:", error);
    return NextResponse.json(
      { error: "Failed to retrieve verified credential" },
      { status: 500 }
    );
  }
}
