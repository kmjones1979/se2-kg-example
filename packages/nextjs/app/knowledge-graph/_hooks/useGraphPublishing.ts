import { useState } from "react";
import { Ipfs } from "@graphprotocol/grc-20";
import { useTransactor } from "~~/hooks/scaffold-eth";

interface PublishingState {
  spaceId: string;
  operationName: string;
  ipfsCid: string;
  txData: { to: string; data: string } | null;
  txHash: string | null;
  status: string;
  step: number;
}

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
  const getCallData = async (): Promise<{ to: string; data: string } | null> => {
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
      const result = await fetch(`https://api-testnet.grc-20.thegraph.com/space/${state.spaceId}/edit/calldata`, {
        method: "POST",
        body: JSON.stringify({
          cid: state.ipfsCid,
          network: "TESTNET",
        }),
      });

      const data = await result.json();

      setState(prev => ({
        ...prev,
        txData: data,
        status: "Call data ready",
        step: 3,
      }));

      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setStatus(`Error getting call data: ${errorMessage}`);
      return null;
    }
  };

  /**
   * Send the transaction to the blockchain
   */
  const sendTransaction = async (): Promise<string | null> => {
    if (!state.txData) {
      setStatus("No transaction data available");
      return null;
    }

    try {
      setStatus("Sending transaction...");

      const txHash = await transactor({
        to: state.txData.to,
        value: BigInt(0),
        data: state.txData.data as `0x${string}`,
      });

      if (txHash) {
        setState(prev => ({
          ...prev,
          txHash,
          status: `Transaction sent: ${txHash}`,
          step: 4,
        }));
        return txHash;
      } else {
        setStatus("Transaction was not sent");
        return null;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setStatus(`Error sending transaction: ${errorMessage}`);
      return null;
    }
  };

  /**
   * Complete publishing flow: IPFS → Call Data → Transaction
   */
  const publishToChain = async (operations: any[], authorAddress?: string): Promise<string | null> => {
    // Step 1: Publish to IPFS
    const cid = await publishToIPFS(operations, authorAddress);
    if (!cid) return null;

    // Step 2: Get call data
    const txData = await getCallData();
    if (!txData) return null;

    // Step 3: Send transaction
    return await sendTransaction();
  };

  return {
    // State
    ...state,

    // State updaters
    setSpaceId,
    setOperationName,
    setStatus,
    resetPublishing,

    // Publishing flow
    publishToIPFS,
    getCallData,
    sendTransaction,
    publishToChain,
  };
};
