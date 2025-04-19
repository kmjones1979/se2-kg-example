import { useState } from "react";
import { useGraphIds } from "./useGraphIds";
import { useGraphOperations } from "./useGraphOperations";
import { Graph, Triple, ValueType } from "@graphprotocol/grc-20";

interface Entity {
  id: string;
  attributes: {
    [attributeId: string]: {
      type: ValueType;
      value: string;
    };
  };
  meta: {
    createdAt: number;
    isNew?: boolean; // Newly created in this session
  };
}

type AttributeInput = {
  name: string;
  type: ValueType;
  value: string;
};

/**
 * Hook for creating and managing graph entities with their attributes
 *
 * @returns Functions and state for creating and managing entities
 */
export const useGraphEntities = () => {
  const [entities, setEntities] = useState<Record<string, Entity>>({});
  const { addTriple, removeTriple } = useGraphOperations();
  const { generateEntityId, generateAttributeId } = useGraphIds();

  /**
   * Create a new entity with attributes
   */
  const createEntity = (
    entityName: string,
    attributes: AttributeInput[] = [],
  ): { entityId: string; operations: any[] } => {
    const entityId = generateEntityId();
    const operations: any[] = [];
    const entityAttributes: Record<string, { type: ValueType; value: string }> = {};

    // Add name attribute by default
    const nameAttributeId = generateAttributeId();
    const nameTriple = Triple.make({
      entityId,
      attributeId: nameAttributeId,
      value: {
        type: "TEXT",
        value: entityName,
      },
    });

    operations.push(nameTriple);
    entityAttributes[nameAttributeId] = { type: "TEXT", value: entityName };

    // Add additional attributes
    for (const attr of attributes) {
      const attributeId = generateAttributeId();
      const tripleOp = Triple.make({
        entityId,
        attributeId,
        value: {
          type: attr.type,
          value: attr.value,
        },
      });

      operations.push(tripleOp);
      entityAttributes[attributeId] = { type: attr.type, value: attr.value };
    }

    // Store entity in state
    const newEntity: Entity = {
      id: entityId,
      attributes: entityAttributes,
      meta: {
        createdAt: Date.now(),
        isNew: true,
      },
    };

    setEntities(prev => ({
      ...prev,
      [entityId]: newEntity,
    }));

    return { entityId, operations };
  };

  /**
   * Create a complete person entity with standard attributes
   */
  const createPersonEntity = (
    name: string,
    options: {
      age?: number;
      email?: string;
      location?: string;
      bio?: string;
    } = {},
  ): { entityId: string; operations: any[] } => {
    const attributes: AttributeInput[] = [];

    if (options.age !== undefined) {
      attributes.push({
        name: "age",
        type: "NUMBER",
        value: options.age.toString(),
      });
    }

    if (options.email) {
      attributes.push({
        name: "email",
        type: "TEXT",
        value: options.email,
      });
    }

    if (options.location) {
      attributes.push({
        name: "location",
        type: "TEXT",
        value: options.location,
      });
    }

    if (options.bio) {
      attributes.push({
        name: "bio",
        type: "TEXT",
        value: options.bio,
      });
    }

    return createEntity(name, attributes);
  };

  /**
   * Add an attribute to an existing entity
   */
  const addEntityAttribute = (
    entityId: string,
    attributeName: string,
    value: { type: ValueType; value: string },
  ): { attributeId: string; operation: any } | null => {
    if (!entityId) return null;

    const attributeId = generateAttributeId();
    const operation = addTriple(entityId, attributeId, value);

    if (operation && entities[entityId]) {
      // Update entity in state
      setEntities(prev => ({
        ...prev,
        [entityId]: {
          ...prev[entityId],
          attributes: {
            ...prev[entityId].attributes,
            [attributeId]: value,
          },
        },
      }));

      return { attributeId, operation };
    }

    return null;
  };

  /**
   * Remove an attribute from an entity
   */
  const removeEntityAttribute = (entityId: string, attributeId: string): any | null => {
    if (!entityId || !attributeId) return null;

    const operation = removeTriple(entityId, attributeId);

    if (operation && entities[entityId]) {
      // Update entity in state
      setEntities(prev => {
        const updatedEntity = { ...prev[entityId] };
        const { [attributeId]: _, ...remainingAttributes } = updatedEntity.attributes;
        updatedEntity.attributes = remainingAttributes;

        return {
          ...prev,
          [entityId]: updatedEntity,
        };
      });

      return operation;
    }

    return null;
  };

  /**
   * Create an entity from the Graph SDK
   */
  const createEntityFromSdk = (name: string, properties: Record<string, any> = {}): { id: string; ops: any[] } => {
    return Graph.createEntity({
      name,
      properties,
    });
  };

  return {
    // Entity state
    entities,
    entitiesCount: Object.keys(entities).length,

    // Entity creation and management
    createEntity,
    createPersonEntity,
    addEntityAttribute,
    removeEntityAttribute,

    // Advanced SDK functions
    createEntityFromSdk,

    // Utility functions
    getEntity: (id: string) => entities[id] || null,
    clearEntities: () => setEntities({}),
  };
};
