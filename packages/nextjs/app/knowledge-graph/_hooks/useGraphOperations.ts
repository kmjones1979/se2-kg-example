import { useState } from "react";
import { Relation, Triple, ValueType } from "@graphprotocol/grc-20";

type OperationType = "triple" | "relation";
type OperationAction = "add" | "remove";

interface Operation {
  type: OperationType;
  action: OperationAction;
  data: any;
  timestamp: number;
  id: string;
}

/**
 * Hook for managing knowledge graph operations (triples and relations)
 *
 * @returns Functions and state for creating, tracking, and managing graph operations
 */
export const useGraphOperations = () => {
  const [operations, setOperations] = useState<Operation[]>([]);
  const [lastStatus, setLastStatus] = useState<string>("");

  /**
   * Create a triple operation for adding an entity-attribute-value
   */
  const addTriple = (
    entityId: string,
    attributeId: string,
    value: {
      type: ValueType;
      value: string;
    },
  ) => {
    if (!entityId || !attributeId) {
      setLastStatus("Entity ID and Attribute ID are required");
      return null;
    }

    try {
      const tripleOp = Triple.make({
        entityId,
        attributeId,
        value,
      });

      const newOperation: Operation = {
        type: "triple",
        action: "add",
        data: tripleOp,
        timestamp: Date.now(),
        id: `triple-${entityId}-${attributeId}-${Date.now()}`,
      };

      setOperations(prev => [...prev, newOperation]);
      setLastStatus(`Added Triple: ${entityId}.${attributeId} = ${value.value}`);
      return tripleOp;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setLastStatus(`Error creating triple: ${errorMessage}`);
      return null;
    }
  };

  /**
   * Create a triple operation for removing an entity-attribute pair
   */
  const removeTriple = (entityId: string, attributeId: string) => {
    if (!entityId || !attributeId) {
      setLastStatus("Entity ID and Attribute ID are required");
      return null;
    }

    try {
      const tripleOp = Triple.remove({
        entityId,
        attributeId,
      });

      const newOperation: Operation = {
        type: "triple",
        action: "remove",
        data: tripleOp,
        timestamp: Date.now(),
        id: `triple-remove-${entityId}-${attributeId}-${Date.now()}`,
      };

      setOperations(prev => [...prev, newOperation]);
      setLastStatus(`Removed Triple: ${entityId}.${attributeId}`);
      return tripleOp;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setLastStatus(`Error removing triple: ${errorMessage}`);
      return null;
    }
  };

  /**
   * Create a relation operation for connecting two entities
   */
  const addRelation = (fromId: string, relationTypeId: string, toId: string, relationId?: string) => {
    if (!fromId || !relationTypeId || !toId) {
      setLastStatus("From ID, Relation Type ID, and To ID are required");
      return null;
    }

    try {
      // Create relation with or without custom ID based on SDK capabilities
      const params = {
        fromId,
        relationTypeId,
        toId,
      };

      // Note: Some SDK versions might not support custom relation IDs directly
      const relationOp = Relation.make(params);

      const newOperation: Operation = {
        type: "relation",
        action: "add",
        data: relationOp,
        timestamp: Date.now(),
        id: `relation-${fromId}-${relationTypeId}-${toId}-${Date.now()}`,
      };

      setOperations(prev => [...prev, newOperation]);
      setLastStatus(`Added Relation: ${fromId} → ${toId}`);
      return relationOp;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setLastStatus(`Error creating relation: ${errorMessage}`);
      return null;
    }
  };

  /**
   * Create a relation operation for removing a specific relation
   */
  const removeRelation = (relationId: string) => {
    if (!relationId) {
      setLastStatus("Relation ID is required");
      return null;
    }

    try {
      // SDK expects the relation ID directly, not as an object
      const relationOp = Relation.remove(relationId);

      const newOperation: Operation = {
        type: "relation",
        action: "remove",
        data: relationOp,
        timestamp: Date.now(),
        id: `relation-remove-${relationId}-${Date.now()}`,
      };

      setOperations(prev => [...prev, newOperation]);
      setLastStatus(`Removed Relation: ${relationId}`);
      return relationOp;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setLastStatus(`Error removing relation: ${errorMessage}`);
      return null;
    }
  };

  return {
    // Operations
    operations,
    operationsCount: operations.length,
    lastStatus,

    // Core operation functions
    addTriple,
    removeTriple,
    addRelation,
    removeRelation,

    // Utility functions
    clearOperations: () => {
      setOperations([]);
      setLastStatus("Operations cleared");
    },
    removeOperation: (id: string) => {
      setOperations(prev => prev.filter(op => op.id !== id));
      setLastStatus(`Operation ${id} removed`);
    },

    // Raw operation data for use with IPFS/transactions
    getRawOperations: () => operations.map(op => op.data),

    // Status management
    setStatus: setLastStatus,
  };
};
