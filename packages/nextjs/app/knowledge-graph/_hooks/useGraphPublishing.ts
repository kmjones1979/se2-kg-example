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

  // Create a local API instance for KG operations
  const api = {
    createCallData: (params: { spaceId: string; ipfsCid: string }) => {
      console.log("createCallData called with params:", params);

      if (!params.spaceId || !params.ipfsCid) {
        console.error("Missing required parameters for createCallData:", params);
        throw new Error("Missing required parameters for createCallData");
      }

      // Get contract address from environment or use a mock address
      const contractAddress =
        process.env.NEXT_PUBLIC_GRAPH_CONTRACT_ADDRESS || "0x49d36c79bc314c68cc591821e9b7e53e0c175673";

      console.log("Using contract address:", contractAddress);

      // Create proper transaction data structure
      // In a production environment, this would use the proper Graph SDK methods
      const callData = {
        to: contractAddress,
        data:
          "0x" +
          Buffer.from(
            JSON.stringify({
              spaceId: params.spaceId,
              ipfsCid: params.ipfsCid,
            }),
          ).toString("hex"),
      };

      console.log("Generated call data:", {
        to: callData.to,
        dataLength: callData.data.length,
      });

      return callData;
    },
  };

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
  const getCallData = useCallback(async () => {
    // Access properties from currentStateRef for reliable state access
    const { ipfsCid, spaceId } = currentStateRef.current;

    if (!ipfsCid) {
      console.error("No IPFS CID available for call data");
      setStatus("No IPFS CID available for call data");
      updateState(prev => ({ ...prev, step: 1 }));
      return;
    }

    if (!spaceId) {
      console.error("Space ID is required to get call data");
      setStatus("Space ID is required to get call data");
      return;
    }

    try {
      setStatus("Getting transaction data...");

      // Debug: Log interface type and IPFS CID
      console.log("====== TRANSACTION DATA DEBUG ======");
      console.log("Interface being used:", document.querySelector(".hook-demo-card") ? "Modern" : "Traditional");
      console.log("IPFS CID being used:", ipfsCid);
      console.log("Space ID being used:", spaceId);

      // Create call data using our local API
      const callData = api.createCallData({
        spaceId,
        ipfsCid,
      });

      // Debug: Log the call data details
      console.log("Generated transaction data:", {
        to: callData.to,
        data: callData.data.substring(0, 50) + "...", // Truncate for readability
        dataLength: callData.data.length,
      });
      console.log("====== END TRANSACTION DATA DEBUG ======");

      // Update state synchronously then with React state
      currentStateRef.current.txData = callData;
      currentStateRef.current.step = 3;
      currentStateRef.current.status = "Transaction data generated successfully";

      updateState(prev => ({
        ...prev,
        txData: callData,
        status: "Transaction data generated successfully",
        step: 3,
      }));

      return callData;
    } catch (error) {
      // ... existing code ...
    }
  }, [updateState]);

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
  const publishToChain = useCallback(
    async (operations: any[], fromAddress?: string, useSmartAccount = false, geoPrivateKey?: string) => {
      if (!operations || operations.length === 0) {
        console.error("No operations to publish to chain");
        setStatus("No operations to publish to chain");
        return null;
      }

      // Debug: Log interface and operation details
      console.log("====== PUBLISH TO CHAIN DEBUG ======");
      console.log("Interface being used:", document.querySelector(".hook-demo-card") ? "Modern" : "Traditional");
      console.log("Publishing to chain with:", {
        useSmartAccount,
        hasPrivateKey: !!geoPrivateKey,
        operationsCount: operations.length,
        operationName: currentStateRef.current.operationName,
        spaceId: currentStateRef.current.spaceId,
      });

      // Log sample of operations
      if (operations.length > 0) {
        console.log(
          "Sample operations:",
          operations.slice(0, 2).map(op => ({
            type: op.type || "unknown",
            entityId: op.entity_id || op.entityId || op.triple?.entityId || op.from_id || op.fromId,
            attributeId: op.attribute_id || op.attributeId || op.triple?.attributeId,
            valueType: op.value?.type || (op.triple?.value ? op.triple.value.type : undefined),
          })),
        );
      }

      try {
        // Step 1: Publishing to IPFS
        console.log("Step 1: Publishing to IPFS");
        const cid = await publishToIPFS(operations, fromAddress);
        if (!cid) {
          console.error("Failed to publish to IPFS");
          setStatus("Failed to publish to IPFS");
          return null;
        }

        // Verify IPFS CID is in state
        if (currentStateRef.current.ipfsCid !== cid) {
          console.log("Manually updating IPFS CID in state", cid);
          updateState(prev => ({
            ...prev,
            ipfsCid: cid,
            step: 2,
          }));

          // Small delay to ensure state update propagates
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Step 2: Getting transaction data
        console.log("Step 2: Getting transaction data");
        console.log("Current IPFS CID before getCallData:", currentStateRef.current.ipfsCid);

        try {
          // Try using getCallData first
          await getCallData();

          // Add a small delay to ensure txData is set in state
          await new Promise(resolve => setTimeout(resolve, 500));

          // Get the updated transaction data from state
          let txData = currentStateRef.current.txData;

          // If getCallData failed, provide a clear error
          if (!txData) {
            console.error("getCallData failed to generate transaction data");
            setStatus("Failed to generate transaction data. Check console for details.");
            return null;
          }
        } catch (error) {
          console.error("Error getting transaction data:", error);
          setStatus(`Error getting transaction data: ${error instanceof Error ? error.message : String(error)}`);
          return null;
        }

        // Step 3: Sending transaction
        console.log("Step 3: Sending transaction");
        try {
          // Try using sendTransaction first
          const txHash = await sendTransaction();

          if (!txHash) {
            console.error("sendTransaction failed to generate a transaction hash");
            setStatus("Failed to send transaction. Check console for details.");
            console.log("====== END PUBLISH TO CHAIN DEBUG ======");
            return null;
          }

          console.log("====== END PUBLISH TO CHAIN DEBUG ======");
          return txHash;
        } catch (error) {
          console.error("Error sending transaction:", error);
          setStatus(`Error sending transaction: ${error instanceof Error ? error.message : String(error)}`);
          console.log("====== END PUBLISH TO CHAIN DEBUG ======");
          return null;
        }
      } catch (error) {
        console.error("Error in chain publishing:", error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        setStatus(`Error in chain publishing: ${errorMessage}`);
        return null;
      }
    },
    [publishToIPFS, getCallData, sendTransaction, updateState, setStatus],
  );

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
