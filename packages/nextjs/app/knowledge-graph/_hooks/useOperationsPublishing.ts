import { useCallback, useState } from "react";
import { useGraphPublishing } from "./useGraphPublishing";
import { useAccount } from "wagmi";

/**
 * A simplified hook that combines operations publishing workflow
 * to make it easier to publish operations to IPFS and the blockchain
 */
export const useOperationsPublishing = () => {
  const { address: connectedAddress } = useAccount();
  const [publishingStatus, setPublishingStatus] = useState("");

  // Use the base publishing hooks
  const {
    spaceId,
    setSpaceId,
    operationName,
    setOperationName,
    ipfsCid,
    txData,
    txHash,
    step: publishingStep,
    publishToIPFS: basePublishToIPFS,
    getCallData,
    sendTransaction,
  } = useGraphPublishing();

  /**
   * Publishes operations to IPFS
   */
  const publishToIPFS = useCallback(
    async (operations: any[]) => {
      if (!operations || operations.length === 0) {
        setPublishingStatus("No operations to publish");
        return null;
      }

      if (!operationName) {
        setPublishingStatus("Please provide an operation name");
        return null;
      }

      setPublishingStatus("Publishing to IPFS...");
      try {
        const cid = await basePublishToIPFS(operations, connectedAddress);
        setPublishingStatus(cid ? `Published to IPFS: ${cid}` : "Failed to publish to IPFS");
        return cid;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setPublishingStatus(`Error publishing to IPFS: ${errorMessage}`);
        return null;
      }
    },
    [basePublishToIPFS, connectedAddress, operationName],
  );

  /**
   * Gets transaction data for publishing to blockchain
   */
  const prepareTransaction = useCallback(async () => {
    if (!ipfsCid) {
      setPublishingStatus("No IPFS CID available. Publish to IPFS first.");
      return null;
    }

    if (!spaceId) {
      setPublishingStatus("Please provide a Space ID");
      return null;
    }

    setPublishingStatus("Preparing transaction data...");
    try {
      const data = await getCallData();
      setPublishingStatus(data ? "Transaction data ready" : "Failed to prepare transaction data");
      return data;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setPublishingStatus(`Error preparing transaction: ${errorMessage}`);
      return null;
    }
  }, [getCallData, ipfsCid, spaceId]);

  /**
   * Sends the transaction to the blockchain
   */
  const submitTransaction = useCallback(async () => {
    if (!txData) {
      setPublishingStatus("No transaction data available. Prepare transaction first.");
      return null;
    }

    setPublishingStatus("Sending transaction to blockchain...");
    try {
      const hash = await sendTransaction();
      setPublishingStatus(hash ? `Transaction sent: ${hash}` : "Failed to send transaction");
      return hash;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setPublishingStatus(`Error sending transaction: ${errorMessage}`);
      return null;
    }
  }, [sendTransaction, txData]);

  /**
   * Complete workflow: Publish to IPFS, prepare transaction, and submit transaction
   */
  const publishToBlockchain = useCallback(
    async (operations: any[]) => {
      // Step 1: Publish to IPFS
      const cid = await publishToIPFS(operations);
      if (!cid) return null;

      // Step 2: Prepare transaction
      const data = await prepareTransaction();
      if (!data) return null;

      // Step 3: Submit transaction
      const hash = await submitTransaction();
      return hash;
    },
    [publishToIPFS, prepareTransaction, submitTransaction],
  );

  return {
    // States
    spaceId,
    setSpaceId,
    operationName,
    setOperationName,
    ipfsCid,
    txData,
    txHash,
    publishingStep,
    publishingStatus,

    // Individual step actions
    publishToIPFS,
    prepareTransaction,
    submitTransaction,

    // Complete workflow
    publishToBlockchain,

    // Helper for external status updates
    setPublishingStatus,
  };
};
