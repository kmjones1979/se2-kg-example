"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import {
  ConnectedAddressCard,
  HookDemoCard,
  OperationDetailsCard,
  OperationsLog,
  PublishCard,
  RelationOperationsCard,
  StatusFooter,
  TripleOperationsCard,
} from "./_components";
import { useGraphIds, useGraphOperations, useGraphPublishing } from "./_hooks";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";

// Note: The RELATION type is primarily for property definitions and not directly for Triple values
type ValueType = "TEXT" | "NUMBER" | "URL" | "TIME" | "POINT" | "CHECKBOX";

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
  const [activeTab, setActiveTab] = useState("triple");
  const [showHookDemo, setShowHookDemo] = useState(false);

  // Local state to track operations count
  const [localOpsCount, setLocalOpsCount] = useState(0);

  // State for expandable sections
  const [expandTripleSection, setExpandTripleSection] = useState(true);
  const [expandOperationsLog, setExpandOperationsLog] = useState(true);
  const [expandPublishCard, setExpandPublishCard] = useState(true);
  const [expandAboutIds, setExpandAboutIds] = useState(true);
  const [expandKnowledgeGraphs, setExpandKnowledgeGraphs] = useState(true);

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
    spaceId,
    setSpaceId,
    operationName,
    setOperationName,
    ipfsCid,
    txData,
    txHash,
    status: publishingStatus,
    step: activeStep,
    publishToIPFS,
    getCallData,
    sendTransaction,
  } = useGraphPublishing();

  // Entity states
  const [entityId, setEntityId] = useState("");
  const [attributeId, setAttributeId] = useState("");
  const [fromId, setFromId] = useState("");
  const [relationTypeId, setRelationTypeId] = useState("");
  const [toId, setToId] = useState("");
  const [relationId, setRelationId] = useState("");

  // Transaction receipt for UI display
  const { data: txReceipt } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });

  // Add forceUpdate function to trigger re-renders when needed
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  // Direct tracking of operations
  const [directOperations, setDirectOperations] = useState<any[]>([]);

  // Use ref to maintain operations count independent of React rendering
  const opsCountRef = useRef(0);

  // Add useEffect to debug operations count with forced update
  useEffect(() => {
    console.log("Operations count updated:", operationsCount, "Operations array:", operations);
    // Force a re-render after a short delay to ensure UI is updated
    const timer = setTimeout(() => {
      forceUpdate();
      console.log("Forced update with operations count:", operationsCount);
    }, 100);
    return () => clearTimeout(timer);
  }, [operationsCount, operations]);

  // Add useEffect to update local operations count when operations change
  useEffect(() => {
    if (operations && operations.length !== undefined) {
      setLocalOpsCount(operations.length);
      console.log("Updated local operations count:", operations.length);
    }
  }, [operations]);

  // Add a simple manual tracker for operations
  const incrementOpsCount = (operation: any) => {
    opsCountRef.current += 1;
    setLocalOpsCount(opsCountRef.current);

    // Also track the operation directly
    setDirectOperations(prev => [...prev, operation]);

    console.log("Manual increment - new count:", opsCountRef.current);
    forceUpdate();
  };

  // Override the addOperation function with direct tracking
  const addOperation = (operation: Operation) => {
    console.log("addOperation called with:", operation);

    // First, add the operation to our direct tracking
    incrementOpsCount(operation);

    // Direct access to operations array for triple operations
    if (operation.__typename === "Triple" || operation.op === "SetTriple") {
      if (operation.entityId && operation.attributeId && operation.value) {
        const result = addTriple(operation.entityId, operation.attributeId, operation.value);
        console.log("Direct addTriple result:", result);
      }
    }
    // Direct access for relation operations
    else if (operation.__typename === "Relation" || operation.op === "SetRelation") {
      if (operation.fromId && operation.relationTypeId && operation.toId) {
        const result = addRelation(operation.fromId, operation.relationTypeId, operation.toId, operation.id);
        console.log("Direct addRelation result:", result);
      }
    }

    // Set status and force a UI update
    setStatus(`Operation added: ${operation.op || operation.__typename || "Unknown"}`);
  };

  // Override the clearOperations function to clear our direct tracking too
  const originalClearOperations = clearOperations;
  const wrappedClearOperations = () => {
    originalClearOperations();
    setDirectOperations([]);
    opsCountRef.current = 0;
    setLocalOpsCount(0);
    forceUpdate();
    console.log("All operations cleared");
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

  // Combined status from both hooks for UI display
  const displayStatus = publishingStatus !== "Ready" ? publishingStatus : operationsStatus;

  // Handle publishing workflow
  const handlePublishToIPFS = async () => {
    await publishToIPFS(getRawOperations(), connectedAddress);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <div className="px-4 lg:px-8 py-4">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-secondary text-white p-4 shadow-xl">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-center text-3xl md:text-4xl font-bold mb-2">Knowledge Graph</h1>
            <p className="text-center text-sm md:text-base opacity-90">
              Build, Publish, and Write to Your Knowledge Space
            </p>
            <div className="flex justify-center mt-2">
              <button onClick={() => setShowHookDemo(!showHookDemo)} className="btn btn-sm btn-outline btn-accent">
                {showHookDemo ? "Switch to Traditional Interface" : "Try Modern Hooks Interface"}
              </button>
            </div>
          </div>
        </div>

        {/* Connected Address Card */}
        <ConnectedAddressCard connectedAddress={connectedAddress} spaceId={spaceId} setSpaceId={setSpaceId} />

        {/* Main Content */}
        <div className="container mx-auto p-4 pb-20">
          {showHookDemo ? (
            /* New Hook-based Interface */
            <HookDemoCard />
          ) : (
            /* Traditional Interface */
            <>
              {/* Steps */}
              <ul className="steps w-full mb-8">
                <li className={`step ${activeStep >= 1 ? "step-primary" : ""}`}>Create Operations</li>
                <li className={`step ${activeStep >= 2 ? "step-primary" : ""}`}>Publish to IPFS</li>
                <li className={`step ${activeStep >= 3 ? "step-primary" : ""}`}>Get Transaction Data</li>
                <li className={`step ${activeStep >= 4 ? "step-primary" : ""}`}>Send Transaction</li>
              </ul>

              {/* Operation Name */}
              <OperationDetailsCard operationName={operationName} setOperationName={setOperationName} />

              {/* Tabs for Triple/Relation Operations */}
              <div className="card bg-base-100 border border-base-300 shadow-sm mb-8">
                <div
                  className="card-title p-4 cursor-pointer flex justify-between items-center"
                  onClick={() => setExpandTripleSection(!expandTripleSection)}
                >
                  <div className="flex items-center">
                    <h3 className="text-lg font-bold">Operations</h3>
                    <div className="tabs tabs-boxed ml-4">
                      <button
                        className={`tab ${activeTab === "triple" ? "tab-active" : ""}`}
                        onClick={e => {
                          e.stopPropagation();
                          setActiveTab("triple");
                        }}
                      >
                        Triple Operations
                      </button>
                      <button
                        className={`tab ${activeTab === "relation" ? "tab-active" : ""}`}
                        onClick={e => {
                          e.stopPropagation();
                          setActiveTab("relation");
                        }}
                      >
                        Relation Operations
                      </button>
                    </div>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 transition-transform duration-200 ${expandTripleSection ? "rotate-180" : ""}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>

                {expandTripleSection && (
                  <div className="card-body pt-0">
                    {/* Triple Operations */}
                    {activeTab === "triple" && (
                      <TripleOperationsCard
                        entityId={entityId}
                        attributeId={attributeId}
                        addOperation={addOperation}
                        setStatus={setStatus}
                        handleGenerateEntityID={handleGenerateEntityID}
                        handleGenerateAttributeID={handleGenerateAttributeID}
                        useCustomHooks={true}
                      />
                    )}

                    {/* Relation Operations */}
                    {activeTab === "relation" && (
                      <RelationOperationsCard
                        fromId={fromId}
                        relationTypeId={relationTypeId}
                        toId={toId}
                        relationId={relationId}
                        addOperation={addOperation}
                        setStatus={setStatus}
                        handleGenerateFromEntityID={handleGenerateFromEntityID}
                        handleGenerateRelationTypeID={handleGenerateRelationTypeID}
                        handleGenerateToEntityID={handleGenerateToEntityID}
                        handleGenerateRelationID={handleGenerateRelationID}
                      />
                    )}
                  </div>
                )}
              </div>

              {/* Operations Log with our direct operations tracking */}
              <div className="card bg-base-100 border border-base-300 shadow-sm mb-8">
                <div
                  className="card-title p-4 cursor-pointer flex justify-between items-center"
                  onClick={() => setExpandOperationsLog(!expandOperationsLog)}
                >
                  <h3 className="text-lg font-bold">Operations Log</h3>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 transition-transform duration-200 ${expandOperationsLog ? "rotate-180" : ""}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>

                {expandOperationsLog && (
                  <div className="card-body pt-0">
                    {/* Replace getRawOperations() with directOperations for more reliable tracking */}
                    <OperationsLog ops={directOperations} clearOps={wrappedClearOperations} />
                  </div>
                )}
              </div>

              {/* Action Card */}
              <div className="card bg-base-100 border border-base-300 shadow-sm mb-8">
                <div
                  className="card-title p-4 cursor-pointer flex justify-between items-center"
                  onClick={() => setExpandPublishCard(!expandPublishCard)}
                >
                  <h3 className="text-lg font-bold">Publishing Actions</h3>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 transition-transform duration-200 ${expandPublishCard ? "rotate-180" : ""}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>

                {expandPublishCard && (
                  <div className="card-body pt-0">
                    <PublishCard
                      ipfsCid={ipfsCid}
                      txData={txData}
                      txHash={txHash}
                      txReceipt={txReceipt}
                      activeStep={activeStep}
                      publishToIPFS={handlePublishToIPFS}
                      getCallData={getCallData}
                      sendTransaction={sendTransaction}
                      ops={getRawOperations()}
                      operationName={operationName}
                      spaceId={spaceId}
                    />
                  </div>
                )}
              </div>

              {/* Help Card */}
              <div className="card bg-base-100 border border-base-300 shadow-sm mb-8">
                <div
                  className="card-title p-4 cursor-pointer flex justify-between items-center"
                  onClick={() => setExpandAboutIds(!expandAboutIds)}
                >
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h3 className="text-lg font-bold">About IDs</h3>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 transition-transform duration-200 ${expandAboutIds ? "rotate-180" : ""}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>

                {expandAboutIds && (
                  <div className="card-body pt-0">
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="font-bold text-primary">Entity IDs</span> - Unique identifiers for entities
                        (nodes) in your knowledge graph. Entities represent distinct objects, concepts, or things.
                      </p>
                      <p>
                        <span className="font-bold text-primary">Attribute IDs</span> - Identifiers for properties or
                        characteristics that can be attached to entities. These define what kind of data can be stored.
                      </p>
                      <p>
                        <span className="font-bold text-primary">Relation Type IDs</span> - Identifiers that define
                        types of relationships between entities. These describe how entities are connected.
                      </p>
                      <p>
                        <span className="font-bold text-primary">Relation IDs</span> - Unique identifiers for specific
                        relationship instances between entities. Used when removing specific relations.
                      </p>
                    </div>

                    <div className="mt-4 p-3 bg-base-200 rounded-box">
                      <h3 className="font-bold mb-2">ID Format</h3>
                      <p className="text-sm mb-2">
                        All IDs are 22-character unique strings generated cryptographically secure.
                      </p>
                      <div className="overflow-x-auto">
                        <table className="table table-xs">
                          <thead>
                            <tr>
                              <th>ID Type</th>
                              <th>Example</th>
                              <th>Used For</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>Entity ID</td>
                              <td>
                                <code className="bg-base-300 px-1 rounded">A9QizqoXSqjfPUBjLoPJa2</code>
                              </td>
                              <td>Identifying objects/concepts</td>
                            </tr>
                            <tr>
                              <td>Attribute ID</td>
                              <td>
                                <code className="bg-base-300 px-1 rounded">GpnQE6H64aSfIE2ZRqBNZf</code>
                              </td>
                              <td>Defining properties</td>
                            </tr>
                            <tr>
                              <td>Relation Type ID</td>
                              <td>
                                <code className="bg-base-300 px-1 rounded">Cs3KPlZHREpMZLkXPb2nsU</code>
                              </td>
                              <td>Defining relationship types</td>
                            </tr>
                            <tr>
                              <td>Relation ID</td>
                              <td>
                                <code className="bg-base-300 px-1 rounded">j8KpR2mT7YhN3xZsF9aBcQ</code>
                              </td>
                              <td>Identifying specific relationships</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <p className="text-xs italic mt-2">
                        Note: You can generate random IDs using the Generate buttons, or use existing IDs from your
                        knowledge graph to reference them.
                      </p>
                    </div>

                    <div className="mt-4 p-3 bg-base-200 rounded-box">
                      <h3 className="font-bold mb-2">Working with IDs - Best Practices</h3>
                      <div className="space-y-3 text-sm">
                        <div>
                          <h4 className="font-semibold text-primary">Naming Conventions</h4>
                          <p className="text-xs mt-1">
                            While IDs are random strings, it's helpful to use consistent naming conventions for your
                            attributes and relation types. For example:
                          </p>
                          <ul className="list-disc list-inside text-xs ml-2 mt-1">
                            <li>
                              <span className="font-medium">Attribute IDs</span>: hasName, createdAt, isActive
                            </li>
                            <li>
                              <span className="font-medium">Relation Types</span>: WORKS_FOR, PART_OF, LOCATED_IN
                            </li>
                          </ul>
                        </div>

                        <div>
                          <h4 className="font-semibold text-primary">ID Management Tips</h4>
                          <ul className="list-disc list-inside text-xs ml-2">
                            <li>Create a separate entity for each distinct object in your domain</li>
                            <li>Reuse existing IDs to connect related information</li>
                            <li>Store important IDs in a separate document for reference</li>
                            <li>Use the operations log to track your created entities and relationships</li>
                          </ul>
                        </div>

                        <div className="bg-primary/10 p-2 rounded text-xs">
                          <span className="font-bold block">Example Usage Pattern:</span>
                          <ol className="list-decimal list-inside space-y-1 mt-1">
                            <li>Generate an Entity ID for "Company XYZ"</li>
                            <li>Add triples to define its properties (name, location, founded date)</li>
                            <li>Generate Entity IDs for related entities (products, employees)</li>
                            <li>Create relations between the company and these entities</li>
                          </ol>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Understanding Knowledge Graphs Card */}
              <div className="card bg-base-100 border border-base-300 shadow-sm mb-8">
                <div
                  className="card-title p-4 cursor-pointer flex justify-between items-center"
                  onClick={() => setExpandKnowledgeGraphs(!expandKnowledgeGraphs)}
                >
                  <div className="flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l3 3 9-9" />
                    </svg>
                    <h3 className="text-lg font-bold">Understanding Knowledge Graphs</h3>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-5 w-5 transition-transform duration-200 ${expandKnowledgeGraphs ? "rotate-180" : ""}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>

                {expandKnowledgeGraphs && (
                  <div className="card-body pt-0">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="card bg-primary/10 shadow-sm">
                        <div className="card-body p-4">
                          <h3 className="font-bold text-primary">Nodes (Entities)</h3>
                          <p className="text-sm">Nodes are the objects in your knowledge graph. They can be:</p>
                          <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                            <li>People (e.g., "Alice")</li>
                            <li>Organizations (e.g., "Acme Corp")</li>
                            <li>Concepts (e.g., "Blockchain")</li>
                            <li>Physical objects (e.g., "Eiffel Tower")</li>
                          </ul>
                          <div className="bg-base-300 p-2 rounded text-xs mt-2">
                            <span className="font-bold">In this app:</span> Nodes are created using Triple Operations by
                            specifying an Entity ID.
                          </div>
                        </div>
                      </div>

                      <div className="card bg-secondary/10 shadow-sm">
                        <div className="card-body p-4">
                          <h3 className="font-bold text-secondary">Edges (Relations)</h3>
                          <p className="text-sm">Edges connect nodes, defining how entities relate to each other:</p>
                          <ul className="list-disc list-inside text-sm mt-1 space-y-1">
                            <li>
                              Person <span className="text-secondary font-bold">→ FRIENDS_WITH →</span> Person
                            </li>
                            <li>
                              Company <span className="text-secondary font-bold">→ EMPLOYS →</span> Person
                            </li>
                            <li>
                              Product <span className="text-secondary font-bold">→ MADE_BY →</span> Company
                            </li>
                          </ul>
                          <div className="bg-base-300 p-2 rounded text-xs mt-2">
                            <span className="font-bold">In this app:</span> Edges are created using Relation Operations
                            with From ID, Relation Type ID, and To ID.
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <h3 className="font-bold">Triple Operations Explained</h3>
                      <p className="text-sm mt-1">A triple is a statement with three parts:</p>

                      <div className="overflow-x-auto mt-2">
                        <table className="table table-zebra text-sm">
                          <thead>
                            <tr className="text-primary">
                              <th>Subject (Entity)</th>
                              <th>Predicate (Attribute)</th>
                              <th>Object (Value)</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              <td>Person123</td>
                              <td>hasName</td>
                              <td>"John Smith"</td>
                            </tr>
                            <tr>
                              <td>Building456</td>
                              <td>height</td>
                              <td>100 (meters)</td>
                            </tr>
                            <tr>
                              <td>Document789</td>
                              <td>published</td>
                              <td>2023-06-15</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="alert alert-info mt-4 text-xs">
                        <div>
                          <span className="font-bold block">Triple vs. Relation</span>
                          <span>
                            • Triples define properties of a single entity (e.g., Person123 has name "John")
                            <br />• Relations connect two entities (e.g., Person123 WORKS_AT Company456)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Fixed Footer */}
      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-br from-primary to-secondary text-white py-2 px-4 shadow-lg z-50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-xs opacity-80">Status:</span>
            <span className="ml-2 text-sm font-medium">{displayStatus || "Ready"}</span>
          </div>
          <div
            className="badge badge-neutral text-xs font-medium"
            onClick={() => {
              console.log("Operations object:", operations);
              console.log("Operations count:", operationsCount);
              console.log("Operations length:", operations.length);
              console.log("Direct operations:", directOperations);
              console.log("Direct operations length:", directOperations.length);
              console.log("Local operations count:", localOpsCount);
              console.log("Ref operations count:", opsCountRef.current);
              console.log("Raw operations:", getRawOperations());
              console.log("Raw operations length:", getRawOperations().length);
              // Force an update to make sure UI reflects current state
              forceUpdate();
            }}
          >
            {directOperations.length} ops
          </div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraph;
