/**
 * This file contains a test function to try different API endpoint structures
 * for The Graph API to determine which one works.
 */

// Default test parameters
const DEFAULT_SPACE_ID = "LB1JjNpxXBjP7caanTx3bP";
const DEFAULT_CID = "ipfs://QmTestCid12345";
const DEFAULT_NETWORK = "MAINNET";

// List of endpoints to try
const ENDPOINTS = [
  "https://api.thegraph.com/space/{spaceId}/edit/calldata",
  "https://api-mainnet.grc-20.thegraph.com/space/{spaceId}/edit/calldata",
  "https://api.grc-20.thegraph.com/space/{spaceId}/edit/calldata",
  "https://api.thegraph.com/v1/space/{spaceId}/edit/calldata",
  "https://grc-20.thegraph.com/space/{spaceId}/edit/calldata",
];

/**
 * Test function to try different API endpoints
 * @param spaceId The space ID to use in the test
 * @param cid The IPFS CID to use in the test
 * @param network The network to use (TESTNET or MAINNET)
 */
export async function testEndpoints(
  spaceId: string = DEFAULT_SPACE_ID,
  cid: string = DEFAULT_CID,
  network: string = DEFAULT_NETWORK,
) {
  console.log("Starting API endpoint tests...");
  console.log(`Using parameters: spaceId=${spaceId}, cid=${cid}, network=${network}`);

  for (const endpointTemplate of ENDPOINTS) {
    const apiUrl = endpointTemplate.replace("{spaceId}", spaceId);

    console.log(`\nTesting endpoint: ${apiUrl}`);
    console.log(
      `Request body: ${JSON.stringify({
        cid,
        network,
      })}`,
    );

    try {
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

      console.log(`Response status: ${response.status}`);

      const text = await response.text();
      console.log(`Response text: ${text.substring(0, 200)}${text.length > 200 ? "..." : ""}`);

      if (response.ok) {
        console.log("✅ SUCCESS! This endpoint works.");
      } else {
        console.log("❌ FAILED: This endpoint returned an error.");
      }
    } catch (error: any) {
      console.error(`❌ ERROR: Could not connect to endpoint: ${error?.message || String(error)}`);
    }
  }

  console.log("\nEndpoint testing complete.");
}

// Expose the test function to the window object so it can be called from the browser console
if (typeof window !== "undefined") {
  // @ts-ignore
  window.testGraphEndpoints = testEndpoints;
  console.log("Test function available at window.testGraphEndpoints()");
}
