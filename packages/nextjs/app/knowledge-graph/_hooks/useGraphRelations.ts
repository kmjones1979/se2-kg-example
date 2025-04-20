import { useState } from "react";
import { useGraphIds } from "./useGraphIds";
import { useGraphOperations } from "./useGraphOperations";
import { Relation } from "@graphprotocol/grc-20";

interface RelationData {
  id: string;
  fromId: string;
  toId: string;
  typeId: string;
  typeName?: string;
  meta: {
    createdAt: number;
    isNew?: boolean;
  };
}

/**
 * Hook for creating and managing relations between entities in the knowledge graph
 *
 * @returns Functions and state for creating and managing relations
 */
export const useGraphRelations = () => {
  const [relations, setRelations] = useState<Record<string, RelationData>>({});
  const { addRelation, removeRelation } = useGraphOperations();
  const { generateRelationId, generateRelationTypeId } = useGraphIds();

  /**
   * Create a new relation between two entities
   */
  const createRelation = (
    fromId: string,
    relationTypeName: string,
    toId: string,
  ): { relationId: string; typeId: string; operation: any } | null => {
    if (!fromId || !toId) return null;

    const relationId = generateRelationId();
    const relationTypeId = generateRelationTypeId();

    const operation = addRelation(fromId, relationTypeId, toId, relationId);

    if (operation) {
      // Store relation in state
      const newRelation: RelationData = {
        id: relationId,
        fromId,
        toId,
        typeId: relationTypeId,
        typeName: relationTypeName,
        meta: {
          createdAt: Date.now(),
          isNew: true,
        },
      };

      setRelations(prev => ({
        ...prev,
        [relationId]: newRelation,
      }));

      return { relationId, typeId: relationTypeId, operation };
    }

    return null;
  };

  /**
   * Remove an existing relation
   */
  const deleteRelation = (relationId: string): any | null => {
    if (!relationId || !relations[relationId]) return null;

    const operation = removeRelation(relationId);

    if (operation) {
      // Remove relation from state
      setRelations(prev => {
        const { [relationId]: _, ...rest } = prev;
        return rest;
      });

      return operation;
    }

    return null;
  };

  /**
   * Create a standard "likes" relation between two entities
   */
  const createLikesRelation = (
    personId: string,
    thingId: string,
  ): { relationId: string; typeId: string; operation: any } | null => {
    return createRelation(personId, "likes", thingId);
  };

  /**
   * Create a standard "owns" relation between two entities
   */
  const createOwnsRelation = (
    ownerId: string,
    ownedId: string,
  ): { relationId: string; typeId: string; operation: any } | null => {
    return createRelation(ownerId, "owns", ownedId);
  };

  /**
   * Create a relation using the Graph SDK
   */
  const createRelationFromSdk = (fromId: string, relationName: string, toId: string): any => {
    return Relation.make({
      fromId,
      relationTypeId: relationName,
      toId,
    });
  };

  return {
    // Relation state
    relations,
    relationsCount: Object.keys(relations).length,

    // Relation creation and management
    createRelation,
    deleteRelation,

    // Specialized relation creators
    createLikesRelation,
    createOwnsRelation,

    // Advanced SDK functions
    createRelationFromSdk,

    // Utility functions
    getRelation: (id: string) => relations[id] || null,
    getRelationsForEntity: (entityId: string) =>
      Object.values(relations).filter(r => r.fromId === entityId || r.toId === entityId),
    clearRelations: () => setRelations({}),
  };
};
