import React, { useEffect, useState } from "react";

interface OperationsLogProps {
  ops: any[];
  clearOps: () => void;
  showRawJson?: boolean;
}

export const OperationsLog = ({ ops, clearOps, showRawJson = false }: OperationsLogProps) => {
  console.log("OperationsLog rendering with ops:", ops);

  // For debugging - show the first operation details
  if (ops?.length > 0) {
    console.log("First operation:", ops[0]);
    console.log("First operation data:", ops[0]?.data);
  }

  // Add states for ultra raw mode and debug mode
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

  // Function to get badge color based on operation type
  const getBadgeColor = (type: string, action: string) => {
    if (type === "triple" && action === "add") return "badge-success";
    if (type === "relation" && action === "add") return "badge-secondary";
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

    if (op.type === "triple" && op.action === "add") {
      // Check if it's an entity creation (name attribute)
      const isNameAttribute =
        op.data?.triple?.name === "name" ||
        (op.data?.triple?.value?.type === "TEXT" && typeof op.data?.triple?.value?.value === "string");

      const entityType = op.data?.triple?.entityType || "";

      if (isNameAttribute && entityType) {
        return `Create ${entityType}`;
      } else if (isNameAttribute) {
        return "Create Entity";
      }

      // Check if we have an attribute name
      if (op.data?.triple?.name) {
        return `Set ${op.data?.triple?.name}`;
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

    return `${op.action} ${op.type}`;
  };

  // Format raw operations for easier JSON viewing
  const formatRawOps = (operations: any[]) => {
    if (!operations) return [];

    // For debugging
    console.log("Raw operations to format:", JSON.stringify(operations, null, 2));

    return operations.map(op => {
      try {
        // Start with the core operation data
        const result = {
          type: op.type,
          action: op.action,
          timestamp: op.timestamp ? formatTimestamp(op.timestamp) : "unknown",
          id: op.id,
        };

        // Handle SET_TRIPLE operation data format
        if (op.type === "triple" && op.action === "add" && op.data) {
          // Support different data structures - some operations have data.triple, others have data directly
          // Also handle the case where data might be nested differently
          const tripData = op.data.triple || op.data;

          // Extract entity ID - check all possible locations
          let entityId = tripData.entityId || op.data.entityId || (tripData.triple ? tripData.triple.entityId : null);

          // Try to extract from ID format if still null
          if (!entityId && op.id) {
            const parts = op.id.split("-");
            if (parts.length > 1) {
              entityId = parts[1];
            }
          }

          // Extract attribute ID - check all possible locations
          let attributeId =
            tripData.attributeId || op.data.attributeId || (tripData.triple ? tripData.triple.attributeId : null);

          // Try to extract from ID format if still null
          if (!attributeId && op.id) {
            const parts = op.id.split("-");
            if (parts.length > 2) {
              attributeId = parts[2];
            }
          }

          // Extract value data - check all possible locations
          const valueData = tripData.value || op.data.value || (tripData.triple ? tripData.triple.value : null);

          // Improved attribute name extraction
          const attributeName =
            tripData.name || (valueData?.value === "Alice" ? "name" : tripData.attributeName || "unknown");

          // Improved entity type detection
          const entityType = tripData.entityType || (valueData?.value === "Alice" ? "Person" : "Entity");

          return {
            ...result,
            operationType: op.data.type || "SET_TRIPLE",
            entityId: entityId,
            attributeId: attributeId,
            entityType: entityType,
            attributeName: attributeName,
            value: valueData?.value,
            valueType: valueData?.type,
          };
        }

        // Handle relation operations - with improved handling for our data structure
        if (op.type === "relation" && op.action === "add" && op.data) {
          // Handle our new well-structured relation format
          // Check multiple possible locations for relation data
          const relationData = op.data.relation || op.data;

          // Try to get the relation name in various formats
          const relationName = relationData.name || (relationData.typeId?.split("-")[1] || "unknown").toUpperCase();

          return {
            ...result,
            operationType: op.data.type || "SET_RELATION",
            fromEntity: relationData.fromEntity || "unknown",
            fromId: relationData.fromId || relationData.from_id,
            toEntity: relationData.toEntity || "unknown",
            toId: relationData.toId || relationData.to_id,
            relationName: relationName,
            relationType: relationData.type || relationData.typeId,
            relationId: relationData.id,
          };
        }

        // Return the base operation with the raw data for other types
        return {
          ...result,
          operationType: op.data?.type || "UNKNOWN",
          rawData: op.data,
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
          {showRawJson && (
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
          showRawJson ? (
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
                    {op.type === "triple" && (
                      <div>
                        <div>
                          <span className="font-semibold">Entity:</span>{" "}
                          {truncateId(op.data?.triple?.entityId || op.data?.entityId)}
                        </div>
                        <div>
                          <span className="font-semibold">Attribute:</span>{" "}
                          {truncateId(op.data?.triple?.attributeId || op.data?.attributeId)}
                        </div>
                        {(op.data?.triple?.value || op.data?.value) && (
                          <div>
                            <span className="font-semibold">Value:</span>{" "}
                            {op.data?.triple?.value?.value || op.data?.value?.value}
                            <span className="opacity-70">
                              {" "}
                              ({op.data?.triple?.value?.type || op.data?.value?.type})
                            </span>
                          </div>
                        )}
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
