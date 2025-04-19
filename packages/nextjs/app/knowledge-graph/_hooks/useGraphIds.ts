import { useState } from "react";
import { Id } from "@graphprotocol/grc-20";

/**
 * Hook for managing ID generation and caching for knowledge graph entities.
 *
 * @returns Functions and state for generating and tracking IDs
 */
export const useGraphIds = () => {
  const [entityIds, setEntityIds] = useState<string[]>([]);
  const [attributeIds, setAttributeIds] = useState<string[]>([]);
  const [relationTypeIds, setRelationTypeIds] = useState<string[]>([]);
  const [relationIds, setRelationIds] = useState<string[]>([]);

  /**
   * Generates a new entity ID and adds it to the tracking state
   */
  const generateEntityId = (): string => {
    const id = Id.generate();
    setEntityIds(prev => [...prev, id]);
    return id;
  };

  /**
   * Generates a new attribute ID and adds it to the tracking state
   */
  const generateAttributeId = (): string => {
    const id = Id.generate();
    setAttributeIds(prev => [...prev, id]);
    return id;
  };

  /**
   * Generates a new relation type ID and adds it to the tracking state
   */
  const generateRelationTypeId = (): string => {
    const id = Id.generate();
    setRelationTypeIds(prev => [...prev, id]);
    return id;
  };

  /**
   * Generates a new relation ID and adds it to the tracking state
   */
  const generateRelationId = (): string => {
    const id = Id.generate();
    setRelationIds(prev => [...prev, id]);
    return id;
  };

  /**
   * Generates a generic ID without tracking
   */
  const generateId = (): string => {
    return Id.generate();
  };

  return {
    // Generation functions
    generateEntityId,
    generateAttributeId,
    generateRelationTypeId,
    generateRelationId,
    generateId,

    // ID history/tracking
    entityIds,
    attributeIds,
    relationTypeIds,
    relationIds,

    // Utility functions for ID lists
    clearEntityIds: () => setEntityIds([]),
    clearAttributeIds: () => setAttributeIds([]),
    clearRelationTypeIds: () => setRelationTypeIds([]),
    clearRelationIds: () => setRelationIds([]),
    clearAllIds: () => {
      setEntityIds([]);
      setAttributeIds([]);
      setRelationTypeIds([]);
      setRelationIds([]);
    },
  };
};
