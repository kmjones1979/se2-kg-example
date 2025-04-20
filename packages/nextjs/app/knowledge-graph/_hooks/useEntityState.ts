import { useCallback, useState } from "react";
import { useOperationsLog } from "./useOperationsLog";
import { Relation, ValueType as SDKValueType, Triple } from "@graphprotocol/grc-20";

// SDK value types: "TEXT" | "NUMBER" | "URL" | "TIME" | "POINT" | "CHECKBOX"
// Extended with UI-specific types
export type UIValueType = SDKValueType | "RELATION";

export interface Entity {
  id: string;
  attributes: Record<
    string,
    {
      attributeId: string;
      type: UIValueType;
      value: any;
    }
  >;
  name?: string;
}

export interface EntityRelation {
  id: string;
  fromEntityId: string;
  toEntityId: string;
  relationTypeId: string;
  name?: string;
}

/**
 * Convert UI value type to SDK value type if needed
 */
const convertToSDKValueType = (type: UIValueType): SDKValueType => {
  // If it's a RELATION, convert to TEXT for SDK compatibility
  return type === "RELATION" ? "TEXT" : type;
};

/**
 * Hook for managing entities and relations
 * @returns Methods and state for managing entities and relations
 */
export const useEntityState = () => {
  const [entities, setEntities] = useState<Record<string, Entity>>({});
  const [relations, setRelations] = useState<Record<string, EntityRelation>>({});
  const { trackOperation } = useOperationsLog();

  /**
   * Create or update an entity
   * @param entityId Unique entity ID
   * @param name Optional name for the entity (for UI display)
   * @returns The entity object
   */
  const createEntity = useCallback(
    (entityId: string, name?: string): Entity => {
      const entity: Entity = entities[entityId] || {
        id: entityId,
        attributes: {},
        name,
      };

      if (name && !entity.name) {
        entity.name = name;
      }

      setEntities(prev => ({
        ...prev,
        [entityId]: entity,
      }));

      return entity;
    },
    [entities],
  );

  /**
   * Add an attribute to an entity
   * @param entityId Entity ID
   * @param attributeId Attribute ID
   * @param type Value type (TEXT, NUMBER, etc.)
   * @param value Attribute value
   * @param attributeName Optional name for the attribute (for UI display)
   * @returns The updated entity
   */
  const addEntityAttribute = useCallback(
    (entityId: string, attributeId: string, type: UIValueType, value: any, attributeName?: string) => {
      // Create entity if it doesn't exist
      const entity = createEntity(entityId);

      // Convert UI value type to SDK value type if needed
      const sdkValueType = convertToSDKValueType(type);

      // Create triple operation
      const tripleOp = Triple.make({
        entityId,
        attributeId,
        value: {
          type: sdkValueType,
          value: String(value),
        },
      });

      // Track the operation
      trackOperation({
        type: "TRIPLE",
        data: tripleOp,
      });

      // Update local state
      const updatedEntity = {
        ...entity,
        attributes: {
          ...entity.attributes,
          [attributeId]: {
            attributeId,
            type,
            value,
            name: attributeName,
          },
        },
      };

      setEntities(prev => ({
        ...prev,
        [entityId]: updatedEntity,
      }));

      return updatedEntity;
    },
    [createEntity, trackOperation],
  );

  /**
   * Create a relation between two entities
   * @param fromEntityId Source entity ID
   * @param relationTypeId Type of relation
   * @param toEntityId Target entity ID
   * @param relationId Optional specific relation ID
   * @param relationName Optional name for the relation (for UI display)
   * @returns The created relation
   */
  const createRelation = useCallback(
    (fromEntityId: string, relationTypeId: string, toEntityId: string, relationId?: string, relationName?: string) => {
      // Prepare relation data
      const relationData: any = {
        fromId: fromEntityId,
        relationTypeId,
        toId: toEntityId,
      };

      // Add id if provided
      if (relationId) {
        relationData.id = relationId;
      }

      // Create relation operation
      const relationOp = Relation.make(relationData);

      // Generate a deterministic ID if none is provided
      const actualRelationId = relationId || `${fromEntityId}_${relationTypeId}_${toEntityId}`;

      // Track the operation
      trackOperation({
        type: "RELATION",
        data: relationOp,
      });

      // Update local state
      const relation: EntityRelation = {
        id: actualRelationId,
        fromEntityId,
        toEntityId,
        relationTypeId,
        name: relationName,
      };

      setRelations(prev => ({
        ...prev,
        [actualRelationId]: relation,
      }));

      return relation;
    },
    [trackOperation],
  );

  /**
   * Remove a relation
   * @param relationId ID of the relation to remove
   */
  const removeRelation = useCallback(
    (relationId: string) => {
      // Create relation removal operation
      const removeOp = Relation.remove(relationId);

      // Track the operation
      trackOperation({
        type: "RELATION",
        data: removeOp,
      });

      // Update local state
      setRelations(prev => {
        const updated = { ...prev };
        delete updated[relationId];
        return updated;
      });
    },
    [trackOperation],
  );

  /**
   * Get an entity by ID
   * @param entityId Entity ID to look up
   * @returns Entity object or undefined if not found
   */
  const getEntity = useCallback(
    (entityId: string) => {
      return entities[entityId];
    },
    [entities],
  );

  /**
   * Get a relation by ID
   * @param relationId Relation ID to look up
   * @returns Relation object or undefined if not found
   */
  const getRelation = useCallback(
    (relationId: string) => {
      return relations[relationId];
    },
    [relations],
  );

  /**
   * Get all relations for an entity
   * @param entityId Entity ID to get relations for
   * @param direction "from" (outgoing), "to" (incoming), or "both"
   * @returns Array of relations
   */
  const getEntityRelations = useCallback(
    (entityId: string, direction: "from" | "to" | "both" = "both") => {
      return Object.values(relations).filter(rel => {
        if (direction === "from") return rel.fromEntityId === entityId;
        if (direction === "to") return rel.toEntityId === entityId;
        return rel.fromEntityId === entityId || rel.toEntityId === entityId;
      });
    },
    [relations],
  );

  return {
    entities: Object.values(entities),
    relations: Object.values(relations),
    createEntity,
    addEntityAttribute,
    createRelation,
    removeRelation,
    getEntity,
    getRelation,
    getEntityRelations,
  };
};
