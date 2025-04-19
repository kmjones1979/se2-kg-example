import { useState } from "react";
import { ExpandableCard } from "./ExpandableCard";
import { RelationOperationsCard } from "./RelationOperationsCard";
import { TripleOperationsCard } from "./TripleOperationsCard";

interface OperationsTabCardProps {
  entityId: string;
  attributeId: string;
  fromId: string;
  relationTypeId: string;
  toId: string;
  relationId: string;
  addOperation: (op: any) => void;
  setStatus: (status: string) => void;
  handleGenerateEntityID: () => void;
  handleGenerateAttributeID: () => void;
  handleGenerateFromEntityID: () => void;
  handleGenerateRelationTypeID: () => void;
  handleGenerateToEntityID: () => void;
  handleGenerateRelationID: () => void;
  defaultExpanded?: boolean;
}

/**
 * Component that provides tabbed access to Triple and Relation operations
 */
export const OperationsTabCard = ({
  entityId,
  attributeId,
  fromId,
  relationTypeId,
  toId,
  relationId,
  addOperation,
  setStatus,
  handleGenerateEntityID,
  handleGenerateAttributeID,
  handleGenerateFromEntityID,
  handleGenerateRelationTypeID,
  handleGenerateToEntityID,
  handleGenerateRelationID,
  defaultExpanded = true,
}: OperationsTabCardProps) => {
  const [activeTab, setActiveTab] = useState("triple");

  // Custom title with tabs
  const tabTitle = (
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
  );

  return (
    <ExpandableCard title={tabTitle} defaultExpanded={defaultExpanded}>
      {activeTab === "triple" ? (
        <TripleOperationsCard
          entityId={entityId}
          attributeId={attributeId}
          addOperation={addOperation}
          setStatus={setStatus}
          handleGenerateEntityID={handleGenerateEntityID}
          handleGenerateAttributeID={handleGenerateAttributeID}
          useCustomHooks={true}
        />
      ) : (
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
    </ExpandableCard>
  );
};
