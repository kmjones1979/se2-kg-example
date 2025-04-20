import { NextRequest, NextResponse } from "next/server";

/**
 * API route that proxies requests to The Graph API to avoid CORS issues
 * Based on the official documentation from https://github.com/graphprotocol/grc-20-ts
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { spaceId, cid, network = "MAINNET" } = body;

    console.log("API route received request:", { spaceId, cid, network });

    if (!spaceId || !cid) {
      return NextResponse.json({ error: "Missing required parameters: spaceId and cid are required" }, { status: 400 });
    }

    // Try a different endpoint structure - option #3 from our test list
    // Using api.grc-20.thegraph.com pattern
    const baseUrl =
      network === "TESTNET" ? "https://api-testnet.grc-20.thegraph.com" : "https://api.grc-20.thegraph.com"; // Updated domain structure

    const apiUrl = `${baseUrl}/space/${spaceId}/edit/calldata`;

    console.log(`Proxying request to: ${apiUrl}`);
    console.log("Request body:", JSON.stringify({ cid, network }));

    // Forward the request to The Graph API following the exact structure from documentation
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cid, // This should be prefixed with ipfs:// according to docs
          network, // TESTNET or MAINNET
        }),
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

      // If we received an error response, log it and return it
      if (!response.ok) {
        console.error("Error response from The Graph API:", {
          status: response.status,
          statusText: response.statusText,
          data: responseData,
          url: apiUrl,
        });

        return NextResponse.json(
          {
            error: "Error from The Graph API",
            details: responseData,
            status: response.status,
            url: apiUrl,
          },
          { status: response.status },
        );
      }

      // Return the successful response containing to and data fields
      // Expected response format: { to: "0x...", data: "0x..." }
      return NextResponse.json(responseData);
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      return NextResponse.json(
        {
          error: "Failed to connect to external API",
          message: fetchError instanceof Error ? fetchError.message : String(fetchError),
          url: apiUrl,
        },
        { status: 502 },
      );
    }
  } catch (error) {
    console.error("Error in calldata API route:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
