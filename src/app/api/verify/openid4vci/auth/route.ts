import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    // Extract OpenID4VCI parameters
    const clientId = searchParams.get("client_id");
    const responseUri = searchParams.get("response_uri");
    const requestUri = searchParams.get("request_uri");

    // Validate required parameters
    if (!clientId || !responseUri || !requestUri) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    console.log("clientId", clientId);
    console.log("responseUri", responseUri);
    console.log("requestUri", requestUri);

    // Return the verification data as JSON
    // The frontend will handle the UI rendering
    return NextResponse.json({
      clientId,
      responseUri,
      requestUri,
      verificationUrl: request.url,
      walletLinks: {
        // Standard OpenID4VP presentation request deep link
        openid4vci: `openid4vp://?client_id=${encodeURIComponent(
          clientId
        )}&response_uri=${encodeURIComponent(
          responseUri
        )}&request_uri=${encodeURIComponent(requestUri || "")}`,
      },
    });
  } catch (error) {
    console.error("Error in auth endpoint:", error);
    return NextResponse.json(
      { error: "Authorization failed" },
      { status: 500 }
    );
  }
}
