import { NextResponse } from "next/server";
import { getVerifierKeyPair } from "../../../../../lib/crypto";

export async function GET() {
  try {
    const { jwks } = await getVerifierKeyPair();
    return NextResponse.json(jwks);
  } catch (error) {
    console.error("Error serving JWKS:", error);
    return NextResponse.json(
      { error: "Failed to serve JWKS" },
      { status: 500 }
    );
  }
}
