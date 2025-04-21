import { NextRequest, NextResponse } from "next/server";
import hypergraphConfig, { NetworkType, getActualApiEndpoint } from "~~/hypergraph.config";

// Simpler API route that proxies to The Graph API
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { spaceId, cid, network } = body;

    console.log("API route received request:", { spaceId, cid, network });

    if (!spaceId || !cid) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    // Get API endpoint from config
    const baseUrl = getActualApiEndpoint(network as NetworkType);

    const url = `${baseUrl}/space/${spaceId}/edit/calldata`;
    console.log("Proxying to:", url);
    console.log("Request body:", JSON.stringify({ cid, network }));

    // Forward to external API
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cid, network }),
      });

      console.log("External API response status:", response.status);
      console.log("External API response headers:", Object.fromEntries([...response.headers.entries()]));

      // Try to get the response text first to avoid JSON parsing errors
      const responseText = await response.text();
      console.log("External API response text:", responseText);

      // Try to parse as JSON if possible
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (parseError) {
        console.error("Failed to parse response as JSON:", parseError);
        responseData = { rawText: responseText };
      }

      if (!response.ok) {
        console.error("External API error:", {
          status: response.status,
          statusText: response.statusText,
          url,
          responseData,
        });
        return NextResponse.json(
          {
            error: "External API error",
            details: responseData,
            status: response.status,
            url,
          },
          { status: response.status },
        );
      }

      return NextResponse.json(responseData);
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      return NextResponse.json(
        {
          error: "Failed to connect to external API",
          message: fetchError instanceof Error ? fetchError.message : String(fetchError),
          url,
        },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("Error in API route:", error);
    return NextResponse.json(
      { error: "Server error", message: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
