import { useState } from "react";
import { useGraphIds } from "./useGraphIds";

interface IdStateOptions {
  onGenerateId?: (id: string, type: string) => void;
}

/**
 * Hook for managing entity ID states with generation and notifications
 *
 * Encapsulates all ID state management for the application
 */
export const useEntityIdState = (options?: IdStateOptions) => {
  // ID states
  const [entityId, setEntityId] = useState("");
  const [attributeId, setAttributeId] = useState("");
  const [fromId, setFromId] = useState("");
  const [relationTypeId, setRelationTypeId] = useState("");
  const [toId, setToId] = useState("");
  const [relationId, setRelationId] = useState("");

  // Use the base ID generation hook
  const { generateEntityId, generateAttributeId, generateRelationTypeId, generateId } = useGraphIds();

  // Handle notifications
  const notifyIdGenerated = (id: string, type: string) => {
    if (options?.onGenerateId) {
      options.onGenerateId(id, type);
    }
  };

  // Functions to handle ID generation
  const handleGenerateEntityID = () => {
    const id = generateEntityId();
    setEntityId(id);
    notifyIdGenerated(id, "Entity ID");
    return id;
  };

  const handleGenerateAttributeID = () => {
    const id = generateAttributeId();
    setAttributeId(id);
    notifyIdGenerated(id, "Attribute ID");
    return id;
  };

  const handleGenerateFromEntityID = () => {
    const id = generateEntityId();
    setFromId(id);
    notifyIdGenerated(id, "From Entity ID");
    return id;
  };

  const handleGenerateToEntityID = () => {
    const id = generateEntityId();
    setToId(id);
    notifyIdGenerated(id, "To Entity ID");
    return id;
  };

  const handleGenerateRelationTypeID = () => {
    const id = generateRelationTypeId();
    setRelationTypeId(id);
    notifyIdGenerated(id, "Relation Type ID");
    return id;
  };

  const handleGenerateRelationID = () => {
    const id = generateId();
    setRelationId(id);
    notifyIdGenerated(id, "Relation ID");
    return id;
  };

  // Reset all ID states
  const resetAllIds = () => {
    setEntityId("");
    setAttributeId("");
    setFromId("");
    setRelationTypeId("");
    setToId("");
    setRelationId("");
  };

  return {
    // ID states
    entityId,
    attributeId,
    fromId,
    relationTypeId,
    toId,
    relationId,

    // Setters
    setEntityId,
    setAttributeId,
    setFromId,
    setRelationTypeId,
    setToId,
    setRelationId,

    // Generation handlers
    handleGenerateEntityID,
    handleGenerateAttributeID,
    handleGenerateFromEntityID,
    handleGenerateToEntityID,
    handleGenerateRelationTypeID,
    handleGenerateRelationID,

    // Utility functions
    resetAllIds,
  };
};
