import { NextRequest, NextResponse } from "next/server";

/**
 * API route that proxies requests to The Graph API to avoid CORS issues
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { spaceId, cid, network } = body;

    if (!spaceId || !cid) {
      return NextResponse.json({ error: "Missing required parameters: spaceId and cid are required" }, { status: 400 });
    }

    // Determine the correct API endpoint based on network
    const baseUrl = network === "TESTNET" ? "https://api-testnet.grc-20.thegraph.com" : "https://api.thegraph.com";

    const apiUrl = `${baseUrl}/space/${spaceId}/edit/calldata`;
    console.log(`Proxying request to: ${apiUrl}`);

    // Forward the request to The Graph API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cid,
        network,
      }),
    });

    // Get the response data
    const responseData = await response.json().catch(() => null);
    const responseStatus = response.status;

    // If we received an error response, log it and return it
    if (!response.ok) {
      console.error("Error response from The Graph API:", {
        status: response.status,
        statusText: response.statusText,
        data: responseData,
      });

      return NextResponse.json(
        { error: "Error from The Graph API", details: responseData },
        { status: responseStatus },
      );
    }

    // Return the successful response
    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error in calldata API route:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
