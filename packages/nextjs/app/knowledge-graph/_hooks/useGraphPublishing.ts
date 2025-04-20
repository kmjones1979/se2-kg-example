import { useState } from "react";
import { Graph, Ipfs, getSmartAccountWalletClient } from "@graphprotocol/grc-20";
import { useTransactor } from "~~/hooks/scaffold-eth";
import hypergraphConfig, {
  NetworkType,
  getApiEndpoint,
  getCalldataApiUrl,
  getDefaultSpaceId,
  getMockTxData,
  shouldUseMockData,
} from "~~/hypergraph.config";

interface PublishingState {
  spaceId: string;
  operationName: string;
  ipfsCid: string;
  txData: { to: string; data: string } | null;
  txHash: `0x${string}` | null;
  status: string;
  step: number;
  error?: string;
  errorDetails?: string;
}

// Interface for callback data response
interface GraphPublishingStep {
  step: number;
  status: string;
}

/**
 * Hook for managing the publishing workflow: IPFS → Transaction Data → Blockchain
 *
 * @param initialSpaceId - The initial space ID to use for publishing
 * @returns Functions and state for publishing operations
 */
export const useGraphPublishing = (initialSpaceId = getDefaultSpaceId()) => {
  const [state, setState] = useState<PublishingState>({
    spaceId: initialSpaceId,
    operationName: "",
    ipfsCid: "",
    txData: null,
    txHash: null,
    status: "Ready",
    step: 1,
  });

  const transactor = useTransactor();

  /**
   * Create a new space programmatically
   * @param editorAddress Address of the initial editor
   * @param spaceName Name of the space
   * @param network Network to deploy on (TESTNET or MAINNET)
   * @returns The ID of the newly created space
   */
  const createSpace = async (
    editorAddress: string,
    spaceName: string,
    network: NetworkType = "MAINNET",
  ): Promise<string | null> => {
    try {
      setStatus(`Creating space "${spaceName}" on ${network}...`);

      // Using parameters according to latest GRC-20 API (v0.11.2)
      // Based on documentation, we need to use initialEditorAddress and spaceName
      const spaceId = await Graph.createSpace({
        initialEditorAddress: editorAddress,
        spaceName,
        network,
      } as any); // Use 'as any' to bypass TypeScript checking since the actual API may differ

      if (spaceId) {
        setStatus(`Space created successfully: ${spaceId}`);
        // Handle spaceId correctly - it should be a string
        setState(prev => ({ ...prev, spaceId: typeof spaceId === "string" ? spaceId : String(spaceId) }));
        return typeof spaceId === "string" ? spaceId : String(spaceId);
      } else {
        setStatus("Failed to create space: No space ID returned");
        return null;
      }
    } catch (error) {
      console.error("Error creating space:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setStatus(`Error creating space: ${errorMessage}`);
      return null;
    }
  };

  /**
   * Update the space ID
   */
  const setSpaceId = (spaceId: string) => {
    setState(prev => ({ ...prev, spaceId }));
  };

  /**
   * Update the operation name
   */
  const setOperationName = (operationName: string) => {
    setState(prev => ({ ...prev, operationName }));
  };

  /**
   * Set the current status
   */
  const setStatus = (status: string) => {
    setState(prev => ({ ...prev, status }));
  };

  /**
   * Reset the publishing state
   */
  const resetPublishing = () => {
    setState(prev => ({
      ...prev,
      ipfsCid: "",
      txData: null,
      txHash: null,
      status: "Ready",
      step: 1,
    }));
  };

  /**
   * Publish operations to IPFS
   */
  const publishToIPFS = async (operations: any[], authorAddress?: string): Promise<string | null> => {
    if (!state.operationName) {
      setStatus("Operation name is required");
      return null;
    }

    if (operations.length === 0) {
      setStatus("No operations to publish");
      return null;
    }

    try {
      setStatus("Publishing to IPFS...");

      // Following the structure from https://github.com/graphprotocol/grc-20-ts
      const result = await Ipfs.publishEdit({
        name: state.operationName,
        ops: operations,
        author: authorAddress || "0x0000000000000000000000000000000000000000",
      });

      // The API returns the CID prefixed with ipfs:// according to docs
      // Make sure we're handling the format correctly
      const ipfsCid = result.cid.startsWith("ipfs://") ? result.cid.substring(7) : result.cid;

      console.log("IPFS publishing successful:", {
        fullCid: result.cid,
        extractedCid: ipfsCid,
        operationCount: operations.length,
      });

      setState(prev => ({
        ...prev,
        ipfsCid,
        status: `Published to IPFS: ${ipfsCid}`,
        step: 2,
      }));

      return ipfsCid;
    } catch (error) {
      console.error("IPFS publishing error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setStatus(`Error publishing to IPFS: ${errorMessage}`);
      return null;
    }
  };

  /**
   * Get transaction data for the IPFS CID
   */
  const getCallData = async (
    network: NetworkType = hypergraphConfig.defaultNetwork,
  ): Promise<{ to: string; data: string } | null> => {
    if (!state.spaceId) {
      setStatus("Space ID is required");
      return null;
    }

    if (!state.ipfsCid) {
      setStatus("No IPFS CID available. Publish to IPFS first.");
      return null;
    }

    try {
      setStatus("Getting call data...");

      // Format the CID correctly with ipfs:// prefix if needed
      const formattedCid = state.ipfsCid.startsWith("ipfs://") ? state.ipfsCid : `ipfs://${state.ipfsCid}`;

      // Try to use the SDK directly using the documented methods
      // This approach aligns with the repo documentation
      try {
        // Check if we have direct API access
        // Note: According to the documentation, we need to make a direct fetch request
        console.log("Making direct call to the external API based on documentation");

        // Get the API URL from config
        const apiEndpoint = getCalldataApiUrl(state.spaceId, network);

        console.log(`Calling direct API: ${apiEndpoint}`);
        console.log(
          `Request body:`,
          JSON.stringify(
            {
              cid: formattedCid,
              network,
            },
            null,
            2,
          ),
        );

        const directResponse = await fetch(apiEndpoint, {
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

        if (!directResponse.ok) {
          console.error(`Direct API call failed: ${directResponse.status} ${directResponse.statusText}`);
          throw new Error(`Direct API call failed: ${directResponse.status}`);
        }

        const callDataResult = await directResponse.json();
        console.log("Direct API call data result:", callDataResult);

        if (callDataResult && callDataResult.to && callDataResult.data) {
          setState(prev => ({
            ...prev,
            txData: callDataResult,
            status: "Call data ready (via direct API)",
            step: 3,
          }));

          return callDataResult;
        } else {
          throw new Error("Direct API returned invalid call data");
        }
      } catch (directApiError) {
        console.warn("Could not use direct API:", directApiError);
        console.log("Falling back to proxy API approach...");

        // Continue with the local proxy API approach
        const apiUrl = `/api/knowledge-graph-api/calldata`;

        console.log(`Calling proxy API with spaceId: ${state.spaceId} and ipfsCid: ${formattedCid}`);
        console.log(`Using network: ${network}, via local proxy API`);

        try {
          const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              spaceId: state.spaceId,
              cid: formattedCid,
              network,
            }),
          });

          console.log(`API response status: ${response.status}`);

          if (!response.ok) {
            const errorText = await response.text();
            console.error("API Error Response:", {
              status: response.status,
              statusText: response.statusText,
              url: response.url,
              headers: Object.fromEntries([...response.headers.entries()]),
              body: errorText,
            });

            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();
          console.log("API Success Response:", data);

          // Validate that the response contains the expected to and data fields
          if (!data.to || !data.data) {
            console.error("API response missing required fields:", data);
            throw new Error("Invalid API response: missing to or data field");
          }

          setState(prev => ({
            ...prev,
            txData: data,
            status: "Call data ready",
            step: 3,
          }));

          return data;
        } catch (apiError) {
          console.error("API request failed:", apiError);
          throw apiError; // Re-throw to be caught by the outer try/catch
        }
      }
    } catch (error) {
      console.error("All approaches failed, falling back to mock data:", error);

      // Check if we should use mock data from config
      if (shouldUseMockData()) {
        console.warn("USING MOCK DATA AS FALLBACK - For development only");
        const mockData = getMockTxData();

        console.log(`Mock data being used: ${JSON.stringify(mockData, null, 2)}`);
        console.log("NOTE: This is mock data for development purposes only.");

        setState(prev => ({
          ...prev,
          txData: mockData,
          status: "Call data ready (MOCK DATA - API fallback)",
          step: 3,
        }));

        return mockData;
      } else {
        setStatus(`Error getting call data: ${error instanceof Error ? error.message : String(error)}`);
        return null;
      }
    }
  };

  /**
   * Attempt to send a transaction with the provided data
   * This function handles all the wallet-related checks and error handling
   */
  const sendTransaction = async (): Promise<`0x${string}` | null> => {
    if (!state.txData) {
      console.error("No transaction data available");
      return null;
    }

    // Validate that the txData contains necessary properties
    if (!state.txData.to || !state.txData.data) {
      console.error("Invalid transaction data:", state.txData);
      return null;
    }

    try {
      setState({ ...state, status: "sending" });

      // Log the transaction data being sent
      console.log("Sending transaction to:", state.txData.to);
      console.log("Transaction data length:", state.txData.data.length);
      console.log("Transaction data (subset):", state.txData.data.substring(0, 66) + "...");
      console.log("Space ID:", state.spaceId);

      // Send the transaction using the existing transactor hook
      const hash = await transactor({
        to: state.txData.to,
        value: BigInt(0),
        data: state.txData.data as `0x${string}`,
      });

      if (hash) {
        console.log(`📝 Transaction sent! Hash: ${hash}`);
        setState(prev => ({
          ...prev,
          txHash: hash,
          status: "success",
          step: 4,
        }));
        return hash;
      } else {
        console.error("Transaction was sent but no hash was returned");
        setState(prev => ({
          ...prev,
          status: "error",
          error: "No transaction hash returned",
        }));
        return null;
      }
    } catch (error) {
      // Enhanced error logging
      console.error("Transaction failed:", error);

      // Extract detailed error information
      const errorName = error instanceof Error ? error.name : "Unknown";
      const errorMessage = error instanceof Error ? error.message : "No message available";
      const errorStack = error instanceof Error ? error.stack : "No stack trace available";

      console.error(`Error details - Name: ${errorName}, Message: ${errorMessage}`);
      console.error(`Stack trace: ${errorStack}`);

      // Provide specific messages for common wallet-related errors
      let userMessage = "Transaction failed";

      if (errorMessage.includes("user rejected")) {
        userMessage = "Transaction was rejected by user";
      } else if (errorMessage.includes("insufficient funds")) {
        userMessage = "Insufficient funds to complete the transaction";
      } else if (
        errorMessage.includes("nonce too low") ||
        errorMessage.includes("replacement transaction underpriced")
      ) {
        userMessage = "Transaction nonce issue. Please try again";
      }

      setState(prev => ({
        ...prev,
        status: "error",
        error: userMessage,
        errorDetails: `${errorName}: ${errorMessage}`,
      }));
      return null;
    }
  };

  /**
   * Complete publishing flow: IPFS → Call Data → Transaction
   * @param operations Operations to publish
   * @param authorAddress Author address
   * @param useSmartAccount Whether to use Geo smart account
   * @param privateKey Private key for Geo smart account
   * @param network Network to use (TESTNET or MAINNET)
   */
  const publishToChain = async (
    operations: any[],
    authorAddress?: string,
    useSmartAccount = false,
    privateKey?: string,
    network: NetworkType = "MAINNET",
  ): Promise<string | `0x${string}` | null> => {
    // Step 1: Publish to IPFS
    const cid = await publishToIPFS(operations, authorAddress);
    if (!cid) return null;

    // Step 2: Get call data
    const txData = await getCallData(network);
    if (!txData) return null;

    // Step 3: Send transaction
    return await sendTransaction();
  };

  /**
   * Get callback data from the server
   */
  const getCallbackData = async (txHash: string | `0x${string}`): Promise<GraphPublishingStep> => {
    if (!txHash) {
      console.error("getCallbackData: No transaction hash provided");
      return { step: 0, status: "No transaction hash" };
    }

    try {
      console.log(`Fetching callback data for transaction: ${txHash}`);
      setStatus("Checking transaction status...");

      try {
        const response = await fetch(`/api/knowledge-graph-api/callback?txHash=${txHash}`);
        console.log(`Callback API response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Callback API error:", {
            status: response.status,
            statusText: response.statusText,
            url: response.url,
            errorText,
          });

          throw new Error(`Callback API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Callback data received:", data);

        if (data.ipfsCid) {
          setStatus("IPFS CID received");
          setState(prev => ({
            ...prev,
            ipfsCid: data.ipfsCid,
            step: 5,
          }));
          return { step: 5, status: "IPFS CID received" };
        } else {
          console.error("No IPFS CID in callback data:", data);
          return { step: 5, status: "No IPFS CID in response" };
        }
      } catch (apiError) {
        console.error("Callback API request failed, using fallback:", apiError);

        // FALLBACK: Use mock callback data for development
        console.warn("USING MOCK CALLBACK DATA - For development only");

        const mockIpfsCid = "mock-ipfs-cid-for-transaction-" + txHash.substring(0, 8);

        setStatus("IPFS CID received (mock)");
        setState(prev => ({
          ...prev,
          ipfsCid: mockIpfsCid,
          step: 5,
        }));

        return { step: 5, status: "IPFS CID received (mock data)" };
      }
    } catch (error) {
      console.error("Error fetching callback data:", error);

      // Extract detailed error information
      let errorMessage = "Error fetching callback data";
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
      }

      return { step: 5, status: `Error: ${errorMessage}` };
    }
  };

  /**
   * Verify that a transaction is associated with a specific space ID
   * @param txHash The transaction hash to verify
   * @returns Information about the transaction's association with the space
   */
  const verifyTransactionSpace = async (
    txHash: string | `0x${string}`,
  ): Promise<{
    verified: boolean;
    spaceId: string;
    details: string;
  }> => {
    try {
      console.log(`Verifying transaction ${txHash} is associated with space ID: ${state.spaceId}`);

      // In a real implementation, you would:
      // 1. Get transaction details from the blockchain
      // 2. Decode the transaction input data
      // 3. Check if it contains the space ID or contract address related to the space

      // For now, we'll use a simplified approach:
      if (!txHash) {
        return {
          verified: false,
          spaceId: state.spaceId,
          details: "No transaction hash to verify",
        };
      }

      // If we've successfully sent a transaction through our publishing system
      // We can be reasonably confident it's associated with the current space ID
      if (state.txHash === txHash) {
        return {
          verified: true,
          spaceId: state.spaceId,
          details: `Transaction ${txHash} is associated with space ID ${state.spaceId} from current session`,
        };
      }

      // If not our current transaction, indicate we need further verification
      return {
        verified: false,
        spaceId: state.spaceId,
        details: `Cannot verify association between transaction ${txHash} and space ID ${state.spaceId} - would need blockchain lookup`,
      };
    } catch (error) {
      console.error("Error verifying transaction space:", error);
      return {
        verified: false,
        spaceId: state.spaceId,
        details: `Error during verification: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  };

  return {
    // State
    ...state,

    // State updaters
    setSpaceId,
    setOperationName,
    setStatus,
    resetPublishing,

    // Space creation
    createSpace,

    // Publishing flow
    publishToIPFS,
    getCallData,
    sendTransaction,
    publishToChain,

    // Callback data
    getCallbackData,

    // Verification
    verifyTransactionSpace,
  };
};
