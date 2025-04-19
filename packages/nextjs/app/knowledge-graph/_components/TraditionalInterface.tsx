import { ReactNode } from "react";
import {
  ConnectedAddressCard,
  ExpandableCard,
  IdHelpCard,
  KnowledgeGraphHelp,
  OperationDetailsCard,
  OperationsLog,
  OperationsTabCard,
  PublishCard,
} from ".";

interface TraditionalInterfaceProps {
  connectedAddress?: string;
  spaceId: string;
  setSpaceId: (value: string) => void;
  operationName: string;
  setOperationName: (value: string) => void;
  entityProps: {
    entityId: string;
    attributeId: string;
    fromId: string;
    relationTypeId: string;
    toId: string;
    relationId: string;
    handleGenerateEntityID: () => void;
    handleGenerateAttributeID: () => void;
    handleGenerateFromEntityID: () => void;
    handleGenerateRelationTypeID: () => void;
    handleGenerateToEntityID: () => void;
    handleGenerateRelationID: () => void;
  };
  operations: {
    addOperation: (op: any) => void;
    clearOperations: () => void;
    getRawOperations: () => any[];
    setStatus: (status: string) => void;
  };
  publishing: {
    ipfsCid: string;
    txData?: { to: string; data: string } | null;
    txHash?: string | null;
    txReceipt?: any;
    activeStep: number;
    publishToIPFS: () => void;
    getCallData: () => void;
    sendTransaction: () => void;
  };
}

/**
 * The traditional interface for the Knowledge Graph application
 */
export const TraditionalInterface = ({
  connectedAddress,
  spaceId,
  setSpaceId,
  operationName,
  setOperationName,
  entityProps,
  operations,
  publishing,
}: TraditionalInterfaceProps) => {
  // Build the steps
  const renderSteps = () => (
    <ul className="steps w-full mb-8">
      <li className={`step ${publishing.activeStep >= 1 ? "step-primary" : ""}`}>Create Operations</li>
      <li className={`step ${publishing.activeStep >= 2 ? "step-primary" : ""}`}>Publish to IPFS</li>
      <li className={`step ${publishing.activeStep >= 3 ? "step-primary" : ""}`}>Get Transaction Data</li>
      <li className={`step ${publishing.activeStep >= 4 ? "step-primary" : ""}`}>Send Transaction</li>
    </ul>
  );

  return (
    <>
      {/* Connected Address Card */}
      <ConnectedAddressCard connectedAddress={connectedAddress} spaceId={spaceId} setSpaceId={setSpaceId} />

      {/* Steps */}
      {renderSteps()}

      {/* Operation Name */}
      <OperationDetailsCard operationName={operationName} setOperationName={setOperationName} />

      {/* Tabs for Triple/Relation Operations */}
      <OperationsTabCard
        entityId={entityProps.entityId}
        attributeId={entityProps.attributeId}
        fromId={entityProps.fromId}
        relationTypeId={entityProps.relationTypeId}
        toId={entityProps.toId}
        relationId={entityProps.relationId}
        addOperation={operations.addOperation}
        setStatus={operations.setStatus}
        handleGenerateEntityID={entityProps.handleGenerateEntityID}
        handleGenerateAttributeID={entityProps.handleGenerateAttributeID}
        handleGenerateFromEntityID={entityProps.handleGenerateFromEntityID}
        handleGenerateRelationTypeID={entityProps.handleGenerateRelationTypeID}
        handleGenerateToEntityID={entityProps.handleGenerateToEntityID}
        handleGenerateRelationID={entityProps.handleGenerateRelationID}
      />

      {/* Operations Log in Expandable Card */}
      <ExpandableCard title="Operations Log" defaultExpanded={true}>
        <OperationsLog ops={operations.getRawOperations()} clearOps={operations.clearOperations} />
      </ExpandableCard>

      {/* Action Card in Expandable Card */}
      <ExpandableCard title="Publishing Actions" defaultExpanded={true}>
        <PublishCard
          ipfsCid={publishing.ipfsCid}
          txData={publishing.txData || null}
          txHash={publishing.txHash || null}
          txReceipt={publishing.txReceipt}
          activeStep={publishing.activeStep}
          publishToIPFS={publishing.publishToIPFS}
          getCallData={publishing.getCallData}
          sendTransaction={publishing.sendTransaction}
          ops={operations.getRawOperations()}
          operationName={operationName}
          spaceId={spaceId}
        />
      </ExpandableCard>

      {/* Help Cards */}
      <IdHelpCard />
      <KnowledgeGraphHelp />
    </>
  );
};
