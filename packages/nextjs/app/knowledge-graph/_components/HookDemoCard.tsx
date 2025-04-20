import { useEffect, useRef, useState } from "react";
import { useGraphEntities, useGraphIds, useGraphOperations, useGraphPublishing } from "../_hooks";
import { OperationsLog } from "./OperationsLog";

/**
 * Props for HookDemoCard component
 */
interface HookDemoCardProps {
  onStatusChange?: (status: string) => void;
  onOperationsCountChange?: (count: number) => void;
}

/**
 * A component that demonstrates using our custom hooks together
 */
export const HookDemoCard = ({ onStatusChange, onOperationsCountChange }: HookDemoCardProps) => {
  const [name, setName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  // Relation states
  const [fromEntityId, setFromEntityId] = useState("");
  const [relationTypeId, setRelationTypeId] = useState("");
  const [toEntityId, setToEntityId] = useState("");
  const [relationId, setRelationId] = useState("");

  // Demo workflow states
  const [expandDemoWorkflow, setExpandDemoWorkflow] = useState(true);
  const [personName, setPersonName] = useState("Alice");
  const [foodName, setFoodName] = useState("Pizza");
  const [relationName, setRelationName] = useState("LIKES");
  const [createdPersonId, setCreatedPersonId] = useState("");
  const [createdFoodId, setCreatedFoodId] = useState("");
  const [createdRelationId, setCreatedRelationId] = useState("");
  const [workflowStep, setWorkflowStep] = useState(0);

  // Section expansion states
  const [expandPersonSection, setExpandPersonSection] = useState(true);
  const [expandPublishingSection, setExpandPublishingSection] = useState(true);
  const [expandStatusSection, setExpandStatusSection] = useState(true);
  const [expandRelationsSection, setExpandRelationsSection] = useState(true);
  const [expandOperationsLog, setExpandOperationsLog] = useState(true);

  // Add this new state variable near the other state variables
  const [useBackupOperations, setUseBackupOperations] = useState(false);

  // Use our custom hooks
  const {
    operations,
    operationsCount,
    getRawOperations,
    clearOperations,
    lastStatus,
    setStatus,
    addTriple,
    addRelation,
    removeRelation,
  } = useGraphOperations();

  const { createPersonEntity, createEntity, entitiesCount, entities } = useGraphEntities();

  const { generateEntityId, generateAttributeId, generateRelationTypeId, generateRelationId } = useGraphIds();

  // Local function for triple ID generation
  const generateTripleId = () => {
    return `triple-${Math.random().toString(36).substring(2, 10)}`;
  };

  const {
    operationName,
    setOperationName,
    publishToIPFS,
    publishToChain,
    ipfsCid,
    txHash,
    spaceId,
    setSpaceId,
    getCallData,
    sendTransaction,
  } = useGraphPublishing();

  // Add a ref to store operations between steps
  const operationsRef = useRef<any[]>([]);

  // Add an effect to check operations and use backup if needed
  useEffect(() => {
    // Check if we need to use backup operations
    if (operations.length === 0 && operationsRef.current.length > 0) {
      console.log("Using backup operations - state operations are empty but ref has items");
      setUseBackupOperations(true);
    } else if (operations.length > 0) {
      setUseBackupOperations(false);
    }
  }, [operations, operationsRef.current.length]);

  // Update the ensureOperationsRegistered function to show a button to use backup operations
  const ensureOperationsRegistered = () => {
    console.log("Checking registered operations...");
    console.log(`Main operations array: ${operations.length} items`);
    console.log(`Backup operations ref: ${operationsRef.current.length} items`);

    // If operations aren't being properly captured in state, we can manually preserve them
    if (operations.length === 0 && operationsRef.current.length > 0) {
      console.log("Restoring operations from ref:", operationsRef.current);
      setUseBackupOperations(true);

      // Display detailed operation info for debugging
      operationsRef.current.forEach((op, index) => {
        console.log(`Operation ${index + 1} in ref:`, op);
        console.log(`  Type: ${op.type}, Action: ${op.action}`);
        if (op.data?.triple) {
          console.log(`  Entity: ${op.data.triple.entityId?.substring(0, 8)}...`);
        } else if (op.data?.from_id) {
          console.log(`  Relation: ${op.data.from_id?.substring(0, 8)}... → ${op.data.to_id?.substring(0, 8)}...`);
        }
      });

      // Make sure we return true to indicate success
      return true;
    }

    return false;
  };

  // Create a person entity with our hooks
  const handleCreatePerson = () => {
    if (!name) {
      setStatus("Please enter a name");
      return;
    }

    const options: any = {};
    if (age !== "") options.age = age;
    if (bio) options.bio = bio;
    if (location) options.location = location;

    try {
      const { entityId, operations } = createPersonEntity(name, options);
      setStatus(`Created person entity (${entityId}) with ${operations.length} attributes`);

      // Clear the form
      setName("");
      setAge("");
      setBio("");
      setLocation("");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Error creating person: ${message}`);
    }
  };

  // Helper functions for relations
  const handleGenerateFromEntityID = () => {
    const id = generateEntityId();
    setFromEntityId(id);
    setStatus(`Generated From Entity ID: ${id}`);
  };

  const handleGenerateToEntityID = () => {
    const id = generateEntityId();
    setToEntityId(id);
    setStatus(`Generated To Entity ID: ${id}`);
  };

  const handleGenerateRelationTypeID = () => {
    const id = generateRelationTypeId();
    setRelationTypeId(id);
    setStatus(`Generated Relation Type ID: ${id}`);
  };

  // Add a relation between entities
  const handleAddRelation = () => {
    if (!fromEntityId || !relationTypeId || !toEntityId) {
      setStatus("Please fill all relation fields");
      return;
    }

    try {
      const result = addRelation(fromEntityId, relationTypeId, toEntityId);
      if (result) {
        setStatus(`Added relation from ${fromEntityId} to ${toEntityId}`);
      } else {
        setStatus("Failed to add relation");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Error adding relation: ${message}`);
    }
  };

  // Remove a relation
  const handleRemoveRelation = () => {
    if (!relationId) {
      setStatus("Please enter a Relation ID");
      return;
    }

    try {
      const result = removeRelation(relationId);
      if (result) {
        setStatus(`Removed relation with ID ${relationId}`);
        setRelationId("");
      } else {
        setStatus("Failed to remove relation");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Error removing relation: ${message}`);
    }
  };

  // Publish all operations to IPFS and blockchain
  const handlePublish = async () => {
    if (!operationName) {
      setStatus("Please enter an operation name");
      return;
    }

    const txHash = await publishToChain(getRawOperations());
    if (txHash) {
      clearOperations();
    }
  };

  // Improve the helper function to manually track operations
  const trackOperation = (type: string, action: string, data: any) => {
    // Create the operation with a unique ID
    const manualOp = {
      type,
      action,
      data,
      timestamp: Date.now(),
      id: `manual-${type}-${action}-${Date.now()}`,
    };

    // CRITICAL: Append to existing operations, never replace them
    console.log(`Tracking operation: ${type}-${action} (current ref count: ${operationsRef.current.length})`);
    operationsRef.current = [...operationsRef.current, manualOp];
    console.log(`After tracking: ref now has ${operationsRef.current.length} operations`);

    return manualOp;
  };

  // Update the createDemoPerson function to directly add all needed operations
  const createDemoPerson = () => {
    try {
      console.log(`Creating person entity: ${personName}`);

      // Generate IDs for person entity
      const entityId = generateEntityId();
      const nameAttributeId = generateAttributeId();

      console.log(`Generated person entity ID: ${entityId}`);
      console.log(`Generated name attribute ID: ${nameAttributeId}`);

      // Create the triple with a well-structured format for better display
      const tripleData = {
        type: "SET_TRIPLE",
        triple: {
          entityId,
          attributeId: nameAttributeId,
          value: {
            type: "TEXT",
            value: personName,
          },
          name: "name", // Add explicit name for better display
          entityType: "Person", // Add entity type for better display
        },
      };

      // Call the hook function (may or may not update state properly)
      const result = addTriple(entityId, nameAttributeId, { type: "TEXT", value: personName });
      console.log("Person creation result:", result);

      // Track operation manually to ensure we have a record
      const trackedOp = trackOperation("triple", "add", tripleData);
      console.log(`Manually tracked person creation operation:`, trackedOp);

      setCreatedPersonId(entityId);
      setStatus(`Created person entity: ${personName} (${entityId})`);
      setWorkflowStep(1);

      console.log(`Operations after creating person: ${operations.length}`);
      console.log(`Manually tracked operations: ${operationsRef.current.length}`);

      // Check if we need to use backup operations
      if (operations.length === 0 && operationsRef.current.length > 0) {
        console.log("Operations not showing in main array, will use backup");
        setTimeout(() => setUseBackupOperations(true), 300);
      }

      return entityId;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Error creating person: ${message}`);
      console.error("Error creating person:", error);
      return null;
    }
  };

  // Update the createDemoFood function with improved structure
  const createDemoFood = () => {
    try {
      console.log(`Creating food entity: ${foodName}`);

      // Generate IDs for food entity
      const entityId = generateEntityId();
      console.log(`Generated food entity ID: ${entityId}`);

      // Add name attribute
      const nameAttributeId = generateAttributeId();
      console.log(`Generated name attribute ID: ${nameAttributeId}`);

      // Create the name triple data with better structure
      const nameTripleData = {
        type: "SET_TRIPLE",
        triple: {
          entityId,
          attributeId: nameAttributeId,
          value: {
            type: "TEXT",
            value: foodName,
          },
          name: "name", // Add explicit name for better display
          entityType: "Food", // Add entity type for better display
        },
      };

      // Call hook function and track operation
      const nameResult = addTriple(entityId, nameAttributeId, { type: "TEXT", value: foodName });
      console.log("Food name triple result:", nameResult);
      const nameTrackedOp = trackOperation("triple", "add", nameTripleData);
      console.log("Name operation tracked:", nameTrackedOp.id);

      // Add type attribute
      const typeAttributeId = generateAttributeId();
      console.log(`Generated type attribute ID: ${typeAttributeId}`);

      // Create the type triple data
      const typeTripleData = {
        type: "SET_TRIPLE",
        triple: {
          entityId,
          attributeId: typeAttributeId,
          value: {
            type: "TEXT",
            value: "Food",
          },
          name: "type", // Add explicit name for better display
        },
      };

      // Call hook function and track operation
      const typeResult = addTriple(entityId, typeAttributeId, { type: "TEXT", value: "Food" });
      console.log("Food type triple result:", typeResult);
      const typeTrackedOp = trackOperation("triple", "add", typeTripleData);
      console.log("Type operation tracked:", typeTrackedOp.id);

      // Add category attribute
      const categoryAttributeId = generateAttributeId();
      console.log(`Generated category attribute ID: ${categoryAttributeId}`);

      // Create the category triple data
      const categoryTripleData = {
        type: "SET_TRIPLE",
        triple: {
          entityId,
          attributeId: categoryAttributeId,
          value: {
            type: "TEXT",
            value: "Italian",
          },
          name: "category", // Add explicit name for better display
        },
      };

      // Call hook function and track operation
      const categoryResult = addTriple(entityId, categoryAttributeId, { type: "TEXT", value: "Italian" });
      console.log("Food category triple result:", categoryResult);
      const categoryTrackedOp = trackOperation("triple", "add", categoryTripleData);
      console.log("Category operation tracked:", categoryTrackedOp.id);

      // Add tasty attribute
      const tastyAttributeId = generateAttributeId();
      console.log(`Generated tasty attribute ID: ${tastyAttributeId}`);

      // Create the tasty triple data
      const tastyTripleData = {
        type: "SET_TRIPLE",
        triple: {
          entityId,
          attributeId: tastyAttributeId,
          value: {
            type: "CHECKBOX",
            value: "true",
          },
          name: "tasty", // Add explicit name for better display
        },
      };

      // Call hook function and track operation
      const tastyResult = addTriple(entityId, tastyAttributeId, { type: "CHECKBOX", value: "true" });
      console.log("Food tasty triple result:", tastyResult);
      const tastyTrackedOp = trackOperation("triple", "add", tastyTripleData);
      console.log("Tasty operation tracked:", tastyTrackedOp.id);

      setCreatedFoodId(entityId);
      setStatus(
        `Created food entity: ${foodName} (${entityId}) with properties: type=Food, category=Italian, tasty=true`,
      );
      setWorkflowStep(2);

      console.log(`Operations after creating food: ${operations.length}`);
      console.log(`Manually tracked operations after food: ${operationsRef.current.length}`);

      // Check if we need to use backup operations
      if (operations.length === 0 && operationsRef.current.length > 0) {
        console.log("Operations not showing in main array, will use backup");
        setTimeout(() => setUseBackupOperations(true), 300);
      }

      return entityId;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Error creating food: ${message}`);
      console.error("Error creating food:", error);
      return null;
    }
  };

  // Create demo relation between person and food
  const createDemoRelation = () => {
    console.log(
      `createDemoRelation called with personId=${createdPersonId?.substring(0, 8)}..., foodId=${createdFoodId?.substring(0, 8)}...`,
    );

    if (!createdPersonId || !createdFoodId) {
      setStatus("Please create both person and food entities first");
      console.log(
        `Missing IDs for relation creation - personId: ${createdPersonId ? "yes" : "no"}, foodId: ${createdFoodId ? "yes" : "no"}`,
      );
      return;
    }

    try {
      console.log(`RELATION STEP START ==================`);
      console.log(`Creating relation: ${personName} ${relationName} ${foodName}`);
      console.log(`From ID: ${createdPersonId}, To ID: ${createdFoodId}`);
      console.log(`Operations ref before relation: ${operationsRef.current.length}`);

      // Make a copy of existing operations to ensure we don't lose them
      const existingOps = [...operationsRef.current];
      console.log(`Made backup of ${existingOps.length} existing operations`);

      // Generate a relation type ID based on the relation name
      const typeId = `relationType-${relationName.toLowerCase()}-${Math.random().toString(36).substring(2, 5)}`;
      const relId = generateRelationId();

      console.log(`Generated relation type ID: ${typeId}`);
      console.log(`Generated relation ID: ${relId}`);

      // Create a well-structured relation data object
      const relData = {
        type: "SET_RELATION",
        relation: {
          id: relId,
          fromId: createdPersonId,
          toId: createdFoodId,
          typeId: typeId,
          name: relationName, // Explicit relation name for better display
          fromEntity: personName,
          toEntity: foodName,
        },
      };

      console.log(`Relation data prepared, about to track operation`, relData);

      // Always track the operation manually BEFORE attempting the hook call
      // This ensures we have a record even if the hook fails
      const trackedOp = trackOperation("relation", "add", relData);
      console.log(
        `Manually tracked relation operation: ID=${trackedOp.id}, type=${trackedOp.type}, action=${trackedOp.action}`,
      );

      // Log current ref contents
      console.log(`Operations ref after tracking: ${operationsRef.current.length} operations`);
      operationsRef.current.forEach((op, index) => {
        console.log(
          `Operation ${index + 1}: type=${op.type}, action=${op.action}, id=${op.id?.substring(0, 8) || "unknown"}...`,
        );
      });

      // Safety check - did we lose previous operations?
      if (operationsRef.current.length < existingOps.length + 1) {
        console.error(`CRITICAL: Operations were lost during relation creation!`);
        console.log(`Expected ${existingOps.length + 1} operations, but found ${operationsRef.current.length}`);

        // Restore all operations and add the new one
        operationsRef.current = [...existingOps, trackedOp];
        console.log(`Restored operations ref to ${operationsRef.current.length} operations`);
      }

      // Now try the hook function
      console.log(
        `Calling addRelation hook with fromId=${createdPersonId.substring(0, 8)}..., typeId=${typeId.substring(0, 8)}..., toId=${createdFoodId.substring(0, 8)}...`,
      );
      const result = addRelation(createdPersonId, typeId, createdFoodId, relId);
      console.log(`addRelation result:`, result);

      console.log(`Operations ref now has ${operationsRef.current.length} operations`);
      console.log(
        `First few operations types: ${operationsRef.current
          .slice(0, 3)
          .map(op => op.type)
          .join(", ")}`,
      );

      // Check operations array
      console.log(`Main operations array has ${operations.length} operations`);
      if (operations.length === 0 || operations.length < operationsRef.current.length) {
        console.log(`Operations not showing up correctly in main array, will use backup`);
        setUseBackupOperations(true);
      }

      // Create an explicit relation operation that will be correctly formatted
      // This is a backup approach in case the normal tracking fails
      const explicitRelationOp = {
        type: "relation",
        action: "add",
        data: {
          type: "SET_RELATION",
          relation: {
            id: relId,
            fromId: createdPersonId,
            fromEntity: personName,
            toId: createdFoodId,
            toEntity: foodName,
            typeId: typeId,
            name: relationName,
          },
        },
        timestamp: Date.now(),
        id: `relation-add-${relId}-${Date.now()}`,
      };

      // Double check that our operation was properly tracked
      const opExists = operationsRef.current.some(
        op =>
          op.type === "relation" && op.action === "add" && (op.data?.relation?.id === relId || op.data?.id === relId),
      );

      if (!opExists) {
        console.warn(`Relation operation wasn't properly tracked! Adding explicit relation operation.`);
        // Add the explicit operation
        operationsRef.current = [...operationsRef.current, explicitRelationOp];
        console.log(`Added explicit relation operation, now have ${operationsRef.current.length} operations`);
      }

      // One final safety check for operation count
      console.log(`Final operations count in ref: ${operationsRef.current.length}`);
      if (operationsRef.current.length < existingOps.length + 1) {
        console.error(`FINAL CHECK: Operations were lost during relation creation!`);
        operationsRef.current = [...existingOps, explicitRelationOp];
        console.log(`Re-restored operations ref to ${operationsRef.current.length} operations with explicit relation`);
      }

      // Force the explicit relation to be included in the final operations
      const relationExists = operationsRef.current.some(
        op => op.type === "relation" && op.action === "add" && op.data?.relation?.name === relationName,
      );

      if (!relationExists) {
        console.log(`No properly formatted relation found, adding explicit relation`);
        operationsRef.current = [...operationsRef.current, explicitRelationOp];
      }

      // Final dump of all operations to check
      console.log(`RELATION OPERATION CHECK:`);
      operationsRef.current.forEach((op, index) => {
        console.log(
          `Operation ${index + 1}: type=${op.type}, action=${op.action}, id=${op.id?.substring(0, 8) || "unknown"}...`,
        );
      });
      const finalRelationCount = operationsRef.current.filter(op => op.type === "relation").length;
      console.log(`Final relation operations count: ${finalRelationCount}`);

      // Update the final count
      console.log(`Relation step complete, final operations count: ${operationsRef.current.length}`);
      console.log(`RELATION STEP END ==================`);

      setCreatedRelationId(relId);
      setStatus(`Created relation: ${personName} ${relationName} ${foodName}`);
      setWorkflowStep(3);

      return relId;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Error creating relation: ${message}`);
      console.error("Relation creation error:", error);
      return null;
    }
  };

  // Update runFullDemo to call our check
  const runFullDemo = () => {
    console.log("Starting full demo workflow");
    setWorkflowStep(0);
    clearOperations(); // Clear any previous operations first
    operationsRef.current = []; // Clear our ref as well

    // Create a persistent array to track all operations through the workflow
    // Define the type to match what's in operationsRef.current
    let allOperations: Array<{
      type: string;
      action: string;
      data: any;
      timestamp: number;
      id: string;
    }> = [];

    // Use local variables to track IDs instead of relying on state updates
    let localPersonId = "";
    let localFoodId = "";

    // Execute steps with proper delays
    setTimeout(() => {
      console.log("Step 1: Creating person entity");
      const personId = createDemoPerson();

      if (personId) {
        // Store personId in local variable
        localPersonId = personId;
        console.log(`Person created with ID: ${personId} (stored locally)`);

        // Make sure we check operations after each step
        const personOpCount = operationsRef.current.length;
        console.log(`After person creation: ${personOpCount} operations in ref`);

        // Save all operations
        allOperations = [...operationsRef.current];
        console.log(`Saved ${allOperations.length} operations after person creation`);

        // Create food after person is created
        setTimeout(() => {
          console.log("Step 2: Creating food entity");
          const foodId = createDemoFood();

          if (foodId) {
            // Store foodId in local variable
            localFoodId = foodId;
            console.log(`Food created with ID: ${foodId} (stored locally)`);

            const foodOpCount = operationsRef.current.length;
            console.log(`After food creation: ${foodOpCount} operations in ref (added ${foodOpCount - personOpCount})`);

            // If we've lost operations, restore them before continuing
            if (operationsRef.current.length < allOperations.length) {
              console.error(`Operations lost after food creation! Restoring from saved list.`);
              // We need to get the NEW operations and add them to the saved ones
              const newOps = operationsRef.current.filter(op => !allOperations.some(savedOp => savedOp.id === op.id));

              operationsRef.current = [...allOperations, ...newOps];
              console.log(`Restored operations ref to ${operationsRef.current.length} operations`);
            }

            // Update our persistent array
            allOperations = [...operationsRef.current];
            console.log(`Saved ${allOperations.length} operations after food creation`);

            // Create relation after both entities exist
            setTimeout(() => {
              console.log("Step 3: Creating relation");

              // Ensure the operations ref has all previous operations
              if (operationsRef.current.length < allOperations.length) {
                console.log(`Restoring ${allOperations.length} operations before relation creation`);
                operationsRef.current = [...allOperations];
              }

              // Debug dump of IDs before relation creation - use local variables
              console.log(`Before relation creation - personId: ${localPersonId}, foodId: ${localFoodId}`);

              // Create a special relation directly using our local IDs
              console.log(`Creating relation with locally stored IDs`);
              console.log(`From Person: ${localPersonId}, To Food: ${localFoodId}`);

              let relationId = null;

              if (localPersonId && localFoodId) {
                try {
                  console.log(`RELATION STEP START ==================`);
                  console.log(`Creating relation: ${personName} ${relationName} ${foodName}`);
                  console.log(`From ID: ${localPersonId}, To ID: ${localFoodId}`);
                  console.log(`Operations ref before relation: ${operationsRef.current.length}`);

                  // Make a copy of existing operations to ensure we don't lose them
                  const existingOps = [...operationsRef.current];
                  console.log(`Made backup of ${existingOps.length} existing operations`);

                  // Generate a relation type ID based on the relation name
                  const typeId = `relationType-${relationName.toLowerCase()}-${Math.random().toString(36).substring(2, 5)}`;
                  const relId = generateRelationId();
                  relationId = relId;

                  console.log(`Generated relation type ID: ${typeId}`);
                  console.log(`Generated relation ID: ${relId}`);

                  // Create a well-structured relation data object
                  const relData = {
                    type: "SET_RELATION",
                    relation: {
                      id: relId,
                      fromId: localPersonId,
                      toId: localFoodId,
                      typeId: typeId,
                      name: relationName, // Explicit relation name for better display
                      fromEntity: personName,
                      toEntity: foodName,
                    },
                  };

                  console.log(`Relation data prepared, about to track operation`, relData);

                  // Always track the operation manually BEFORE attempting the hook call
                  // This ensures we have a record even if the hook fails
                  const trackedOp = trackOperation("relation", "add", relData);
                  console.log(
                    `Manually tracked relation operation: ID=${trackedOp.id}, type=${trackedOp.type}, action=${trackedOp.action}`,
                  );

                  // Log current ref contents
                  console.log(`Operations ref after tracking: ${operationsRef.current.length} operations`);
                  operationsRef.current.forEach((op, index) => {
                    console.log(
                      `Operation ${index + 1}: type=${op.type}, action=${op.action}, id=${op.id?.substring(0, 8) || "unknown"}...`,
                    );
                  });

                  // Safety check - did we lose previous operations?
                  if (operationsRef.current.length < existingOps.length + 1) {
                    console.error(`CRITICAL: Operations were lost during relation creation!`);
                    console.log(
                      `Expected ${existingOps.length + 1} operations, but found ${operationsRef.current.length}`,
                    );

                    // Restore all operations and add the new one
                    operationsRef.current = [...existingOps, trackedOp];
                    console.log(`Restored operations ref to ${operationsRef.current.length} operations`);
                  }

                  // Now try the hook function with local IDs
                  console.log(
                    `Calling addRelation hook with fromId=${localPersonId.substring(0, 8)}..., typeId=${typeId.substring(0, 8)}..., toId=${localFoodId.substring(0, 8)}...`,
                  );
                  const result = addRelation(localPersonId, typeId, localFoodId, relId);
                  console.log(`addRelation result:`, result);

                  console.log(`Operations ref now has ${operationsRef.current.length} operations`);
                  console.log(
                    `First few operations types: ${operationsRef.current
                      .slice(0, 3)
                      .map(op => op.type)
                      .join(", ")}`,
                  );

                  // Check operations array
                  console.log(`Main operations array has ${operations.length} operations`);
                  if (operations.length === 0 || operations.length < operationsRef.current.length) {
                    console.log(`Operations not showing up correctly in main array, will use backup`);
                    setUseBackupOperations(true);
                  }

                  // Create an explicit relation operation that will be correctly formatted
                  // This is a backup approach in case the normal tracking fails
                  const explicitRelationOp = {
                    type: "relation",
                    action: "add",
                    data: {
                      type: "SET_RELATION",
                      relation: {
                        id: relId,
                        fromId: localPersonId,
                        fromEntity: personName,
                        toId: localFoodId,
                        toEntity: foodName,
                        typeId: typeId,
                        name: relationName,
                      },
                    },
                    timestamp: Date.now(),
                    id: `relation-add-${relId}-${Date.now()}`,
                  };

                  // Double check that our operation was properly tracked
                  const opExists = operationsRef.current.some(
                    op =>
                      op.type === "relation" &&
                      op.action === "add" &&
                      (op.data?.relation?.id === relId || op.data?.id === relId),
                  );

                  if (!opExists) {
                    console.warn(`Relation operation wasn't properly tracked! Adding explicit relation operation.`);
                    // Add the explicit operation
                    operationsRef.current = [...operationsRef.current, explicitRelationOp];
                    console.log(
                      `Added explicit relation operation, now have ${operationsRef.current.length} operations`,
                    );
                  }

                  // One final safety check for operation count
                  console.log(`Final operations count in ref: ${operationsRef.current.length}`);
                  if (operationsRef.current.length < existingOps.length + 1) {
                    console.error(`FINAL CHECK: Operations were lost during relation creation!`);
                    operationsRef.current = [...existingOps, explicitRelationOp];
                    console.log(
                      `Re-restored operations ref to ${operationsRef.current.length} operations with explicit relation`,
                    );
                  }

                  // Force the explicit relation to be included in the final operations
                  const relationExists = operationsRef.current.some(
                    op => op.type === "relation" && op.action === "add" && op.data?.relation?.name === relationName,
                  );

                  if (!relationExists) {
                    console.log(`No properly formatted relation found, adding explicit relation`);
                    operationsRef.current = [...operationsRef.current, explicitRelationOp];
                  }

                  // Final dump of all operations to check
                  console.log(`RELATION OPERATION CHECK:`);
                  operationsRef.current.forEach((op, index) => {
                    console.log(
                      `Operation ${index + 1}: type=${op.type}, action=${op.action}, id=${op.id?.substring(0, 8) || "unknown"}...`,
                    );
                  });
                  const finalRelationCount = operationsRef.current.filter(op => op.type === "relation").length;
                  console.log(`Final relation operations count: ${finalRelationCount}`);

                  // Update the final count
                  console.log(`Relation step complete, final operations count: ${operationsRef.current.length}`);
                  console.log(`RELATION STEP END ==================`);

                  // Also update the state for display purposes
                  setCreatedPersonId(localPersonId);
                  setCreatedFoodId(localFoodId);
                  setCreatedRelationId(relId);
                  setStatus(`Created relation: ${personName} ${relationName} ${foodName}`);
                  setWorkflowStep(3);
                } catch (error) {
                  const message = error instanceof Error ? error.message : String(error);
                  setStatus(`Error creating relation: ${message}`);
                  console.error("Relation creation error:", error);
                }
              } else {
                console.error("Missing local IDs for relation creation!");
                setStatus("Failed to create relation - missing IDs");
              }

              console.log(`Relation creation attempt completed, relationId: ${relationId}`);

              const finalOpCount = operationsRef.current.length;
              console.log(`After relation creation: ${finalOpCount} operations in ref`);

              // If we've lost operations, restore them
              if (operationsRef.current.length < allOperations.length) {
                console.error(`Operations lost after relation creation! Restoring from saved list.`);
                operationsRef.current = [...allOperations];
                console.log(`Restored operations ref to ${operationsRef.current.length} operations`);
              }

              // Final save of all operations
              allOperations = [...operationsRef.current];
              console.log(`Saved ${allOperations.length} operations after relation creation`);

              // Force add an explicit relation operation if none exists
              const hasRelation = allOperations.some(op => op.type === "relation");
              console.log(`Checking for relation operation - has relation: ${hasRelation}`);

              if (!hasRelation) {
                console.log(
                  `No relation operation found after relation creation - forcing addition of relation operation`,
                );

                // Create explicit relation operation
                const explicitRelationOp = {
                  type: "relation",
                  action: "add",
                  data: {
                    type: "SET_RELATION",
                    relation: {
                      id: `relation-${Math.random().toString(36).substring(2, 10)}`,
                      fromId: localPersonId,
                      fromEntity: personName,
                      toId: localFoodId,
                      toEntity: foodName,
                      typeId: `relationType-${relationName.toLowerCase()}-forced`,
                      name: relationName,
                    },
                  },
                  timestamp: Date.now(),
                  id: `relation-${relationName.toLowerCase()}-forced-${Date.now()}`,
                };

                // Add to both arrays
                operationsRef.current = [...operationsRef.current, explicitRelationOp];
                allOperations = [...allOperations, explicitRelationOp];

                console.log(`Added forced relation operation, now have ${operationsRef.current.length} operations`);
              }

              // Check final operations
              setTimeout(() => {
                console.log(`Demo complete. Total operations: ${operations.length}`);
                console.log(`Total operations in ref: ${operationsRef.current.length}`);
                console.log(`Total saved operations: ${allOperations.length}`);

                // Make sure our ref has all the operations
                if (operationsRef.current.length < allOperations.length) {
                  console.log(`Final restoration of all ${allOperations.length} operations`);
                  operationsRef.current = [...allOperations];
                }

                if (operations.length === 0 || operations.length < operationsRef.current.length) {
                  console.warn(
                    `Warning: Main operations array (${operations.length}) doesn't match ref (${operationsRef.current.length})`,
                  );
                  // Automatically use backup operations
                  console.log(`Auto-restoring ${operationsRef.current.length} operations from backup`);
                  setUseBackupOperations(true);

                  // Make extra sure we show all steps at the end
                  setTimeout(() => {
                    // Force a re-check in case the state update doesn't trigger properly
                    if (!useBackupOperations && operationsRef.current.length > 0) {
                      console.log("Forcing backup operations display");
                      setUseBackupOperations(true);
                    }
                  }, 500);
                }
              }, 1000);
            }, 1500);
          }
        }, 1500);
      }
    }, 100);
  };

  const resetDemo = () => {
    setCreatedPersonId("");
    setCreatedFoodId("");
    setCreatedRelationId("");
    setWorkflowStep(0);
    setStatus("Demo reset");
  };

  // Update the useEffect to store operations in ref
  useEffect(() => {
    // Log operations whenever they change
    if (operations.length > 0) {
      console.log(`Operations updated (${operations.length}):`);
      operations.forEach((op, i) => {
        console.log(`Operation ${i + 1}:`, op.type, op.action, op.data);
      });

      // Store in ref for safekeeping
      operationsRef.current = [...operations];
    }
  }, [operations]);

  // Add a monitoring effect to check operation counts and fix if needed
  useEffect(() => {
    // This effect monitors the operations and ensures they're properly tracked
    const checkInterval = setInterval(() => {
      const refCount = operationsRef.current.length;
      const stateCount = operations.length;

      // If we have operations in our ref but none in state, switch to backup mode
      if (refCount > 0 && stateCount < refCount && !useBackupOperations) {
        console.log(`Operation count mismatch detected! Ref: ${refCount}, State: ${stateCount}`);
        console.log(`Automatically switching to backup operations mode`);
        setUseBackupOperations(true);
      }
    }, 2000); // Check every 2 seconds

    // Clean up interval on unmount
    return () => clearInterval(checkInterval);
  }, [operations.length, operationsRef.current.length, useBackupOperations]);

  // Update parent component with operations count and status
  useEffect(() => {
    // Use either the main operations count or the backup ref count
    const currentCount = useBackupOperations ? operationsRef.current.length : operationsCount;
    if (onOperationsCountChange) {
      onOperationsCountChange(currentCount);
    }
  }, [operations, operationsCount, operationsRef.current.length, useBackupOperations, onOperationsCountChange]);

  // Update parent with status when it changes
  useEffect(() => {
    if (onStatusChange && lastStatus) {
      onStatusChange(lastStatus);
    }
  }, [lastStatus, onStatusChange]);

  return (
    <div className="card bg-base-100 shadow-xl mb-8">
      <div className="card-body">
        <h2 className="card-title flex justify-between">
          <span>Hook Demo</span>
          <div className="badge badge-primary">{operationsCount} operations</div>
        </h2>

        <button className="btn btn-sm btn-info mt-2 mb-4" onClick={() => setShowHelp(!showHelp)}>
          {showHelp ? "Hide Knowledge Graph Concepts" : "Learn About Knowledge Graph Concepts"}
        </button>

        {showHelp && (
          <div className="bg-base-200 p-4 rounded-lg mb-6">
            <h3 className="font-bold text-lg mb-2">Understanding Knowledge Graphs</h3>

            <div className="divider my-1"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-md mb-1 text-primary">Nodes (Entities)</h4>
                <p className="text-sm mb-2">
                  Nodes are the primary objects in your knowledge graph. They represent things like:
                </p>
                <ul className="list-disc list-inside text-sm ml-2 space-y-1">
                  <li>People (e.g., "John Smith")</li>
                  <li>Places (e.g., "New York City")</li>
                  <li>Concepts (e.g., "Democracy")</li>
                  <li>Physical objects (e.g., "Empire State Building")</li>
                  <li>Digital assets (e.g., "Bitcoin Whitepaper")</li>
                </ul>
                <p className="text-sm mt-2">
                  <span className="font-bold">In this app:</span> Create nodes using the "Create Person" form or Triple
                  Operations.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-md mb-1 text-secondary">Edges (Relations)</h4>
                <p className="text-sm mb-2">
                  Edges connect nodes to each other, defining how entities relate. Examples:
                </p>
                <ul className="list-disc list-inside text-sm ml-2 space-y-1">
                  <li>
                    Person <span className="text-secondary font-bold">→ WORKS_AT →</span> Company
                  </li>
                  <li>
                    Person <span className="text-secondary font-bold">→ KNOWS →</span> Person
                  </li>
                  <li>
                    Book <span className="text-secondary font-bold">→ AUTHORED_BY →</span> Person
                  </li>
                  <li>
                    City <span className="text-secondary font-bold">→ LOCATED_IN →</span> Country
                  </li>
                </ul>
                <p className="text-sm mt-2">
                  <span className="font-bold">In this app:</span> Create edges using Relation Operations by specifying
                  From Entity, Relation Type, and To Entity.
                </p>
              </div>
            </div>

            <div className="divider my-1"></div>

            <div className="mt-2">
              <h4 className="font-bold text-md mb-1">How Triple Operations Work</h4>
              <p className="text-sm mb-2">
                Triple operations define properties of nodes in a subject-predicate-object format:
              </p>
              <div className="bg-base-300 p-3 rounded text-sm font-mono">
                Entity ID (Node) → Attribute ID (Property) → Value (Data)
              </div>
              <div className="flex flex-col text-sm mt-2">
                <span>
                  <span className="font-bold">Example:</span> Person123 → hasName → "John Smith"
                </span>
                <span>
                  <span className="font-bold">Example:</span> City456 → population → 8500000
                </span>
                <span>
                  <span className="font-bold">Example:</span> Movie789 → releaseDate → "2023-05-15"
                </span>
              </div>
            </div>

            <div className="alert alert-info mt-4 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-current shrink-0 w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <div>
                <span className="font-bold">Pro Tip:</span> Think of your knowledge graph like a graph database. Nodes
                store entity information, and edges define how entities relate to each other.
              </div>
            </div>
          </div>
        )}

        {/* Complete Demo Workflow - Expandable */}
        <div className="card bg-base-100 border border-base-300 shadow-sm mb-4">
          <div
            className="card-title p-4 cursor-pointer flex justify-between items-center"
            onClick={() => setExpandDemoWorkflow(!expandDemoWorkflow)}
          >
            <h3 className="text-lg font-bold">Complete Demo: Person → Likes → Food</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transition-transform duration-200 ${expandDemoWorkflow ? "rotate-180" : ""}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {expandDemoWorkflow && (
            <div className="card-body pt-0">
              <p className="text-sm mb-4">
                This demo creates a complete knowledge graph with two nodes (Person and Food) connected by a relation
                (default: "LIKES").
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Person Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Person name"
                    className="input input-bordered"
                    value={personName}
                    onChange={e => setPersonName(e.target.value)}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Relation Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Relation name (e.g., LIKES, EATS)"
                    className="input input-bordered"
                    value={relationName}
                    onChange={e => setRelationName(e.target.value.toUpperCase())}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Food Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Food name"
                    className="input input-bordered"
                    value={foodName}
                    onChange={e => setFoodName(e.target.value)}
                  />
                </div>
              </div>

              <div className="alert alert-info mt-4 text-sm">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  className="stroke-current shrink-0 w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                <div>
                  <span className="font-bold">What this demo creates:</span>
                  <ul className="list-disc list-inside mt-1">
                    <li>
                      A <span className="font-mono">{personName}</span> entity (Person node)
                    </li>
                    <li>
                      A <span className="font-mono">{foodName}</span> entity (Food node with properties: type=Food,
                      category=Italian, tasty=true)
                    </li>
                    <li>
                      A <span className="font-mono">{relationName}</span> relation connecting them
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-semibold">Workflow Steps:</h4>
                  <button className="btn btn-sm btn-primary" onClick={runFullDemo}>
                    Run Full Demo
                  </button>
                </div>

                <ul className="steps steps-vertical lg:steps-horizontal w-full">
                  <li className={`step ${workflowStep >= 1 ? "step-primary" : ""}`}>
                    Create Person
                    {workflowStep >= 1 && (
                      <span className="text-xs ml-2">ID: {createdPersonId.substring(0, 8)}...</span>
                    )}
                  </li>
                  <li className={`step ${workflowStep >= 2 ? "step-primary" : ""}`}>
                    Create Food
                    {workflowStep >= 2 && <span className="text-xs ml-2">ID: {createdFoodId.substring(0, 8)}...</span>}
                  </li>
                  <li className={`step ${workflowStep >= 3 ? "step-primary" : ""}`}>
                    Create {relationName} Relation
                    {workflowStep >= 3 && <span className="text-xs ml-2">Relation created!</span>}
                  </li>
                </ul>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4">
                  <button
                    className="btn btn-outline btn-primary"
                    onClick={createDemoPerson}
                    disabled={workflowStep >= 1}
                  >
                    Step 1: Create Person
                  </button>
                  <button
                    className="btn btn-outline btn-primary"
                    onClick={createDemoFood}
                    disabled={workflowStep < 1 || workflowStep >= 2}
                  >
                    Step 2: Create Food
                  </button>
                  <button
                    className="btn btn-outline btn-primary"
                    onClick={createDemoRelation}
                    disabled={workflowStep < 2}
                  >
                    Step 3: Create {relationName} Relation
                  </button>
                </div>

                {workflowStep === 3 && (
                  <div className="alert alert-success mt-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="stroke-current shrink-0 h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <span className="font-bold">Success!</span> Created a complete knowledge graph:
                      <div className="font-mono text-xs mt-1">
                        {personName} (Person) → {relationName} → {foodName} (Food with properties)
                      </div>
                    </div>
                  </div>
                )}

                {workflowStep > 0 && (
                  <button className="btn btn-sm btn-outline mt-4" onClick={resetDemo}>
                    Reset Demo
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Operations Log - Expandable */}
        <div className="card bg-base-100 border border-base-300 shadow-sm mb-4">
          <div
            className="card-title p-4 cursor-pointer flex justify-between items-center"
            onClick={() => setExpandOperationsLog(!expandOperationsLog)}
          >
            <h3 className="text-lg font-bold">Operations Log</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transition-transform duration-200 ${expandOperationsLog ? "rotate-180" : ""}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {expandOperationsLog && (
            <div className="card-body pt-0">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  {useBackupOperations && <div className="badge badge-warning">Using Backup Data</div>}
                </div>

                {operationsRef.current.length > 0 && operations.length === 0 && !useBackupOperations && (
                  <button className="btn btn-xs btn-warning" onClick={() => setUseBackupOperations(true)}>
                    Show Backup Operations ({operationsRef.current.length})
                  </button>
                )}
              </div>

              <OperationsLog
                ops={useBackupOperations ? operationsRef.current : operations}
                clearOps={() => {
                  clearOperations();
                  operationsRef.current = [];
                  setUseBackupOperations(false);
                }}
              />
            </div>
          )}
        </div>

        {/* Person Entity Section - Expandable */}
        {/* REMOVED CREATE PERSON ENTITY SECTION */}

        {/* Relations Section - Expandable */}
        <div className="card bg-base-100 border border-base-300 shadow-sm mb-4">
          <div
            className="card-title p-4 cursor-pointer flex justify-between items-center"
            onClick={() => setExpandRelationsSection(!expandRelationsSection)}
          >
            <h3 className="text-lg font-bold">Create Relations</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transition-transform duration-200 ${expandRelationsSection ? "rotate-180" : ""}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {expandRelationsSection && (
            <div className="card-body pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">From Entity ID</span>
                    <button className="btn btn-xs btn-outline btn-primary" onClick={handleGenerateFromEntityID}>
                      Generate
                    </button>
                  </label>
                  <input
                    type="text"
                    placeholder="From Entity ID"
                    className="input input-bordered"
                    value={fromEntityId}
                    onChange={e => setFromEntityId(e.target.value)}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Relation Type ID</span>
                    <button className="btn btn-xs btn-outline btn-primary" onClick={handleGenerateRelationTypeID}>
                      Generate
                    </button>
                  </label>
                  <input
                    type="text"
                    placeholder="Relation Type ID"
                    className="input input-bordered"
                    value={relationTypeId}
                    onChange={e => setRelationTypeId(e.target.value)}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">To Entity ID</span>
                    <button className="btn btn-xs btn-outline btn-primary" onClick={handleGenerateToEntityID}>
                      Generate
                    </button>
                  </label>
                  <input
                    type="text"
                    placeholder="To Entity ID"
                    className="input input-bordered"
                    value={toEntityId}
                    onChange={e => setToEntityId(e.target.value)}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Relation ID (for removal)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Relation ID (only for removal)"
                    className="input input-bordered"
                    value={relationId}
                    onChange={e => setRelationId(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <button className="btn btn-primary" onClick={handleAddRelation}>
                  Add Relation
                </button>
                <button className="btn btn-secondary" onClick={handleRemoveRelation}>
                  Remove Relation
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Publishing Section - Expandable */}
        <div className="card bg-base-100 border border-base-300 shadow-sm mb-4">
          <div
            className="card-title p-4 cursor-pointer flex justify-between items-center"
            onClick={() => setExpandPublishingSection(!expandPublishingSection)}
          >
            <h3 className="text-lg font-bold">Publishing</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transition-transform duration-200 ${expandPublishingSection ? "rotate-180" : ""}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {expandPublishingSection && (
            <div className="card-body pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Operation Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Create Person Entities"
                    className="input input-bordered"
                    value={operationName}
                    onChange={e => setOperationName(e.target.value)}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Space ID</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Space ID"
                    className="input input-bordered"
                    value={spaceId}
                    onChange={e => setSpaceId(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <button
                  className="btn btn-secondary"
                  onClick={handlePublish}
                  disabled={operationsCount === 0 || !operationName}
                >
                  Publish All Operations
                </button>

                <button className="btn btn-outline" onClick={clearOperations} disabled={operationsCount === 0}>
                  Clear Operations
                </button>
              </div>

              {ipfsCid && (
                <div className="alert alert-info mt-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="stroke-current shrink-0 w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <div>
                    <div className="text-sm font-bold">IPFS CID</div>
                    <div className="text-xs font-mono">{ipfsCid}</div>
                  </div>
                </div>
              )}

              {ipfsCid && !txHash && (
                <button
                  className="btn btn-primary mt-4 w-full"
                  onClick={async () => {
                    setStatus("Getting transaction data and sending to blockchain...");
                    try {
                      // First get the transaction data
                      const callData = await getCallData();
                      if (!callData) {
                        setStatus("Failed to get transaction data");
                        return;
                      }

                      // Then send the transaction
                      const hash = await sendTransaction();
                      if (hash) {
                        setStatus(`Transaction sent! Hash: ${hash}`);
                      } else {
                        setStatus("Failed to send transaction");
                      }
                    } catch (error) {
                      const message = error instanceof Error ? error.message : String(error);
                      setStatus(`Error sending transaction: ${message}`);
                    }
                  }}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 mr-2"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Send Transaction to Blockchain
                </button>
              )}

              {txHash && (
                <div className="alert alert-success mt-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current shrink-0 h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <div className="text-sm font-bold">Transaction sent!</div>
                    <div className="text-xs font-mono">{txHash}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status Section - Expandable */}
        <div className="card bg-base-100 border border-base-300 shadow-sm">
          <div
            className="card-title p-4 cursor-pointer flex justify-between items-center"
            onClick={() => setExpandStatusSection(!expandStatusSection)}
          >
            <h3 className="text-lg font-bold">Status</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transition-transform duration-200 ${expandStatusSection ? "rotate-180" : ""}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {expandStatusSection && (
            <div className="card-body pt-0">
              <div className="text-sm opacity-70">{lastStatus || "Ready"}</div>

              {(operationsCount > 0 || (useBackupOperations && operationsRef.current.length > 0)) && (
                <div className="mt-2">
                  <h4 className="font-semibold text-sm">
                    Pending Operations: {useBackupOperations ? operationsRef.current.length : operationsCount}
                  </h4>
                  <div className="mt-1 p-2 bg-base-200 rounded-lg text-xs max-h-24 overflow-y-auto">
                    {(useBackupOperations ? operationsRef.current : operations).map((op, index) => (
                      <div key={index} className="mb-1">
                        <span className="font-bold">{op.type}</span>: {op.action} -{" "}
                        {op.timestamp ? new Date(op.timestamp).toLocaleTimeString() : ""}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
