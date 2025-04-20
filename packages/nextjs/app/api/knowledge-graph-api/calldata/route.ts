import { NextRequest, NextResponse } from "next/server";
import hypergraphConfig, { NetworkType, getCalldataApiUrl, getDefaultSpaceId } from "~~/hypergraph.config";

/**
 * API route that proxies requests to The Graph API to avoid CORS issues
 * Based on the official documentation from https://github.com/graphprotocol/grc-20-ts
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { spaceId = getDefaultSpaceId(), cid, network = hypergraphConfig.defaultNetwork } = body;

    console.log("API route received request:", { spaceId, cid, network });

    if (!spaceId || !cid) {
      return NextResponse.json({ error: "Missing required parameters: spaceId and cid are required" }, { status: 400 });
    }

    // Ensure the CID has the ipfs:// prefix as required by the API
    const formattedCid = cid.startsWith("ipfs://") ? cid : `ipfs://${cid}`;

    // Get the API URL from config
    const apiUrl = getCalldataApiUrl(spaceId, network as NetworkType);

    console.log(`Proxying request to: ${apiUrl}`);
    console.log("Request body:", JSON.stringify({ cid: formattedCid, network }));

    // Forward the request to The Graph API following the exact structure from documentation
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          cid: formattedCid, // Make sure we're using the properly formatted CID with ipfs:// prefix
          network, // TESTNET or MAINNET
        }),
      });

      console.log("External API response status:", response.status);
      console.log("External API response headers:", Object.fromEntries([...response.headers.entries()]));

      // Try to get the response text first to avoid JSON parsing errors
      const responseText = await response.text();
      console.log("External API response text (first 200 chars):", responseText.substring(0, 200));

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

        // If this is a 404, it might be a different API path structure - log this possibility
        if (response.status === 404) {
          console.warn("API endpoint not found. Check if the path structure is correct for this API provider.");
        }

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
      if (responseData && responseData.to && responseData.data) {
        console.log("Successfully received calldata from API");
        return NextResponse.json(responseData);
      } else {
        console.error("API response doesn't contain expected fields:", responseData);
        return NextResponse.json(
          {
            error: "Invalid API response format",
            details: "Response doesn't contain expected 'to' and 'data' fields",
            receivedData: responseData,
          },
          { status: 502 },
        );
      }
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
