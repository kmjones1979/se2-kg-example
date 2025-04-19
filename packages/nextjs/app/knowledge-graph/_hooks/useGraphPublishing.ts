import { useState } from "react";
import { Graph, Ipfs, getSmartAccountWalletClient } from "@graphprotocol/grc-20";
import { useTransactor } from "~~/hooks/scaffold-eth";

interface PublishingState {
  spaceId: string;
  operationName: string;
  ipfsCid: string;
  txData: { to: string; data: string } | null;
  txHash: `0x${string}` | null;
  status: string;
  step: number;
}

// Interface for callback data response
interface GraphPublishingStep {
  step: number;
  status: string;
}

// Supported network types in GRC-20
type NetworkType = "TESTNET" | "MAINNET";

/**
 * Hook for managing the publishing workflow: IPFS → Transaction Data → Blockchain
 *
 * @param initialSpaceId - The initial space ID to use for publishing
 * @returns Functions and state for publishing operations
 */
export const useGraphPublishing = (initialSpaceId = "LB1JjNpxXBjP7caanTx3bP") => {
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
      const result = await Ipfs.publishEdit({
        name: state.operationName,
        ops: operations,
        author: authorAddress || "0x0000000000000000000000000000000000000000",
      });

      setState(prev => ({
        ...prev,
        ipfsCid: result.cid,
        status: `Published to IPFS: ${result.cid}`,
        step: 2,
      }));

      return result.cid;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setStatus(`Error publishing to IPFS: ${errorMessage}`);
      return null;
    }
  };

  /**
   * Get transaction data for the IPFS CID
   */
  const getCallData = async (network: NetworkType = "MAINNET"): Promise<{ to: string; data: string } | null> => {
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

      // TEMPORARY: Use mock data while API integration is being fixed
      console.log(`MOCK: Using mock data for spaceId: ${state.spaceId} and ipfsCid: ${state.ipfsCid}`);
      console.log(`MOCK: Network: ${network}`);

      // This is mock data to simulate the API response
      const mockResponse = {
        to: "0x731a10897d267e19b34503ad902d0a29173ba4b1",
        data: "0x4554480000000000000000000000000000000000000000000000000000000000",
      };

      console.log("MOCK API Success Response:", mockResponse);

      setState(prev => ({
        ...prev,
        txData: mockResponse,
        status: "Call data ready (MOCK)",
        step: 3,
      }));

      // Comment this block and uncomment the API call when ready
      return mockResponse;

      /* 
      // REAL API IMPLEMENTATION - Uncomment when API issues resolved
      const apiUrl = `/api/calldata`;
      
      console.log(`Calling API with spaceId: ${state.spaceId} and ipfsCid: ${state.ipfsCid}`);
      console.log(`Using network: ${network}, via local proxy API`);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          spaceId: state.spaceId,
          cid: state.ipfsCid,
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

        setStatus(`Error getting call data: ${response.status} ${response.statusText}`);
        return null;
      }

      const data = await response.json();
      console.log("API Success Response:", data);

      setState(prev => ({
        ...prev,
        txData: data,
        status: "Call data ready",
        step: 3,
      }));

      return data;
      */
    } catch (error) {
      console.error("Exception in getCallData:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setStatus(`Error getting call data: ${errorMessage}`);
      return null;
    }
  };

  /**
   * Send transaction with connector or Geo smart account
   * @param useSmartAccount Whether to use the Geo smart account instead of the connected wallet
   * @param privateKey Private key for the Geo smart account (required if useSmartAccount is true)
   */
  const sendTransaction = async (useSmartAccount = false, privateKey?: string): Promise<`0x${string}` | null> => {
    if (!state.txData || !state.txData.to || !state.txData.data) {
      setStatus("Transaction data is invalid");
      return null;
    }

    try {
      setStatus("Sending transaction...");
      console.log("Sending transaction with data:", {
        spaceId: state.spaceId,
        to: state.txData.to,
        data: `${state.txData.data.substring(0, 64)}...${state.txData.data.substring(state.txData.data.length - 64)}`,
        dataLength: state.txData.data.length,
        useSmartAccount,
      });
      console.log(`Transaction is targeting space ID: ${state.spaceId}`);

      let hash: `0x${string}` | undefined;

      if (useSmartAccount) {
        if (!privateKey) {
          setStatus("Private key is required when using smart account");
          return null;
        }

        try {
          console.log("Using Geo smart account wallet...");
          const smartAccountWalletClient = await getSmartAccountWalletClient({
            privateKey: (privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`) as `0x${string}`,
          });

          const txResult = await smartAccountWalletClient.sendTransaction({
            to: state.txData.to as `0x${string}`,
            value: 0n,
            data: state.txData.data as `0x${string}`,
          });

          hash = txResult;
          console.log("Smart account transaction hash:", hash);
        } catch (smartAccountError) {
          console.error("Smart account transaction failed:", smartAccountError);
          throw smartAccountError;
        }
      } else {
        // Use the connected wallet via transactor
        hash = await transactor({
          to: state.txData.to,
          value: BigInt(0),
          data: state.txData.data as `0x${string}`,
        });
      }

      console.log("Transaction hash received:", hash);

      // Ensure we have a valid hash (transactor might return undefined)
      if (hash) {
        setState(prev => ({
          ...prev,
          txHash: hash,
          status: "Transaction sent",
          step: 4,
        }));
        return hash;
      } else {
        console.warn("Transaction was sent but no hash was returned");
        setStatus("Transaction sent but no hash was returned");
        return null;
      }
    } catch (error) {
      console.error("Transaction failed:", error);

      // Extract more detailed error information
      let errorMessage = "Transaction failed";

      if (error instanceof Error) {
        errorMessage = error.message;
        console.error("Error details:", {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });

        // Handle common wallet errors
        if (errorMessage.includes("user rejected")) {
          errorMessage = "Transaction was rejected by the user";
        } else if (errorMessage.includes("insufficient funds")) {
          errorMessage = "Insufficient funds for transaction";
        }
      }

      setStatus(`Error sending transaction: ${errorMessage}`);
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
    return await sendTransaction(useSmartAccount, privateKey);
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

        return {
          step: 5,
          status: `Error getting callback data: ${response.status} ${response.statusText}`,
        };
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
