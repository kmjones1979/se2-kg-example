import { useState } from "react";

export type NetworkType = "TESTNET" | "MAINNET";

interface ApiCallOptions {
  spaceId: string;
  cid?: string;
  network?: NetworkType;
  endpoint?: string; // Optional custom endpoint
}

/**
 * Hook for interacting with The Graph API with fallback to mock data
 * @param defaultSpaceId Default space ID to use for API calls
 * @returns API interaction methods and state
 */
export const useGraphApi = (defaultSpaceId = "LB1JjNpxXBjP7caanTx3bP") => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [useMockData, setUseMockData] = useState(true);

  /**
   * Attempts to call The Graph API with fallback to mock data
   * @param options API call options
   * @param mockResponse Mock data to return if using mock mode or if API fails
   * @returns API response or mock data
   */
  const callGraphApi = async <T>(options: ApiCallOptions, mockResponse: T): Promise<T> => {
    // If mock mode is enabled, return mock data immediately
    if (useMockData) {
      console.log("Using mock data (mock mode enabled):", mockResponse);
      return mockResponse;
    }

    const { spaceId = defaultSpaceId, cid, network = "MAINNET", endpoint } = options;

    setLoading(true);
    setError(null);

    try {
      // Determine API endpoint
      const apiUrl =
        endpoint ||
        `https://api-${network.toLowerCase() === "testnet" ? "testnet" : "mainnet"}.grc-20.thegraph.com/space/${spaceId}/edit/calldata`;

      console.log(`Calling Graph API at: ${apiUrl}`);
      console.log("Request body:", { cid, network });

      // Make API call
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

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API error (${response.status}): ${errorText}`);
      }

      const data = await response.json();
      console.log("API response:", data);

      return data as T;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error("Graph API call failed:", errorMessage);
      setError(err instanceof Error ? err : new Error(String(err)));

      // Fallback to mock data on error
      console.log("Falling back to mock data:", mockResponse);
      return mockResponse;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get call data for an IPFS CID
   * @param cid IPFS CID (with or without ipfs:// prefix)
   * @param network Network type (TESTNET or MAINNET)
   * @returns Call data object with 'to' and 'data' fields
   */
  const getCallData = async (cid: string, network: NetworkType = "MAINNET"): Promise<{ to: string; data: string }> => {
    // Format CID with ipfs:// prefix if needed
    const formattedCid = cid.startsWith("ipfs://") ? cid : `ipfs://${cid}`;

    // Mock response for when API is unavailable
    const mockCallData = {
      to: "0x731a10897d267e19b34503ad902d0a29173ba4b1",
      data: "0x4554480000000000000000000000000000000000000000000000000000000000",
    };

    return callGraphApi<{ to: string; data: string }>(
      { spaceId: defaultSpaceId, cid: formattedCid, network },
      mockCallData,
    );
  };

  return {
    loading,
    error,
    useMockData,
    setUseMockData,
    callGraphApi,
    getCallData,
  };
};
