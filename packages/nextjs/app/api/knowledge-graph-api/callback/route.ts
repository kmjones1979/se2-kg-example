import { NextRequest, NextResponse } from "next/server";

/**
 * API route that handles transaction callback data
 */
export async function GET(req: NextRequest) {
  try {
    // Get the txHash from the query parameters
    const txHash = req.nextUrl.searchParams.get("txHash");

    console.log("Callback route received request for txHash:", txHash);

    if (!txHash) {
      return NextResponse.json({ error: "Missing transaction hash" }, { status: 400 });
    }

    // For now, we'll just return a mock response
    // In a production environment, this would typically check the transaction status on the blockchain
    console.log("Returning mock callback data for transaction:", txHash);

    return NextResponse.json({
      txHash,
      ipfsCid: "mock-ipfs-cid-for-callback",
      status: "confirmed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error in callback API route:", error);
    return NextResponse.json(
      { error: "Internal server error", message: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
