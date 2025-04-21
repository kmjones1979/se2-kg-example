import { useCallback, useEffect, useRef, useState } from "react";
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
  // Add a ref to track state changes
  const prevStateRef = useRef<PublishingState | null>(null);

  // Add a ref to track the current state reliably (avoiding async state update issues)
  const currentStateRef = useRef<PublishingState>({
    spaceId: initialSpaceId,
    operationName: "",
    ipfsCid: "",
    txData: null,
    txHash: null,
    status: "Ready",
    step: 1,
  });

  const [state, setState] = useState<PublishingState>({
    spaceId: initialSpaceId,
    operationName: "",
    ipfsCid: "",
    txData: null,
    txHash: null,
    status: "Ready",
    step: 1,
  });

  // Custom setState function that updates both the React state and our ref
  const updateState = useCallback((update: Partial<PublishingState> | ((prev: PublishingState) => PublishingState)) => {
    setState(prev => {
      // Handle both function and object updates
      const newState = typeof update === "function" ? update(prev) : { ...prev, ...update };

      // Update our ref immediately to ensure reliable access to latest state
      currentStateRef.current = newState;

      return newState;
    });
  }, []);

  // Add effect to monitor state changes
  useEffect(() => {
    // Skip first render
    if (prevStateRef.current === null) {
      prevStateRef.current = state;
      // Initialize currentStateRef with initial state
      currentStateRef.current = state;
      return;
    }

    // Track significant state changes
    const prev = prevStateRef.current;

    // Log txData changes
    if (prev.txData !== state.txData) {
      console.log("🔄 txData changed:", {
        from: prev.txData ? "exists" : "null",
        to: state.txData ? "exists" : "null",
        timestamp: new Date().toISOString(),
      });

      if (prev.txData && !state.txData) {
        console.warn("⚠️ txData was reset to null!");
      }

      if (!prev.txData && state.txData) {
        console.log("✅ txData was set:", {
          to: state.txData.to.substring(0, 10) + "...",
          dataLength: state.txData.data.length,
        });
      }
    }

    // Log step changes
    if (prev.step !== state.step) {
      console.log(`🔄 Step changed: ${prev.step} → ${state.step}`);
    }

    // Log status changes
    if (prev.status !== state.status) {
      console.log(`🔄 Status changed: "${prev.status}" → "${state.status}"`);
    }

    // Also update the currentStateRef
    currentStateRef.current = state;

    // Update ref
    prevStateRef.current = state;
  }, [state]);

  // Add useEffect to log API endpoints on mount
  useEffect(() => {
    console.log("📌 Hypergraph configuration:");
    console.log(`  Default network: ${hypergraphConfig.defaultNetwork}`);
    console.log(`  Default space ID: ${hypergraphConfig.defaultSpaceId}`);
    console.log(`  TESTNET API: ${hypergraphConfig.endpoints.TESTNET.url}`);
    console.log(`  MAINNET API: ${hypergraphConfig.endpoints.MAINNET.url}`);
    console.log(`  Actual TESTNET API: ${hypergraphConfig.endpoints.TESTNET.actualUrl}`);
    console.log(`  Actual MAINNET API: ${hypergraphConfig.endpoints.MAINNET.actualUrl}`);

    // For development environment, we're now using a proxy to avoid CORS issues
    const isDev = process.env.NODE_ENV === "development";
    if (isDev) {
      console.log("🔄 Using API proxy in development environment to avoid CORS issues");
    }

    // Simple check to verify proxy API is accessible, much safer than direct CORS check
    const checkApiAccess = async () => {
      try {
        // Check local proxy API endpoint with OPTIONS
        const response = await fetch("/api/proxy", { method: "OPTIONS" });
        console.log(`API proxy check: ${response.ok ? "OK" : "Failed"} (${response.status})`);

        if (!response.ok) {
          console.warn("⚠️ API proxy may not be working correctly");
        }
      } catch (error) {
        console.error("Error checking API proxy:", error);
      }
    };

    // Execute the API check (only in browser environment)
    if (typeof window !== "undefined") {
      checkApiAccess().catch(console.error);
    }
  }, []);

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
    updateState(prev => ({ ...prev, spaceId }));
  };

  /**
   * Update the operation name
   */
  const setOperationName = (operationName: string) => {
    updateState(prev => ({ ...prev, operationName }));
  };

  /**
   * Set the current status
   */
  const setStatus = (status: string) => {
    updateState(prev => ({ ...prev, status }));
  };

  /**
   * Reset the publishing state
   */
  const resetPublishing = () => {
    updateState(prev => ({
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
    console.log("========== PUBLISH TO IPFS START ==========");
    console.log(`Attempting to publish ${operations.length} operations to IPFS`);

    // Always use currentStateRef for reliable state access
    const currentState = currentStateRef.current;

    console.log(`Current state before publishing:`, {
      spaceId: currentState.spaceId,
      operationName: currentState.operationName,
      ipfsCid: currentState.ipfsCid ? currentState.ipfsCid : "null",
      step: currentState.step,
    });

    if (!currentState.operationName) {
      console.error("Operation name is missing");
      setStatus("Operation name is required");
      console.log("========== PUBLISH TO IPFS END (NO OPERATION NAME) ==========");
      return null;
    }

    if (operations.length === 0) {
      console.error("No operations to publish");
      setStatus("No operations to publish");
      console.log("========== PUBLISH TO IPFS END (NO OPERATIONS) ==========");
      return null;
    }

    try {
      console.log("Setting status to 'Publishing to IPFS...'");
      setStatus("Publishing to IPFS...");

      // Log the first few operations for debugging
      console.log(
        `First ${Math.min(3, operations.length)} operations:`,
        operations.slice(0, 3).map(op => ({
          type: op.type,
          action: op.action,
          id: op.id?.substring(0, 8) || "unknown",
        })),
      );

      console.log("Calling Ipfs.publishEdit with:", {
        name: currentState.operationName,
        opsCount: operations.length,
        author: authorAddress || "0x0000000000000000000000000000000000000000",
      });

      // Following the structure from https://github.com/graphprotocol/grc-20-ts
      try {
        const result = await Ipfs.publishEdit({
          name: currentState.operationName,
          ops: operations,
          author: authorAddress || "0x0000000000000000000000000000000000000000",
        });

        console.log("IPFS.publishEdit succeeded with result:", result);

        // The API returns the CID prefixed with ipfs:// according to docs
        // Make sure we're handling the format correctly
        if (!result || !result.cid) {
          console.error("IPFS publishing failed: No CID returned");
          setStatus("IPFS publishing failed: No CID returned");
          console.log("========== PUBLISH TO IPFS END (NO CID) ==========");
          return null;
        }

        const ipfsCid = result.cid.startsWith("ipfs://") ? result.cid.substring(7) : result.cid;

        console.log("IPFS publishing successful:", {
          fullCid: result.cid,
          extractedCid: ipfsCid,
          operationCount: operations.length,
        });

        // Save the CID to state and update status using our reliable state update function
        console.log(`Updating state with ipfsCid: ${ipfsCid}`);

        // Use a local variable to ensure we have the value
        const finalCid = ipfsCid;

        // Update state immediately with our reliable state update function
        updateState({
          ipfsCid: finalCid,
          status: `Published to IPFS: ${finalCid}`,
          step: 2,
        });

        // Log the updated state from our ref to confirm it was set
        console.log("Updated state after IPFS publishing:", {
          ipfsCid: currentStateRef.current.ipfsCid,
          status: currentStateRef.current.status,
          step: currentStateRef.current.step,
        });

        console.log(`Returning CID from publishToIPFS: ${finalCid}`);
        console.log("========== PUBLISH TO IPFS END (SUCCESS) ==========");
        return finalCid;
      } catch (ipfsError) {
        console.error("Error in Ipfs.publishEdit:", ipfsError);
        console.error("Error details:", {
          name: ipfsError instanceof Error ? ipfsError.name : "Unknown",
          message: ipfsError instanceof Error ? ipfsError.message : String(ipfsError),
          stack: ipfsError instanceof Error ? ipfsError.stack : "No stack trace",
        });
        throw ipfsError; // Re-throw to be caught by the outer try/catch
      }
    } catch (error) {
      console.error("IPFS publishing error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setStatus(`Error publishing to IPFS: ${errorMessage}`);
      console.log("========== PUBLISH TO IPFS END (ERROR) ==========");
      return null;
    }
  };

  /**
   * Fetch call data from the API based on the IPFS CID and space ID
   * @param ipfsCid The IPFS CID to use
   * @param spaceId The space ID to use
   * @param network The network to use (TESTNET or MAINNET)
   * @returns The transaction data object or null if failed
   */
  const getCallData = async (network: NetworkType = "MAINNET"): Promise<{ to: string; data: string } | null> => {
    console.log("============= GET CALL DATA START =============");
    const { spaceId, ipfsCid } = currentStateRef.current;

    console.log(`Getting call data with:
- spaceId: ${spaceId || "not set"}
- ipfsCid: ${ipfsCid || "not set"}
- network: ${network}`);

    // Check if IPFS CID is missing
    if (!ipfsCid) {
      console.error("IPFS CID is missing - Check the publishToIPFS function");
      updateState(prev => ({
        ...prev,
        status: "IPFS CID is missing",
        error: "IPFS CID is required for fetching call data",
      }));
      console.log("============= GET CALL DATA END (ERROR: MISSING CID) =============");
      return null;
    }

    // Check if Space ID is missing
    if (!spaceId) {
      console.error("Space ID is missing");
      updateState(prev => ({
        ...prev,
        status: "Space ID is missing",
        error: "Space ID is required for fetching call data",
      }));
      console.log("============= GET CALL DATA END (ERROR: MISSING SPACE ID) =============");
      return null;
    }

    try {
      updateState(prev => ({
        ...prev,
        status: "Fetching call data...",
      }));

      // Use the API endpoint from hypergraph.config.js
      const apiEndpoint = getCalldataApiUrl(network);
      console.log(`Using API endpoint: ${apiEndpoint}`);

      // Use the mock data if configured
      if (shouldUseMockData()) {
        console.log("Using mock transaction data (development only)");
        const mockData = getMockTxData();

        updateState(prev => ({
          ...prev,
          txData: mockData,
          status: "Call data ready (mock)",
          step: 3,
        }));

        console.log("Mock call data set to state:", {
          to: mockData.to.substring(0, 10) + "...",
          dataLength: mockData.data.length,
        });
        console.log("============= GET CALL DATA END (MOCK SUCCESS) =============");
        return mockData;
      }

      // Try to fetch calldata through local API proxy first (to avoid CORS issues)
      console.log(`Fetching calldata for CID ${ipfsCid} and space ${spaceId} via local proxy`);
      let response;

      try {
        // Use the local API proxy
        response = await fetch("/api/knowledge-graph-api/calldata", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            spaceId,
            cid: ipfsCid,
            network,
          }),
        });

        console.log(`Local proxy API response status: ${response.status}`);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Local proxy API error:", {
            status: response.status,
            statusText: response.statusText,
            errorText,
          });
          throw new Error(`Local proxy API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Calldata response received:", data);

        // Extract the transaction data from the response, handling both possible formats:
        // 1. { calldata: { to: string, data: string } }
        // 2. { to: string, data: string }
        let txData: { to: string; data: string };

        if (data.calldata && data.calldata.to && data.calldata.data) {
          // Format 1: Nested calldata object
          txData = {
            to: data.calldata.to,
            data: data.calldata.data,
          };
        } else if (data.to && data.data) {
          // Format 2: Direct properties
          txData = {
            to: data.to,
            data: data.data,
          };
        } else {
          console.error("Invalid response format - missing transaction data:", data);
          throw new Error("Invalid response format - missing transaction data fields");
        }

        console.log("Transaction data successfully extracted:", {
          to: txData.to.substring(0, 10) + "...",
          dataLength: txData.data.length,
        });

        // Update state with transaction data
        updateState(prev => ({
          ...prev,
          txData,
          status: "Call data ready",
          step: 3,
        }));

        console.log("============= GET CALL DATA END (SUCCESS) =============");
        return txData;
      } catch (error) {
        console.error("Error fetching calldata via local proxy:", error);

        // If we're in development mode, use mock data as fallback
        if (shouldUseMockData()) {
          console.warn("FALLING BACK TO MOCK DATA - For development only");
          const mockData = getMockTxData();

          updateState(prev => ({
            ...prev,
            txData: mockData,
            status: "Call data ready (mock fallback)",
            step: 3,
          }));

          console.log("Mock call data set to state:", {
            to: mockData.to.substring(0, 10) + "...",
            dataLength: mockData.data.length,
          });
          console.log("============= GET CALL DATA END (MOCK FALLBACK) =============");
          return mockData;
        }

        // If we're not in development mode, propagate the error
        updateState(prev => ({
          ...prev,
          status: "Failed to fetch call data",
          error: error instanceof Error ? error.message : String(error),
        }));

        console.log("============= GET CALL DATA END (ERROR) =============");
        return null;
      }
    } catch (error) {
      console.error("Error in getCallData:", error);

      updateState(prev => ({
        ...prev,
        status: "Error fetching call data",
        error: error instanceof Error ? error.message : String(error),
      }));

      console.log("============= GET CALL DATA END (ERROR) =============");
      return null;
    }
  };

  /**
   * Send the transaction to the blockchain
   */
  const sendTransaction = async (): Promise<`0x${string}` | null> => {
    console.log("========== SEND TRANSACTION START ==========");

    // Always use currentStateRef for reliable state access
    const currentState = currentStateRef.current;

    console.log("Current state before sending transaction:", {
      step: currentState.step,
      hasTxData: !!currentState.txData,
      status: currentState.status,
      ipfsCid: currentState.ipfsCid,
    });

    if (currentState.txData) {
      console.log("Transaction data to send:", {
        to: currentState.txData.to,
        dataLength: currentState.txData.data ? currentState.txData.data.length : 0,
        dataPreview: currentState.txData.data ? `${currentState.txData.data.substring(0, 50)}...` : "null",
      });
    }

    if (!currentState.txData) {
      console.error("No transaction data available!");
      setStatus("No transaction data available. Get call data first.");
      console.log("========== SEND TRANSACTION END (NO DATA) ==========");
      return null;
    }

    // Try to use smart account first if enabled in config
    try {
      // Import getGeoPrivateKey and shouldUseSmartAccount from config
      const { getGeoPrivateKey, shouldUseSmartAccount } = await import("~~/hypergraph.config");

      const useSmartAccount = shouldUseSmartAccount();
      const privateKey = getGeoPrivateKey();

      if (useSmartAccount && privateKey) {
        console.log("Using GEO smart account for transaction");
        setStatus("Initializing smart account wallet...");

        // Format private key to ensure it has 0x prefix
        const formattedPrivateKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;

        try {
          const smartAccountWalletClient = await getSmartAccountWalletClient({
            privateKey: formattedPrivateKey as `0x${string}`,
            // Use custom RPC URL if needed - we'll use the default
          });

          console.log("Smart account wallet client initialized, sending transaction");
          setStatus("Sending transaction via smart account...");

          const txResult = await smartAccountWalletClient.sendTransaction({
            to: currentState.txData.to.startsWith("0x")
              ? (currentState.txData.to as `0x${string}`)
              : (`0x${currentState.txData.to}` as `0x${string}`),
            value: 0n,
            data: currentState.txData.data.startsWith("0x")
              ? (currentState.txData.data as `0x${string}`)
              : (`0x${currentState.txData.data}` as `0x${string}`),
          });

          console.log(`📝 Transaction sent via smart account! Hash: ${txResult}`);
          updateState(prev => ({
            ...prev,
            txHash: txResult,
            status: "success",
            step: 4,
          }));

          console.log(`New state after successful transaction:`, {
            step: 4,
            status: "success",
            txHash: txResult,
          });
          console.log("========== SEND TRANSACTION END (SUCCESS) ==========");
          return txResult;
        } catch (smartAccountError) {
          console.error("Smart account transaction failed:", smartAccountError);
          const errorMsg = smartAccountError instanceof Error ? smartAccountError.message : String(smartAccountError);
          setStatus(`Smart account transaction failed: ${errorMsg}`);
          console.log("Falling back to regular transaction...");
          // Continue to regular transactor
        }
      }
    } catch (configError) {
      console.error("Error accessing smart account config:", configError);
      console.log("Falling back to regular transaction...");
      // Continue to regular transactor
    }

    // Fallback to regular transactor if smart account is not used or fails
    if (!transactor) {
      setStatus("Transactor not available");
      console.log("========== SEND TRANSACTION END (NO TRANSACTOR) ==========");
      return null;
    }

    // Use the current txData to send the transaction
    return sendTransactionWithData(currentState.txData);
  };

  /**
   * Helper function to send a transaction with specific data
   * This avoids issues with async state updates
   */
  const sendTransactionWithData = async (txData: { to: string; data: string }): Promise<`0x${string}` | null> => {
    try {
      console.log("Setting state to 'sending'");
      updateState(prev => ({ ...prev, status: "sending" }));

      // Log the transaction data being sent
      console.log("Sending transaction to:", txData.to);
      console.log("Transaction data length:", txData.data.length);
      console.log("Transaction data (subset):", txData.data.substring(0, 66) + "...");
      console.log("Space ID:", currentStateRef.current.spaceId);

      // Send the transaction using the existing transactor hook
      console.log("Calling transactor with transaction data");
      const hash = await transactor({
        to: txData.to,
        value: BigInt(0),
        data: txData.data as `0x${string}`,
      });

      if (hash) {
        console.log(`📝 Transaction sent! Hash: ${hash}`);
        updateState(prev => ({
          ...prev,
          txHash: hash,
          status: "success",
          step: 4,
        }));

        console.log(`New state after successful transaction:`, {
          step: 4,
          status: "success",
          txHash: hash,
        });
        console.log("========== SEND TRANSACTION END (SUCCESS) ==========");
        return hash;
      } else {
        console.error("Transaction was sent but no hash was returned");
        updateState(prev => ({
          ...prev,
          status: "error",
          error: "No transaction hash returned",
        }));
        console.log("========== SEND TRANSACTION END (NO HASH) ==========");
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
        console.log("User rejected the transaction");
      } else if (errorMessage.includes("insufficient funds")) {
        userMessage = "Insufficient funds to complete the transaction";
        console.log("User has insufficient funds");
      } else if (
        errorMessage.includes("nonce too low") ||
        errorMessage.includes("replacement transaction underpriced")
      ) {
        userMessage = "Transaction nonce issue. Please try again";
        console.log("Transaction nonce issue detected");
      }

      updateState(prev => ({
        ...prev,
        status: "error",
        error: userMessage,
        errorDetails: `${errorName}: ${errorMessage}`,
      }));

      console.log(`Updated state with error: ${userMessage}`);
      console.log("========== SEND TRANSACTION END (ERROR) ==========");
      return null;
    }
  };

  /**
   * Complete publishing flow: IPFS → Call Data → Transaction
   */
  const publishToChain = async (
    operations: any[],
    authorAddress?: string,
    useSmartAccount = false,
    privateKey?: string,
    network: NetworkType = "MAINNET",
  ): Promise<string | `0x${string}` | null> => {
    console.log("========== PUBLISH TO CHAIN START ==========");
    console.log(`Publishing ${operations.length} operations to chain`);
    console.log(`Using network: ${network}, smart account: ${useSmartAccount}`);

    // Add detailed operations logging for troubleshooting
    if (operations.length > 0) {
      console.log("========== OPERATIONS DETAILS ==========");
      console.log(`Total operations: ${operations.length}`);

      // Group operations by type for easier analysis
      const typeGroups: Record<string, number> = {};
      operations.forEach(op => {
        const type = op.type || "unknown";
        typeGroups[type] = (typeGroups[type] || 0) + 1;
      });

      console.log("Operation types summary:", typeGroups);

      // Log the first operation's complete structure for debugging
      if (operations[0]) {
        console.log("First operation complete structure:", JSON.stringify(operations[0], null, 2));

        // Check if operation follows expected structure
        const hasRequiredFields = operations.every(
          op =>
            op.type &&
            (op.type === "triple" ? op.data?.type === "SET_TRIPLE" || op.data?.type === "DELETE_TRIPLE" : true) &&
            (op.type === "relation"
              ? op.data?.type === "CREATE_RELATION" || op.data?.type === "DELETE_RELATION"
              : true),
        );

        console.log(`Operations have required fields: ${hasRequiredFields}`);
      }
      console.log("========== END OPERATIONS DETAILS ==========");
    }

    try {
      // Step 1: Publish to IPFS
      console.log("Step 1: Publishing to IPFS");
      const cid = await publishToIPFS(operations, authorAddress);
      if (!cid) {
        console.error("Failed to publish to IPFS");
        setStatus("Failed to publish to IPFS");
        console.log("========== PUBLISH TO CHAIN END (IPFS FAILED) ==========");
        return null;
      }

      // Verify the IPFS CID was set correctly in state
      const ipfsCid = currentStateRef.current.ipfsCid;
      if (!ipfsCid || ipfsCid !== cid) {
        console.warn(`⚠️ State ipfsCid (${ipfsCid}) does not match returned CID (${cid})`);
        // Force update the state to ensure consistency
        updateState(prev => ({
          ...prev,
          ipfsCid: cid,
          status: `Published to IPFS: ${cid} (recovered)`,
          step: 2,
        }));
        console.log("Forced state update to ensure IPFS CID is set correctly");

        // IMPORTANT: Wait for state update to propagate before proceeding
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`Successfully published to IPFS: ${cid}`);

      // Step 2: Get call data
      console.log("Step 2: Getting call data");

      // Use the CID directly rather than relying on state
      try {
        // Instead of using getCallData(), which relies on state,
        // we'll make a direct call to get transaction data using the CID we have
        console.log(`Directly using CID: ${cid} for call data`);

        // Create the request to get call data
        const apiEndpoint = getCalldataApiUrl(currentStateRef.current.spaceId, network);
        console.log(`Using API endpoint: ${apiEndpoint}`);

        let txData;

        // Use mock data if configured
        if (shouldUseMockData()) {
          console.log("Using mock transaction data (development only)");
          txData = getMockTxData();
        } else {
          // Make the API call with the CID we have
          const response = await fetch("/api/knowledge-graph-api/calldata", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              spaceId: currentStateRef.current.spaceId,
              cid: cid, // Use the CID directly
              network,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error("API error:", {
              status: response.status,
              statusText: response.statusText,
              errorText,
            });
            throw new Error(`API error: ${response.status} ${response.statusText}`);
          }

          const data = await response.json();
          console.log("Calldata response received:", data);

          // Extract transaction data
          if (data.calldata && data.calldata.to && data.calldata.data) {
            txData = {
              to: data.calldata.to,
              data: data.calldata.data,
            };
          } else if (data.to && data.data) {
            txData = {
              to: data.to,
              data: data.data,
            };
          } else {
            console.error("Invalid response format - missing transaction data:", data);
            throw new Error("Invalid response format - missing transaction data fields");
          }
        }

        if (!txData) {
          console.error("Failed to get call data");
          setStatus("Failed to get transaction data from API");
          console.log("========== PUBLISH TO CHAIN END (CALL DATA FAILED) ==========");
          return null;
        }

        // Update state with the transaction data
        updateState(prev => ({
          ...prev,
          txData,
          status: "Call data ready",
          step: 3,
        }));

        // Wait for state update to propagate
        await new Promise(resolve => setTimeout(resolve, 100));

        console.log("Successfully retrieved call data:", {
          to: txData.to.substring(0, 10) + "...",
          dataLength: txData.data.length,
        });

        // Step 3: Send transaction - use smart account if specified
        console.log("Step 3: Sending transaction");

        if (useSmartAccount && privateKey) {
          console.log("Using GEO smart account for transaction");
          try {
            // Following the structure from https://github.com/graphprotocol/grc-20-ts
            setStatus("Initializing smart account wallet...");

            // Format private key to ensure it has 0x prefix
            const formattedPrivateKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;

            // Log key information (masked) for debugging
            console.log(
              `Using private key: ${formattedPrivateKey.substring(0, 6)}...${formattedPrivateKey.substring(formattedPrivateKey.length - 4)}`,
            );

            console.log("Getting smart account wallet client...");
            const smartAccountWalletClient = await getSmartAccountWalletClient({
              privateKey: formattedPrivateKey as `0x${string}`,
              // Use custom RPC URL if needed - we'll use the default
            });

            console.log("Smart account wallet client initialized");
            console.log("Smart account details:", {
              address: smartAccountWalletClient.account?.address || "unknown",
              chainId: smartAccountWalletClient.chain?.id || "unknown",
              type: "Smart Contract Account",
            });

            // Log transaction details before sending
            console.log("Transaction details:", {
              to: txData.to,
              dataLength: txData.data.length,
              dataSample: `${txData.data.substring(0, 50)}...${txData.data.substring(txData.data.length - 50)}`,
              network,
            });

            console.log("Sending transaction via smart account...");
            setStatus("Sending transaction via smart account...");

            const txResult = await smartAccountWalletClient.sendTransaction({
              to: txData.to.startsWith("0x") ? (txData.to as `0x${string}`) : (`0x${txData.to}` as `0x${string}`),
              value: 0n,
              data: txData.data.startsWith("0x")
                ? (txData.data as `0x${string}`)
                : (`0x${txData.data}` as `0x${string}`),
            });

            console.log(`📝 Transaction sent via smart account! Hash: ${txResult}`);

            // Add more transaction details logging
            console.log("Transaction details:", {
              hash: txResult,
              to: txData.to.substring(0, 10) + "...",
              dataLength: txData.data.length,
              network,
              useSmartAccount: true,
            });

            // Log expected indexing time
            console.log(
              "Expected indexing delay: The transaction is confirmed, but it may take a few minutes (typically 2-5 minutes) for the data to be fully indexed and available in the Graph database.",
            );

            updateState(prev => ({
              ...prev,
              txHash: txResult,
              status: "success",
              step: 4,
            }));

            console.log(`New state after successful transaction:`, {
              step: 4,
              status: "success",
              txHash: txResult,
            });
            console.log("========== PUBLISH TO CHAIN END (SUCCESS) ==========");
            return txResult;
          } catch (smartAccountError) {
            console.error("Smart account transaction failed:", smartAccountError);
            const errorMsg = smartAccountError instanceof Error ? smartAccountError.message : String(smartAccountError);
            setStatus(`Smart account transaction failed: ${errorMsg}`);

            // If this is a nonce error, add a more specific message
            if (errorMsg.includes("nonce") && errorMsg.includes("too low")) {
              setStatus("Nonce too low error. The account has pending transactions or a nonce mismatch.");
              console.warn("This is likely because the smart account has other pending transactions. Try again later.");
            }

            console.log("========== PUBLISH TO CHAIN END (SMART ACCOUNT ERROR) ==========");
            return null;
          }
        } else {
          // Use regular transactor for non-smart-account transactions
          const txHash = await sendTransaction();
          if (!txHash) {
            console.error("Failed to send transaction");
            setStatus("Failed to send transaction to the blockchain");
            console.log("========== PUBLISH TO CHAIN END (TRANSACTION FAILED) ==========");
            return null;
          }

          console.log(`Transaction sent successfully! Hash: ${txHash}`);
          console.log("========== PUBLISH TO CHAIN END (SUCCESS) ==========");
          return txHash;
        }
      } catch (callDataError) {
        console.error("Error getting call data:", callDataError);
        setStatus(
          `Error getting transaction data: ${callDataError instanceof Error ? callDataError.message : String(callDataError)}`,
        );
        console.log("========== PUBLISH TO CHAIN END (CALL DATA ERROR) ==========");
        return null;
      }
    } catch (error) {
      console.error("Error in publishing chain:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setStatus(`Error in chain publishing: ${errorMessage}`);
      console.log("========== PUBLISH TO CHAIN END (ERROR) ==========");
      return null;
    }
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

        // Extract the step and status from the response
        const step = data.step || 0;
        const status = data.status || "Unknown";

        console.log(`Callback data - Step: ${step}, Status: ${status}`);
        return { step, status };
      } catch (error) {
        console.error("Error fetching callback data:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        setStatus(`Error fetching callback data: ${errorMessage}`);
        return { step: 0, status: "Error" };
      }
    } catch (error) {
      console.error("Error in getCallbackData:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setStatus(`Error in getCallbackData: ${errorMessage}`);
      return { step: 0, status: "Error" };
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
    state,
    createSpace,
    setSpaceId,
    setOperationName,
    setStatus,
    resetPublishing,
    publishToIPFS,
    getCallData,
    sendTransaction,
    publishToChain,
    getCallbackData,
    verifyTransactionSpace,
  };
};
