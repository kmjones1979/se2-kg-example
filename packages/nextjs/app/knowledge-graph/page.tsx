"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import { ConnectedAddressCard, HookDemoCard, PageHeader, StatusFooter, TraditionalInterface } from "./_components";
import { useGraphIds, useGraphOperations, useGraphPublishing } from "./_hooks";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { getGeoPrivateKey, shouldUseSmartAccount } from "~~/hypergraph.config";

// Define a type for operations
type Operation = {
  __typename?: string;
  op?: string;
  entityId?: string;
  attributeId?: string;
  value?: any;
  fromId?: string;
  relationTypeId?: string;
  toId?: string;
  id?: string;
};

const KnowledgeGraph = () => {
  const { address: connectedAddress } = useAccount();
  const [showHookDemo, setShowHookDemo] = useState(true);

  // State for tracking operations
  const [localOpsCount, setLocalOpsCount] = useState(0);
  const [directOperations, setDirectOperations] = useState<any[]>([]);
  const opsCountRef = useRef(0);
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  // State for hook demo
  const [hookDemoStatus, setHookDemoStatus] = useState("");
  const [hookDemoOpsCount, setHookDemoOpsCount] = useState(0);

  // Entity states
  const [entityId, setEntityId] = useState("");
  const [attributeId, setAttributeId] = useState("");
  const [fromId, setFromId] = useState("");
  const [relationTypeId, setRelationTypeId] = useState("");
  const [toId, setToId] = useState("");
  const [relationId, setRelationId] = useState("");

  // Use our custom hooks
  const { generateEntityId, generateAttributeId, generateRelationTypeId, generateId } = useGraphIds();

  const {
    operations,
    operationsCount,
    addTriple,
    removeTriple,
    addRelation,
    removeRelation,
    clearOperations,
    getRawOperations,
    lastStatus: operationsStatus,
    setStatus,
  } = useGraphOperations();

  const {
    state: { spaceId, operationName, ipfsCid, txData, txHash, status: publishingStatus, step: activeStep },
    setSpaceId,
    setOperationName,
    publishToIPFS,
    getCallData,
    sendTransaction,
    publishToChain,
  } = useGraphPublishing();

  // Transaction receipt for UI display
  const { data: txReceipt } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });

  // Helper functions for operation tracking
  const incrementOpsCount = (operation: any) => {
    opsCountRef.current += 1;
    setLocalOpsCount(opsCountRef.current);
    setDirectOperations(prev => [...prev, operation]);
    forceUpdate();
  };

  // Override the addOperation function with direct tracking
  const addOperation = (operation: Operation) => {
    // First, add the operation to our direct tracking
    incrementOpsCount(operation);

    // Direct access to operations array for triple operations
    if (operation.__typename === "Triple" || operation.op === "SetTriple") {
      if (operation.entityId && operation.attributeId && operation.value) {
        addTriple(operation.entityId, operation.attributeId, operation.value);
      }
    }
    // Direct access for relation operations
    else if (operation.__typename === "Relation" || operation.op === "SetRelation") {
      if (operation.fromId && operation.relationTypeId && operation.toId) {
        addRelation(operation.fromId, operation.relationTypeId, operation.toId, operation.id);
      }
    }

    // Set status
    setStatus(`Operation added: ${operation.op || operation.__typename || "Unknown"}`);
  };

  // Functions to clear operations
  const wrappedClearOperations = () => {
    clearOperations();
    setDirectOperations([]);
    opsCountRef.current = 0;
    setLocalOpsCount(0);
    forceUpdate();
  };

  // Functions to handle ID generation
  const handleGenerateEntityID = () => {
    const id = generateEntityId();
    setEntityId(id);
    setStatus(`Generated Entity ID: ${id}`);
  };

  const handleGenerateAttributeID = () => {
    const id = generateAttributeId();
    setAttributeId(id);
    setStatus(`Generated Attribute ID: ${id}`);
  };

  const handleGenerateFromEntityID = () => {
    const id = generateEntityId();
    setFromId(id);
    setStatus(`Generated From Entity ID: ${id}`);
  };

  const handleGenerateToEntityID = () => {
    const id = generateEntityId();
    setToId(id);
    setStatus(`Generated To Entity ID: ${id}`);
  };

  const handleGenerateRelationTypeID = () => {
    const id = generateRelationTypeId();
    setRelationTypeId(id);
    setStatus(`Generated Relation Type ID: ${id}`);
  };

  const handleGenerateRelationID = () => {
    const id = generateId();
    setRelationId(id);
    setStatus(`Generated Relation ID: ${id}`);
  };

  // Handle publishing workflow
  const handlePublishToIPFS = async () => {
    // First, check which operations array to use
    const rawOps = getRawOperations();
    console.log("Operations status:", {
      directOperationsLength: directOperations.length,
      rawOperationsLength: rawOps.length,
      opsCount: operationsCount,
      localOpsCount: localOpsCount,
      refOpsCount: opsCountRef.current,
    });

    // If rawOps is empty but we have directOperations, use those instead
    const operationsToPublish =
      rawOps.length > 0
        ? rawOps
        : directOperations.map(op => {
            // Convert to the format expected by publishToIPFS
            if (op.__typename === "Triple" || op.op === "SetTriple") {
              return {
                type: "SetTriple",
                entity_id: op.entityId,
                attribute_id: op.attributeId,
                value: op.value,
              };
            } else if (op.__typename === "Relation" || op.op === "SetRelation") {
              return {
                type: "SetRelation",
                from_id: op.fromId,
                relation_type_id: op.relationTypeId,
                to_id: op.toId,
                id: op.id || undefined,
              };
            }
            return op; // Return as-is if it's already in the right format
          });

    console.log("Publishing operations:", operationsToPublish.length);

    if (operationsToPublish.length === 0) {
      setStatus("No operations to publish");
      return;
    }

    await publishToIPFS(operationsToPublish, connectedAddress);
  };

  // Handle publish to chain function for the TraditionalInterface
  const handlePublishToChain = async (operations: any[]): Promise<string | `0x${string}` | null> => {
    if (!operations || operations.length === 0) {
      setStatus("No operations to publish");
      return null;
    }

    // Get smart account configuration from hypergraph config
    const useSmartAccount = shouldUseSmartAccount();
    const geoPrivateKey = getGeoPrivateKey();

    console.log(
      `Smart account configuration: useSmartAccount=${useSmartAccount}, privateKey=${geoPrivateKey ? "provided" : "not provided"}`,
    );

    try {
      const result = await publishToChain(operations, connectedAddress, useSmartAccount, geoPrivateKey);
      return result || null; // Ensure null is returned if result is undefined
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setStatus(`Error publishing to chain: ${errorMessage}`);
      return null;
    }
  };

  // Combined status from both hooks for UI display
  const displayStatus = publishingStatus !== "Ready" ? publishingStatus : operationsStatus;

  // Debug function
  const debugOperations = () => {
    console.log("===================== DEBUG OPERATIONS =====================");
    console.log("Operations object:", operations);
    console.log("Operations count:", operationsCount);
    console.log("Operations length:", operations.length);
    console.log("Direct operations:", directOperations);
    console.log("Direct operations length:", directOperations.length);
    console.log("Local operations count:", localOpsCount);
    console.log("Ref operations count:", opsCountRef.current);
    console.log("Raw operations:", getRawOperations());
    console.log("Raw operations length:", getRawOperations().length);
    console.log("Hook demo operations count:", hookDemoOpsCount);

    // Add transaction debugging information
    console.log("===================== TRANSACTION DATA =====================");
    console.log("Current interface:", showHookDemo ? "Modern (Hook Demo)" : "Traditional");
    console.log("Space ID:", spaceId);
    console.log("Operation name:", operationName);
    console.log("IPFS CID:", ipfsCid);
    console.log("Transaction data:", txData);
    console.log("Transaction hash:", txHash);
    console.log("Active publishing step:", activeStep);

    // Check if our fix from earlier could be used
    if (getRawOperations().length === 0 && directOperations.length > 0) {
      console.log("MISMATCH DETECTED: getRawOperations() returns empty array but directOperations is not empty");
      console.log("You should be able to publish using the directOperations array");

      // Log the first few direct operations for debugging
      if (directOperations.length > 0) {
        console.log("Sample directOperations:", directOperations.slice(0, 3));
      }
    }

    console.log("===================== END DEBUG =====================");
    forceUpdate();
  };

  // Call debugOperations on component mount
  useEffect(() => {
    // Debug on mount to see what's happening
    debugOperations();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-4 lg:px-8 py-4">
        {/* Header */}
        <PageHeader
          title="Knowledge Graph"
          subtitle="Build, Publish, and Write to Your Knowledge Space"
          showHookDemo={showHookDemo}
          setShowHookDemo={setShowHookDemo}
        />

        {/* Connected Address Card */}
        <ConnectedAddressCard connectedAddress={connectedAddress} spaceId={spaceId} setSpaceId={setSpaceId} />

        {/* Main Content */}
        <div className="container mx-auto p-4 pb-20">
          {showHookDemo ? (
            /* Hook-based Interface */
            <HookDemoCard onStatusChange={setHookDemoStatus} onOperationsCountChange={setHookDemoOpsCount} />
          ) : (
            /* Traditional Interface */
            <TraditionalInterface
              activeStep={activeStep}
              operationName={operationName}
              setOperationName={setOperationName}
              entityId={entityId}
              attributeId={attributeId}
              fromId={fromId}
              relationTypeId={relationTypeId}
              toId={toId}
              relationId={relationId}
              handleGenerateEntityID={handleGenerateEntityID}
              handleGenerateAttributeID={handleGenerateAttributeID}
              handleGenerateFromEntityID={handleGenerateFromEntityID}
              handleGenerateRelationTypeID={handleGenerateRelationTypeID}
              handleGenerateToEntityID={handleGenerateToEntityID}
              handleGenerateRelationID={handleGenerateRelationID}
              addOperation={addOperation}
              directOperations={directOperations}
              wrappedClearOperations={wrappedClearOperations}
              setStatus={setStatus}
              ipfsCid={ipfsCid}
              txData={txData || null}
              txHash={txHash || null}
              txReceipt={txReceipt}
              spaceId={spaceId}
              publishToIPFS={handlePublishToIPFS}
              getCallData={getCallData}
              sendTransaction={sendTransaction}
              getRawOperations={getRawOperations}
              publishToChain={handlePublishToChain}
            />
          )}
        </div>
      </div>

      {/* Fixed Footer */}
      <StatusFooter
        status={showHookDemo ? hookDemoStatus || "Ready" : displayStatus || "Ready"}
        operationsCount={showHookDemo ? hookDemoOpsCount : directOperations.length}
        onOperationsClick={debugOperations}
        isHookDemo={showHookDemo}
      />
    </div>
  );
};

export default KnowledgeGraph;
