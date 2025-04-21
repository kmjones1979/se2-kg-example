import { NextRequest, NextResponse } from "next/server";
import hypergraphConfig, {
  NetworkType,
  getActualApiEndpoint,
  getCalldataApiUrl,
  getDefaultSpaceId,
} from "~~/hypergraph.config";

/**
 * API route for fetching call data from The Graph's Knowledge Graph API
 * This proxy helps avoid CORS issues and normalizes the response format
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { spaceId, cid, network = "MAINNET" } = body;

    // Validate required fields
    if (!spaceId) {
      return NextResponse.json({ error: "Space ID is required" }, { status: 400 });
    }

    if (!cid) {
      return NextResponse.json({ error: "IPFS CID is required" }, { status: 400 });
    }

    // Format CID correctly if not already prefixed
    const formattedCid = cid.startsWith("ipfs://") ? cid : `ipfs://${cid}`;

    // Get API URL from config (use actual URL, not proxied, since this is a server-side call)
    const baseUrl = getActualApiEndpoint(network as NetworkType);
    const apiUrl = `${baseUrl}/space/${spaceId}/edit/calldata`;
    console.log(`Proxying request to: ${apiUrl}`);

    // Make request to The Graph's API
    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        cid: formattedCid,
        network,
      }),
    });

    // Handle API error responses
    if (!response.ok) {
      const errorText = await response.text();
      console.error("API error:", {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });

      return NextResponse.json(
        { error: `API error: ${response.status} ${response.statusText}`, details: errorText },
        { status: response.status },
      );
    }

    // Parse and normalize response data
    const data = await response.json();
    console.log("API response:", data);

    // Normalize the response format
    // We want to return a consistent format: { to: string, data: string }
    if (data.calldata && data.calldata.to && data.calldata.data) {
      // Format 1: Return nested structure as is
      return NextResponse.json(data);
    } else if (data.to && data.data) {
      // Format 2: Data already at root level, return as is
      return NextResponse.json(data);
    } else {
      // Try to extract to and data from any other format
      const to = data.to || data.address || data.contractAddress;
      const txData = data.data || data.calldata || data.txData;

      if (to && txData) {
        // Return normalized format
        return NextResponse.json({ to, data: txData });
      } else {
        // Cannot extract required fields
        console.error("Invalid API response format:", data);
        return NextResponse.json({ error: "Invalid API response format - missing required fields" }, { status: 500 });
      }
    }
  } catch (error) {
    console.error("Error in calldata proxy:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 },
    );
  }
}
