import { ReactNode } from "react";
import { ExpandableCard, OperationDetailsCard, OperationsLog, OperationsTabCard, PublishCard } from ".";

interface TraditionalInterfaceProps {
  // Main props
  activeStep: number;
  operationName: string;
  setOperationName: (value: string) => void;

  // Entity IDs
  entityId: string;
  attributeId: string;
  fromId: string;
  relationTypeId: string;
  toId: string;
  relationId: string;

  // Handler functions
  handleGenerateEntityID: () => void;
  handleGenerateAttributeID: () => void;
  handleGenerateFromEntityID: () => void;
  handleGenerateRelationTypeID: () => void;
  handleGenerateToEntityID: () => void;
  handleGenerateRelationID: () => void;

  // Operations
  addOperation: (op: any) => void;
  directOperations: any[];
  wrappedClearOperations: () => void;
  setStatus: (status: string) => void;

  // Publishing
  ipfsCid: string;
  txData: { to: string; data: string } | null;
  txHash: string | null;
  txReceipt?: any;
  spaceId: string;
  publishToIPFS: () => void;
  getCallData: () => void;
  sendTransaction: () => void;
  getRawOperations: () => any[];
  publishToChain?: (operations: any[]) => Promise<string | `0x${string}` | null>;
}

/**
 * TraditionalInterface component encapsulates the traditional UI for knowledge graph operations
 */
export const TraditionalInterface = ({
  activeStep,
  operationName,
  setOperationName,
  entityId,
  attributeId,
  fromId,
  relationTypeId,
  toId,
  relationId,
  handleGenerateEntityID,
  handleGenerateAttributeID,
  handleGenerateFromEntityID,
  handleGenerateRelationTypeID,
  handleGenerateToEntityID,
  handleGenerateRelationID,
  addOperation,
  directOperations,
  wrappedClearOperations,
  setStatus,
  ipfsCid,
  txData,
  txHash,
  txReceipt,
  spaceId,
  publishToIPFS,
  getCallData,
  sendTransaction,
  getRawOperations,
  publishToChain,
}: TraditionalInterfaceProps) => {
  return (
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
      <OperationsTabCard
        entityId={entityId}
        attributeId={attributeId}
        fromId={fromId}
        relationTypeId={relationTypeId}
        toId={toId}
        relationId={relationId}
        addOperation={addOperation}
        setStatus={setStatus}
        handleGenerateEntityID={handleGenerateEntityID}
        handleGenerateAttributeID={handleGenerateAttributeID}
        handleGenerateFromEntityID={handleGenerateFromEntityID}
        handleGenerateRelationTypeID={handleGenerateRelationTypeID}
        handleGenerateToEntityID={handleGenerateToEntityID}
        handleGenerateRelationID={handleGenerateRelationID}
      />

      {/* Operations Log in Expandable Card */}
      <ExpandableCard title="Operations Log" defaultExpanded={true}>
        <OperationsLog ops={directOperations} clearOps={wrappedClearOperations} />
      </ExpandableCard>

      {/* Publishing Actions in Expandable Card */}
      <ExpandableCard title="Publishing Actions" defaultExpanded={true}>
        <PublishCard
          ipfsCid={ipfsCid}
          txData={txData}
          txHash={txHash}
          txReceipt={txReceipt}
          activeStep={activeStep}
          publishToIPFS={publishToIPFS}
          getCallData={getCallData}
          sendTransaction={sendTransaction}
          publishToChain={publishToChain}
          ops={directOperations}
          operationName={operationName}
          spaceId={spaceId}
        />
      </ExpandableCard>
    </>
  );
};
