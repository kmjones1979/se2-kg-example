import React, { useEffect, useState } from "react";

interface OperationsLogProps {
  ops: any[];
  clearOps: () => void;
}

export const OperationsLog = ({ ops, clearOps }: OperationsLogProps) => {
  console.log("OperationsLog rendering with ops:", ops);

  // For debugging - show the first operation details
  if (ops?.length > 0) {
    console.log("First operation:", ops[0]);
    // Only log data if it exists
    if (ops[0]?.data) {
      console.log("First operation data:", ops[0]?.data);
    }
    // Always log triple field for debugging
    console.log("First operation triple field:", ops[0]?.triple);

    // Add extra debug logging for the SET_TRIPLE case
    if (ops[0]?.type === "SET_TRIPLE" || ops[0]?.op === "SET_TRIPLE") {
      console.log("Found SET_TRIPLE format:", ops[0]);
      // Only log triple data if it exists
      if (ops[0]?.triple) {
        console.log("Triple data:", ops[0]?.triple);
      }
    }
  }

  // Add states for JSON view, ultra raw mode and debug mode
  const [isJsonView, setIsJsonView] = useState(false);
  const [showUltraRaw, setShowUltraRaw] = useState(false);
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  // Debug utility to inspect operation structures
  const inspectOperations = () => {
    if (!ops || ops.length === 0) {
      console.log("No operations to inspect");
      return;
    }

    // Group operations by type
    const grouped = ops.reduce<Record<string, any[]>>(
      (acc: Record<string, any[]>, op) => {
        const key = `${op.type}-${op.action}`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(op);
        return acc;
      },
      {} as Record<string, any[]>,
    );

    // Log each operation type with its structure
    Object.entries(grouped).forEach(([key, operations]: [string, any[]]) => {
      console.log(`Operation type: ${key} (${operations.length} operations)`);
      console.log(`Sample structure:`, operations[0]);

      // Check for common data patterns
      const patterns = operations.map((op: any) => {
        const hasTriple = op.data && op.data.triple !== undefined;
        const directEntityId = op.data && op.data.entityId !== undefined;
        const directAttrId = op.data && op.data.attributeId !== undefined;
        const pattern = `triple:${hasTriple}, direct-entity:${directEntityId}, direct-attr:${directAttrId}`;
        return pattern;
      });

      // Count unique patterns
      const patternCounts = patterns.reduce<Record<string, number>>(
        (acc: Record<string, number>, pattern) => {
          acc[pattern] = (acc[pattern] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>,
      );

      console.log(`Data patterns for ${key}:`, patternCounts);
    });
  };

  // Call inspection when in debug mode
  useEffect(() => {
    if (showDebugInfo) {
      inspectOperations();
    }
  }, [showDebugInfo, ops]);

  // Debug formatted operations
  useEffect(() => {
    if (ops?.length > 0) {
      // Wait for formatRawOps to be available
      setTimeout(() => {
        try {
          const formattedOps = formatRawOps(ops);
          console.log("Formatted operations:", formattedOps);
        } catch (error) {
          console.error("Error formatting operations for debug:", error);
        }
      }, 100);
    }
  }, [ops]);

  // Function to get badge color based on operation type
  const getBadgeColor = (type: string, action: string) => {
    // Ensure we don't have undefined type
    if (!type) return "badge-neutral";

    // Handle triple operations (including SET_TRIPLE)
    if (type === "triple" && action === "add") return "badge-success";
    if (type === "SET_TRIPLE") return "badge-success";
    if (type.includes("TRIPLE")) return "badge-success";

    // Handle relation operations
    if (type === "relation" && action === "add") return "badge-secondary";
    if (type === "SET_RELATION") return "badge-secondary";
    if (type.includes("RELATION")) return "badge-secondary";

    // Handle remove operations
    if (action === "remove") return "badge-error";

    return "badge-neutral";
  };

  // Function to format timestamp
  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // Function to safely truncate ID strings
  const truncateId = (id?: string) => {
    if (!id) return "N/A";
    return `${id.substring(0, 8)}...`;
  };

  // Function to get the entity type and name if available
  const getEntityName = (data: any, isFrom = false) => {
    // Try to find entity name in various formats
    const entityType = data?.triple?.entityType || "Entity";
    const entityName = data?.triple?.name === "name" ? data?.triple?.value?.value : null;

    if (entityName) {
      return `${entityType}: ${entityName}`;
    }

    // For relations, check if we have entity names
    if (isFrom) {
      return data?.relation?.fromEntity || truncateId(data?.relation?.fromId);
    } else {
      return data?.relation?.toEntity || truncateId(data?.relation?.toId);
    }

    return truncateId(data?.triple?.entityId || data?.entityId);
  };

  // Function to render a human-readable display name for an operation
  const getOperationDisplayName = (op: any) => {
    if (!op) return "Unknown Operation";

    // Handle all possible Triple operation formats
    if (
      (op.type === "triple" && op.action === "add") ||
      op.type === "SET_TRIPLE" ||
      op.op === "SET_TRIPLE" ||
      (op.type && op.type.includes("TRIPLE"))
    ) {
      // Check for entity/attribute data from different possible locations
      const entityId =
        op.entityId ||
        op.entity ||
        op.data?.entityId ||
        op.data?.entity ||
        (op.triple ? op.triple.entityId || op.triple.entity : null);

      const attributeId =
        op.attributeId ||
        op.attribute ||
        op.data?.attributeId ||
        op.data?.attribute ||
        (op.triple ? op.triple.attributeId || op.triple.attribute : null);

      const valueData = op.value || op.data?.value || (op.triple ? op.triple.value : null);

      // Try to determine if this is a name or type attribute
      const isNameAttribute =
        attributeId === "name" ||
        (valueData && typeof valueData === "object" && valueData.type === "TEXT" && attributeId === "name");

      const isTypeAttribute = attributeId === "type";

      // Try to get the entity type
      let entityType = op.entityType || "Entity";
      if (isTypeAttribute && valueData && valueData.value) {
        entityType = valueData.value;
      }

      // Special case for name attributes - they're entity creation/naming operations
      if (isNameAttribute && entityType !== "Entity") {
        return `Create ${entityType}`;
      } else if (isNameAttribute) {
        return "Create Entity";
      }

      // If it's a type attribute
      if (isTypeAttribute) {
        return `Set Type: ${valueData?.value || "unknown"}`;
      }

      // Check if we have an attribute name
      if (attributeId === "name") {
        return "Set Name";
      }

      return "Add Attribute";
    }

    if (op.type === "triple" && op.action === "remove") {
      return "Remove Attribute";
    }

    if (op.type === "relation" && op.action === "add") {
      // Check if we have a relation name and entity names
      const relationName = op.data?.relation?.name || "Relates to";
      const fromEntity = op.data?.relation?.fromEntity || "";
      const toEntity = op.data?.relation?.toEntity || "";

      if (fromEntity && toEntity) {
        return `${fromEntity} ${relationName} ${toEntity}`;
      }

      return `Create ${relationName} Relation`;
    }

    if (op.type === "relation" && op.action === "remove") {
      return "Remove Relation";
    }

    // Generic fallback
    if (op.type) {
      const typeDisplay = op.type.replace(/_/g, " ").toLowerCase();
      const actionDisplay = op.action || "perform";
      return `${actionDisplay} ${typeDisplay}`;
    }

    return "Unknown Operation";
  };

  // Format raw operations for easier JSON viewing
  const formatRawOps = (operations: any[]) => {
    if (!operations) return [];

    // For debugging
    console.log("Raw operations to format:", JSON.stringify(operations, null, 2));

    return operations.map(op => {
      try {
        // Determine the operation type with better fallback handling
        const opType = op.type || op.op || op.__typename || "UNKNOWN";
        const opAction = op.action || (opType.includes("SET_") || opType.includes("ADD_") ? "add" : "unknown");

        // Start with the core operation data
        const result = {
          type: opType,
          action: opAction,
          timestamp: op.timestamp ? formatTimestamp(op.timestamp) : "unknown",
          id: op.id,
        };

        // Handle Triple operation format - support all variations we've seen
        if (opType === "triple" || opType === "SET_TRIPLE" || opType === "Triple") {
          // Support different data structures - some operations have data.triple, others have triple directly
          const tripData = op.data?.triple || op.triple || op;

          // Extract entity ID - check all possible locations
          let entityId =
            tripData?.entityId ||
            tripData?.entity ||
            op.entityId ||
            op.entity ||
            (tripData?.triple ? tripData.triple.entityId || tripData.triple.entity : null);

          // Try to extract from ID format if still null
          if (!entityId && op.id) {
            const parts = op.id.split("-");
            if (parts.length > 1) {
              entityId = parts[1];
            }
          }

          // Extract attribute ID - check all possible locations
          let attributeId =
            tripData?.attributeId ||
            tripData?.attribute ||
            op.attributeId ||
            op.attribute ||
            (tripData?.triple ? tripData.triple.attributeId || tripData.triple.attribute : null);

          // Try to extract from ID format if still null
          if (!attributeId && op.id) {
            const parts = op.id.split("-");
            if (parts.length > 2) {
              attributeId = parts[2];
            }
          }

          // Extract value data - check all possible locations
          const valueData = tripData?.value || op.value || (tripData?.triple ? tripData.triple.value : null);

          // Get the actual value and type from valueData
          const value = typeof valueData === "object" ? valueData?.value : valueData;
          const valueType = typeof valueData === "object" ? valueData?.type : typeof valueData;

          // Improved attribute name extraction
          const attributeName =
            tripData?.attributeName ||
            op.attributeName ||
            (attributeId === "name" ? "name" : attributeId === "type" ? "type" : "unknown");

          // Improved entity type detection
          let entityType = tripData?.entityType || op.entityType || "Entity";

          // If this is a type triple, use its value as the entity type
          if (attributeId === "type" && value) {
            entityType = value;
          }

          return {
            ...result,
            operationType: opType,
            entityId: entityId,
            attributeId: attributeId,
            entityType: entityType,
            attributeName: attributeName,
            value: value,
            valueType: valueType || "TEXT",
          };
        }

        // Handle relation operations - with improved handling for our data structure
        if (opType === "relation" || opType === "SET_RELATION" || opType === "Relation") {
          // Handle our new well-structured relation format
          // Check multiple possible locations for relation data
          const relationData = op.data?.relation || op.data || op;

          // Try to get the relation name in various formats
          const relationName = relationData.name || (relationData.typeId?.split("-")[1] || "unknown").toUpperCase();

          return {
            ...result,
            operationType: opType,
            fromEntity: relationData.fromEntity || "unknown",
            fromId: relationData.fromId || relationData.from || op.fromId || op.from || relationData.from_id,
            toEntity: relationData.toEntity || "unknown",
            toId: relationData.toId || relationData.to || op.toId || op.to || relationData.to_id,
            relationName: relationName,
            relationType: relationData.type || relationData.typeId || relationData.relationTypeId,
            relationId: relationData.id || op.id,
          };
        }

        // Return the base operation with the raw data for other types
        return {
          ...result,
          operationType: opType,
          rawData: op.data || op,
        };
      } catch (error) {
        console.error("Error formatting operation:", error, op);
        return { error: "Failed to format operation", original: op };
      }
    });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold">Operations ({ops?.length || 0})</h3>
        <div className="flex space-x-2">
          <div className="flex items-center">
            <label className="cursor-pointer label">
              <span className="label-text mr-1 text-xs">Show JSON</span>
              <input
                type="checkbox"
                className="toggle toggle-xs toggle-primary"
                checked={isJsonView}
                onChange={() => setIsJsonView(!isJsonView)}
              />
            </label>
          </div>
          {isJsonView && (
            <>
              <label className="cursor-pointer label">
                <span className="label-text mr-1 text-xs">Ultra Raw</span>
                <input
                  type="checkbox"
                  className="checkbox checkbox-xs"
                  checked={showUltraRaw}
                  onChange={() => setShowUltraRaw(!showUltraRaw)}
                />
              </label>
              <label className="cursor-pointer label">
                <span className="label-text mr-1 text-xs">Debug</span>
                <input
                  type="checkbox"
                  className="checkbox checkbox-xs"
                  checked={showDebugInfo}
                  onChange={() => setShowDebugInfo(!showDebugInfo)}
                />
              </label>
            </>
          )}
          {ops?.length > 0 && (
            <button className="btn btn-xs btn-error" onClick={clearOps}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Show a debug info panel when debug mode is on */}
      {showDebugInfo && ops?.length > 0 && (
        <div className="bg-yellow-100 dark:bg-yellow-900 p-2 mb-2 rounded text-xs">
          <div className="font-bold">Debug Mode</div>
          <div>Operations breakdown - check console for full details:</div>
          <ul className="list-disc list-inside">
            {ops.map((op, idx) => (
              <li key={idx}>
                {op.type}-{op.action}: ID {op.id?.substring(0, 8) || "N/A"}
                {op.type === "triple" && (
                  <span className="ml-1">
                    [EntityID: {(op.data?.triple?.entityId || op.data?.entityId)?.substring(0, 6) || "missing"}]
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-base-300 p-4 rounded-lg overflow-auto max-h-72">
        {ops?.length > 0 ? (
          isJsonView ? (
            // Show raw JSON format
            <div>
              <div className="text-xs text-base-content/70 mb-2">Showing raw operation data:</div>
              {showUltraRaw ? (
                // Ultra raw mode - no formatting at all
                <pre className="text-xs bg-base-200 p-2 rounded-md whitespace-pre-wrap">
                  {JSON.stringify(ops, null, 2)}
                </pre>
              ) : (
                // Normal raw mode - some formatting
                <pre className="text-xs bg-base-200 p-2 rounded-md whitespace-pre-wrap">
                  {JSON.stringify(formatRawOps(ops), null, 2)}
                </pre>
              )}
            </div>
          ) : (
            // Show formatted operations list
            <div className="space-y-2">
              {ops.map((op, index) => (
                <div key={index} className="bg-base-200 p-2 rounded">
                  <div className="flex justify-between">
                    <div className={`badge ${getBadgeColor(op.type, op.action)}`}>{getOperationDisplayName(op)}</div>
                    <div className="text-xs opacity-70">{op.timestamp ? formatTimestamp(op.timestamp) : "N/A"}</div>
                  </div>

                  <div className="mt-2 text-xs">
                    {/* Triple Operation (Entity or Attribute) */}
                    {(op.type === "triple" || op.type === "SET_TRIPLE" || op.type?.includes("TRIPLE")) && (
                      <div>
                        <div>
                          <span className="font-semibold">Entity:</span>{" "}
                          {truncateId(
                            op.data?.triple?.entityId ||
                              op.data?.triple?.entity ||
                              op.data?.entityId ||
                              op.data?.entity ||
                              op.entityId ||
                              op.entity ||
                              op.triple?.entity ||
                              op.triple?.entityId,
                          )}
                          {op.entityType && op.entityType !== "Entity" && (
                            <span className="ml-1 text-info">({op.entityType})</span>
                          )}
                        </div>
                        <div>
                          <span className="font-semibold">Attribute:</span>{" "}
                          {truncateId(
                            op.data?.triple?.attributeId ||
                              op.data?.triple?.attribute ||
                              op.data?.attributeId ||
                              op.data?.attribute ||
                              op.attributeId ||
                              op.attribute ||
                              op.triple?.attribute ||
                              op.triple?.attributeId,
                          )}
                          {op.attributeName && op.attributeName !== "unknown" && (
                            <span className="ml-1 text-info">({op.attributeName})</span>
                          )}
                        </div>
                        {/* Unified value display that handles all formats */}
                        <div>
                          <span className="font-semibold">Value:</span>{" "}
                          {op.value ||
                            op.data?.triple?.value?.value ||
                            op.data?.value?.value ||
                            op.triple?.value?.value}
                          <span className="opacity-70">
                            {" "}
                            (
                            {op.valueType ||
                              op.data?.triple?.value?.type ||
                              op.data?.value?.type ||
                              op.triple?.value?.type ||
                              "TEXT"}
                            )
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Relation Operation */}
                    {op.type === "relation" && op.action === "add" && (
                      <div>
                        <div className="flex items-center mb-1">
                          <span className="font-semibold mr-1">Relation:</span>{" "}
                          <span className="badge badge-outline badge-secondary text-xs">
                            {op.data?.relation?.name ||
                              op.data?.relation?.type ||
                              op.data?.relation?.relationTypeId?.split("-")[1] ||
                              "Connects"}
                          </span>
                        </div>
                        <div>
                          <span className="font-semibold">From:</span>{" "}
                          {op.data?.relation?.fromEntity ? (
                            <span className="font-mono">{op.data?.relation?.fromEntity}</span>
                          ) : (
                            truncateId(op.data?.relation?.fromId || op.data?.fromEntity || op.data?.fromId)
                          )}
                        </div>
                        <div>
                          <span className="font-semibold">To:</span>{" "}
                          {op.data?.relation?.toEntity ? (
                            <span className="font-mono">{op.data?.relation?.toEntity}</span>
                          ) : (
                            truncateId(op.data?.relation?.toId || op.data?.toEntity || op.data?.toId)
                          )}
                        </div>
                        {(op.data?.relation?.id || op.data?.id) && (
                          <div>
                            <span className="font-semibold">ID:</span>{" "}
                            {truncateId(op.data?.relation?.id || op.data?.id)}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Relation Remove Operation */}
                    {op.type === "relation" && op.action === "remove" && (
                      <div>
                        <span className="font-semibold">Relation ID:</span>{" "}
                        {truncateId(typeof op.data === "string" ? op.data : op.data?.id)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          <div className="text-center text-base-content/60 py-8">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto mb-2 opacity-40"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p>No operations added yet</p>
          </div>
        )}
      </div>
    </div>
  );
};
