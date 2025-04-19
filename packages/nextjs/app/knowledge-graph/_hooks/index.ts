export * from "./useGraphIds";
export * from "./useGraphOperations";
export * from "./useGraphPublishing";
export * from "./useGraphEntities";

/**
 * Knowledge Graph Hooks
 *
 * This module provides a set of React hooks for working with The Graph's
 * Knowledge Graph protocol. The hooks provide a convenient, developer-friendly
 * way to interact with the GRC-20 SDK.
 *
 * Available hooks:
 *
 * - useGraphIds: Generate and track IDs for entities, attributes, and relations
 * - useGraphOperations: Create and manage triple and relation operations
 * - useGraphPublishing: Handle the IPFS and blockchain publishing flow
 * - useGraphEntities: Create and manage entities with their attributes
 *
 * Usage example:
 *
 * ```tsx
 * import {
 *   useGraphIds,
 *   useGraphOperations,
 *   useGraphPublishing,
 *   useGraphEntities
 * } from './_hooks';
 *
 * const MyComponent = () => {
 *   const { generateEntityId } = useGraphIds();
 *   const { addTriple } = useGraphOperations();
 *   const { publishToIPFS } = useGraphPublishing();
 *   const { createPersonEntity } = useGraphEntities();
 *
 *   // Use the hooks...
 * };
 * ```
 */
