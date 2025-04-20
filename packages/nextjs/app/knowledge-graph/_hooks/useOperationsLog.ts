import { useCallback, useRef, useState } from "react";

export interface Operation {
  id: string;
  type: "TRIPLE" | "RELATION";
  data: any;
  timestamp: number;
}

/**
 * Hook for managing knowledge graph operations
 * @returns Methods and state for tracking operations
 */
export const useOperationsLog = () => {
  const [operations, setOperations] = useState<Operation[]>([]);
  // Use a ref to access current operations from async callbacks
  const operationsRef = useRef<Operation[]>([]);

  // Keep the ref in sync with state
  operationsRef.current = operations;

  /**
   * Add a new operation to the log
   * @param operation Operation to add
   */
  const addOperation = useCallback((operation: Omit<Operation, "id" | "timestamp">) => {
    const newOperation: Operation = {
      ...operation,
      id: generateOperationId(),
      timestamp: Date.now(),
    };

    setOperations(prev => [...prev, newOperation]);
    return newOperation;
  }, []);

  /**
   * Remove an operation from the log
   * @param operationId ID of the operation to remove
   */
  const removeOperation = useCallback((operationId: string) => {
    setOperations(prev => prev.filter(op => op.id !== operationId));
  }, []);

  /**
   * Clear all operations from the log
   */
  const clearOperations = useCallback(() => {
    setOperations([]);
  }, []);

  /**
   * Get raw operations data for publishing
   * @returns Array of operation data objects
   */
  const getRawOperations = useCallback(() => {
    return operations.map(op => op.data);
  }, [operations]);

  /**
   * Track an operation with a backup mechanism for async contexts
   * @param operation Operation to track
   */
  const trackOperation = useCallback(
    (operation: Omit<Operation, "id" | "timestamp">) => {
      const op = addOperation(operation);

      // Return a function to check if the operation was properly added
      return {
        ensureTracked: () => {
          // Check if the operation exists in the current operations
          const exists = operationsRef.current.some(o => o.id === op.id);

          // If not, add it again (safety measure for async contexts)
          if (!exists) {
            console.warn(`Operation ${op.id} was not properly tracked. Re-adding it.`);
            setOperations(prev => [...prev, op]);
          }

          return op;
        },
      };
    },
    [addOperation],
  );

  return {
    operations,
    operationsRef,
    addOperation,
    removeOperation,
    clearOperations,
    getRawOperations,
    trackOperation,
  };
};

/**
 * Generate a unique ID for operations
 * @returns Unique ID string
 */
function generateOperationId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
