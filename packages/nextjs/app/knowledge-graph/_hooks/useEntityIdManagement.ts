import { useCallback, useState } from "react";
import { useGraphIds } from "./useGraphIds";

interface EntityIds {
  entityId: string;
  attributeId: string;
  fromEntityId: string;
  toEntityId: string;
  relationTypeId: string;
  relationId: string;
}

/**
 * Hook for managing entity IDs and related operations
 * Simplifies the generation and tracking of various ID types
 */
export const useEntityIdManagement = (onStatusUpdate?: (status: string) => void) => {
  // Entity ID states
  const [entityId, setEntityId] = useState("");
  const [attributeId, setAttributeId] = useState("");
  const [fromEntityId, setFromEntityId] = useState("");
  const [toEntityId, setToEntityId] = useState("");
  const [relationTypeId, setRelationTypeId] = useState("");
  const [relationId, setRelationId] = useState("");

  // Use the base ID generation hooks
  const { generateEntityId, generateAttributeId, generateRelationTypeId, generateId } = useGraphIds();

  // Helper for status updates
  const updateStatus = useCallback(
    (status: string) => {
      if (onStatusUpdate) {
        onStatusUpdate(status);
      }
    },
    [onStatusUpdate],
  );

  // Entity ID generation with status updates
  const generateEntityIdWithStatus = useCallback(() => {
    const id = generateEntityId();
    setEntityId(id);
    updateStatus(`Generated Entity ID: ${id}`);
    return id;
  }, [generateEntityId, updateStatus]);

  // Attribute ID generation with status updates
  const generateAttributeIdWithStatus = useCallback(() => {
    const id = generateAttributeId();
    setAttributeId(id);
    updateStatus(`Generated Attribute ID: ${id}`);
    return id;
  }, [generateAttributeId, updateStatus]);

  // "From" Entity ID generation with status updates
  const generateFromEntityIdWithStatus = useCallback(() => {
    const id = generateEntityId();
    setFromEntityId(id);
    updateStatus(`Generated From Entity ID: ${id}`);
    return id;
  }, [generateEntityId, updateStatus]);

  // "To" Entity ID generation with status updates
  const generateToEntityIdWithStatus = useCallback(() => {
    const id = generateEntityId();
    setToEntityId(id);
    updateStatus(`Generated To Entity ID: ${id}`);
    return id;
  }, [generateEntityId, updateStatus]);

  // Relation Type ID generation with status updates
  const generateRelationTypeIdWithStatus = useCallback(() => {
    const id = generateRelationTypeId();
    setRelationTypeId(id);
    updateStatus(`Generated Relation Type ID: ${id}`);
    return id;
  }, [generateRelationTypeId, updateStatus]);

  // Relation ID generation with status updates
  const generateRelationIdWithStatus = useCallback(() => {
    const id = generateId();
    setRelationId(id);
    updateStatus(`Generated Relation ID: ${id}`);
    return id;
  }, [generateId, updateStatus]);

  // Generate all IDs at once with a common prefix (useful for testing)
  const generateRelatedIds = useCallback(
    (prefix?: string) => {
      const timestamp = Date.now().toString(36);
      const commonPrefix = prefix || `gen-${timestamp}`;

      const entity = generateEntityId();
      const attribute = generateAttributeId();
      const from = generateEntityId();
      const to = generateEntityId();
      const relationType = generateRelationTypeId();
      const relation = generateId();

      setEntityId(entity);
      setAttributeId(attribute);
      setFromEntityId(from);
      setToEntityId(to);
      setRelationTypeId(relationType);
      setRelationId(relation);

      updateStatus(`Generated complete set of related IDs with prefix: ${commonPrefix}`);

      return {
        entityId: entity,
        attributeId: attribute,
        fromEntityId: from,
        toEntityId: to,
        relationTypeId: relationType,
        relationId: relation,
      };
    },
    [generateEntityId, generateAttributeId, generateRelationTypeId, generateId, updateStatus],
  );

  // Reset all IDs
  const resetAllIds = useCallback(() => {
    setEntityId("");
    setAttributeId("");
    setFromEntityId("");
    setToEntityId("");
    setRelationTypeId("");
    setRelationId("");
    updateStatus("Reset all entity IDs");
  }, [updateStatus]);

  return {
    // Current ID values
    ids: {
      entityId,
      attributeId,
      fromEntityId,
      toEntityId,
      relationTypeId,
      relationId,
    },

    // Setters for manual updates
    setEntityId,
    setAttributeId,
    setFromEntityId,
    setToEntityId,
    setRelationTypeId,
    setRelationId,

    // ID generation with status updates
    generateEntityId: generateEntityIdWithStatus,
    generateAttributeId: generateAttributeIdWithStatus,
    generateFromEntityId: generateFromEntityIdWithStatus,
    generateToEntityId: generateToEntityIdWithStatus,
    generateRelationTypeId: generateRelationTypeIdWithStatus,
    generateRelationId: generateRelationIdWithStatus,

    // Utility functions
    generateRelatedIds,
    resetAllIds,
  };
};
