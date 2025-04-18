"use client";

import { useState } from "react";
import {
  ConnectedAddressCard,
  OperationDetailsCard,
  OperationsLog,
  PublishCard,
  RelationOperationsCard,
  TripleOperationsCard,
} from "./_components";
import { Graph, Ipfs, Relation, Triple } from "@graphprotocol/grc-20";
import { useAccount, useWaitForTransactionReceipt } from "wagmi";
import { useTransactor } from "~~/hooks/scaffold-eth";

// Helper function to generate UUIDs
const generateID = () => {
  // Generate a random string similar to KG IDs (simplified version)
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < 22; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Note: The RELATION type is primarily for property definitions and not directly for Triple values
type ValueType = "TEXT" | "NUMBER" | "URL" | "TIME" | "POINT" | "CHECKBOX";

// Generate specific types of IDs
const generateEntityID = () => generateID();
const generateAttributeID = () => generateID();
const generateRelationTypeID = () => generateID();

const KnowledgeGraph = () => {
  const { address: connectedAddress } = useAccount();
  const [spaceId, setSpaceId] = useState("LB1JjNpxXBjP7caanTx3bP");
  const [operationName, setOperationName] = useState("");
  const [entityId, setEntityId] = useState("");
  const [attributeId, setAttributeId] = useState("");
  const [fromId, setFromId] = useState("");
  const [relationTypeId, setRelationTypeId] = useState("");
  const [toId, setToId] = useState("");
  const [relationId, setRelationId] = useState("");
  const [ops, setOps] = useState<any[]>([]);
  const [ipfsCid, setIpfsCid] = useState("");
  const [txData, setTxData] = useState<{ to: string; data: string } | null>(null);
  const [status, setStatus] = useState("");
  const [txHash, setTxHash] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("triple");
  const [activeStep, setActiveStep] = useState(1);

  const { data: txReceipt } = useWaitForTransactionReceipt({
    hash: txHash as `0x${string}` | undefined,
  });

  const transactor = useTransactor();

  const addOperation = (operation: any) => {
    setOps(prevOps => [...prevOps, operation]);
  };

  const publishToIPFS = async () => {
    if (!operationName) {
      setStatus("Operation name is required");
      return;
    }

    if (ops.length === 0) {
      setStatus("No operations to publish");
      return;
    }

    try {
      setStatus("Publishing to IPFS...");
      const result = await Ipfs.publishEdit({
        name: operationName,
        ops,
        author: connectedAddress || "0x0000000000000000000000000000000000000000",
      });
      setIpfsCid(result.cid);
      setStatus(`Published to IPFS: ${result.cid}`);
      setActiveStep(2);
    } catch (error) {
      console.error("Error publishing to IPFS:", error);
      setStatus(`Error publishing to IPFS: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const getCallData = async () => {
    if (!spaceId) {
      setStatus("Space ID is required");
      return;
    }

    try {
      setStatus("Getting call data...");
      const result = await fetch(`https://api-testnet.grc-20.thegraph.com/space/${spaceId}/edit/calldata`, {
        method: "POST",
        body: JSON.stringify({
          cid: ipfsCid,
          network: "TESTNET",
        }),
      });

      const data = await result.json();
      setTxData(data);
      setStatus("Call data ready");
      setActiveStep(3);
    } catch (error) {
      console.error("Error getting call data:", error);
      setStatus(`Error getting call data: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const sendTransaction = async () => {
    if (!txData) {
      setStatus("No transaction data available");
      return;
    }

    try {
      setStatus("Sending transaction...");

      // Use Scaffold-ETH 2's transactor to send the transaction
      const txHash = await transactor({
        to: txData.to,
        value: BigInt(0),
        data: txData.data as `0x${string}`,
      });

      if (txHash) {
        setTxHash(txHash);
        setStatus(`Transaction sent: ${txHash}`);
      } else {
        setStatus("Transaction was not sent");
      }
    } catch (error) {
      console.error("Error sending transaction:", error);
      setStatus(`Error sending transaction: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const clearOps = () => {
    setOps([]);
    setStatus("Operations cleared");
  };

  // Functions to handle ID generation
  const handleGenerateEntityID = () => {
    const id = generateEntityID();
    setEntityId(id);
    setStatus(`Generated Entity ID: ${id}`);
  };

  const handleGenerateAttributeID = () => {
    const id = generateAttributeID();
    setAttributeId(id);
    setStatus(`Generated Attribute ID: ${id}`);
  };

  const handleGenerateFromEntityID = () => {
    const id = generateEntityID();
    setFromId(id);
    setStatus(`Generated From Entity ID: ${id}`);
  };

  const handleGenerateToEntityID = () => {
    const id = generateEntityID();
    setToId(id);
    setStatus(`Generated To Entity ID: ${id}`);
  };

  const handleGenerateRelationTypeID = () => {
    const id = generateRelationTypeID();
    setRelationTypeId(id);
    setStatus(`Generated Relation Type ID: ${id}`);
  };

  const handleGenerateRelationID = () => {
    const id = generateID();
    setRelationId(id);
    setStatus(`Generated Relation ID: ${id}`);
  };

  return (
    <div className="flex flex-col min-h-screen pb-12">
      <div className="px-4 lg:px-8 py-4">
        <h1 className="text-3xl font-bold mb-6">Knowledge Graph Builder</h1>
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-secondary text-white p-4 shadow-xl">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-center text-3xl md:text-4xl font-bold mb-2">Knowledge Graph</h1>
            <p className="text-center text-sm md:text-base opacity-90">
              Build, Publish, and Write to Your Knowledge Space
            </p>
          </div>
        </div>

        {/* Connected Address Card */}
        <ConnectedAddressCard connectedAddress={connectedAddress} spaceId={spaceId} setSpaceId={setSpaceId} />

        {/* Main Content */}
        <div className="container mx-auto p-4 pb-20">
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
          <div className="tabs tabs-boxed mb-4 justify-center">
            <button
              className={`tab ${activeTab === "triple" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("triple")}
            >
              Triple Operations
            </button>
            <button
              className={`tab ${activeTab === "relation" ? "tab-active" : ""}`}
              onClick={() => setActiveTab("relation")}
            >
              Relation Operations
            </button>
          </div>

          {/* Triple Operations */}
          {activeTab === "triple" && (
            <TripleOperationsCard
              entityId={entityId}
              attributeId={attributeId}
              addOperation={addOperation}
              setStatus={setStatus}
              handleGenerateEntityID={handleGenerateEntityID}
              handleGenerateAttributeID={handleGenerateAttributeID}
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

          {/* Operations Log */}
          <OperationsLog ops={ops} clearOps={clearOps} />

          {/* Action Card */}
          <PublishCard
            ipfsCid={ipfsCid}
            txData={txData}
            txHash={txHash}
            txReceipt={txReceipt}
            activeStep={activeStep}
            publishToIPFS={publishToIPFS}
            getCallData={getCallData}
            sendTransaction={sendTransaction}
            ops={ops}
            operationName={operationName}
            spaceId={spaceId}
          />

          {/* Help Card */}
          <div className="card bg-base-100 shadow-xl mb-8">
            <div className="card-body">
              <h2 className="card-title">
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
                About IDs
              </h2>
              <div className="divider my-1"></div>
              <div className="space-y-2 text-sm opacity-80">
                <p>
                  <span className="font-bold">Entity IDs</span> - Unique identifiers for entities in your knowledge
                  graph.
                </p>
                <p>
                  <span className="font-bold">Attribute IDs</span> - Identifiers for properties that can be attached to
                  entities.
                </p>
                <p>
                  <span className="font-bold">Relation Type IDs</span> - Identifiers for types of relationships between
                  entities.
                </p>
                <p className="italic">
                  Note: You can generate random IDs using the Generate buttons, or use existing IDs from your knowledge
                  graph.
                </p>
              </div>
              <div className="divider my-1"></div>
              <div className="mt-2">
                <details className="collapse collapse-arrow bg-base-200">
                  <summary className="collapse-title text-sm font-medium">Common ID Patterns and Examples</summary>
                  <div className="collapse-content">
                    <ul className="list-disc pl-5 space-y-1 text-xs">
                      <li>
                        <span className="font-mono bg-base-300 px-1 rounded">A9QizqoXSqjfPUBjLoPJa2</span> - Entity ID
                      </li>
                      <li>
                        <span className="font-mono bg-base-300 px-1 rounded">GpnQE6H64aSfIE2ZRqBNZf</span> - Attribute
                        ID
                      </li>
                      <li>
                        <span className="font-mono bg-base-300 px-1 rounded">Cs3KPlZHREpMZLkXPb2nsU</span> - Relation
                        Type ID
                      </li>
                    </ul>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Status Footer */}
      <div className="fixed bottom-0 left-0 w-full bg-gradient-to-br from-primary to-secondary text-white py-2 px-4 shadow-lg z-50">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-xs opacity-80">Status:</span>
            <span className="ml-2 text-sm font-medium">{status || "Ready"}</span>
          </div>
          <div className="badge badge-neutral text-xs font-medium">{ops.length || 0} ops</div>
        </div>
      </div>
    </div>
  );
};

export default KnowledgeGraph;
