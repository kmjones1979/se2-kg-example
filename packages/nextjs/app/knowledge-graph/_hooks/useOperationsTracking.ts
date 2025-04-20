import { useCallback, useReducer, useRef, useState } from "react";

/**
 * A hook for reliable tracking of operations, with backup mechanisms
 * to ensure operations are not lost during asynchronous updates
 */
export const useOperationsTracking = () => {
  // Primary state for operations
  const [operations, setOperations] = useState<any[]>([]);
  const [operationsCount, setOperationsCount] = useState(0);

  // Backup tracking using ref to avoid losing operations during async updates
  const operationsRef = useRef<any[]>([]);

  // Force render utility for critical updates
  const [, forceUpdate] = useReducer(x => x + 1, 0);

  // Flag to use backup operations if primary state fails
  const [useBackupOperations, setUseBackupOperations] = useState(false);

  /**
   * Add an operation with reliable tracking
   */
  const trackOperation = useCallback((operation: any) => {
    // Ensure operation has timestamp and ID if they're missing
    const timestamp = operation.timestamp || Date.now();
    const id = operation.id || `op-${operation.type || "unknown"}-${timestamp}`;

    const enhancedOperation = {
      ...operation,
      timestamp,
      id,
    };

    // Add to primary state
    setOperations(prev => [...prev, enhancedOperation]);
    setOperationsCount(prev => prev + 1);

    // Also track in ref for safety
    operationsRef.current = [...operationsRef.current, enhancedOperation];

    // Force UI update to reflect changes immediately
    forceUpdate();

    return enhancedOperation;
  }, []);

  /**
   * Clear all tracked operations
   */
  const clearOperations = useCallback(() => {
    setOperations([]);
    setOperationsCount(0);
    operationsRef.current = [];
    setUseBackupOperations(false);
    forceUpdate();
  }, []);

  /**
   * Get the currently tracked operations
   * Uses backup if primary state is unreliable
   */
  const getOperations = useCallback(() => {
    if (useBackupOperations || (operations.length === 0 && operationsRef.current.length > 0)) {
      return operationsRef.current;
    }
    return operations;
  }, [operations, useBackupOperations]);

  /**
   * Check if operations in state match ref and use backup if needed
   */
  const checkOperationsIntegrity = useCallback(() => {
    const primaryCount = operations.length;
    const backupCount = operationsRef.current.length;

    // If we have operations in ref but none in state, switch to backup mode
    if (backupCount > 0 && primaryCount < backupCount) {
      console.log(`Operation count mismatch detected! Ref: ${backupCount}, State: ${primaryCount}`);
      setUseBackupOperations(true);
      return false;
    }

    return true;
  }, [operations.length]);

  /**
   * Debug utility to log operation state
   */
  const debugOperations = useCallback(() => {
    console.log("Operations state:", operations);
    console.log("Operations count:", operationsCount);
    console.log("Operations ref:", operationsRef.current);
    console.log("Using backup:", useBackupOperations);
    forceUpdate();
  }, [operations, operationsCount, useBackupOperations]);

  return {
    // Primary data
    operations: getOperations(),
    operationsCount: useBackupOperations ? operationsRef.current.length : operationsCount,

    // Actions
    trackOperation,
    clearOperations,
    checkOperationsIntegrity,
    debugOperations,

    // State management
    setUseBackupOperations,
    isUsingBackup: useBackupOperations,

    // Direct access to internal state (for advanced use cases)
    operationsRef,
  };
};
