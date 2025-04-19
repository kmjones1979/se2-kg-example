import { NextRequest, NextResponse } from "next/server";

// Simpler API route that proxies to The Graph API
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { spaceId, cid, network } = body;

    console.log("API route received request:", { spaceId, cid, network });

    if (!spaceId || !cid) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Determine API endpoint
    const baseUrl = network === "TESTNET" ? "https://api-testnet.grc-20.thegraph.com" : "https://api.thegraph.com";

    const url = `${baseUrl}/space/${spaceId}/edit/calldata`;
    console.log("Proxying to:", url);

    // Forward to external API
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cid, network }),
    });

    const responseData = await response.json().catch(() => null);

    if (!response.ok) {
      console.error("External API error:", responseData);
      return NextResponse.json({ error: "External API error", details: responseData }, { status: response.status });
    }

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { error: "Server error", message: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
