# Knowledge Graph Application

A decentralized application for interacting with The Graph Knowledge Graph protocol using the GRC-20 SDK.

## Overview

This application allows you to create, manage and publish knowledge graph data to IPFS and onchain using the [Graph Protocol](https://thegraph.com)'s GRC-20 standard. With this tool, you can:

-   Create Triple operations (entity-attribute-value data)
-   Create Relation operations (connecting entities)
-   Publish data to IPFS
-   Submit transactions to record data on-chain

## Table of Contents

-   [Hooks Documentation](#hooks-documentation)
    -   [useGraphOperations](#usegraphoperations)
    -   [useGraphPublishing](#usegraphpublishing)
    -   [useGraphIds](#usegraphids)
    -   [useEntityState](#useentitystate)
    -   [useOperationsLog](#useoperationslog)
    -   [useGraphRelations](#usegraphrelations)
-   [UI Components](#ui-components)
    -   [OperationsLog](#operationslog)
    -   [HookDemoCard](#hookdemocard)
    -   [TripleOperationsCard](#tripleoperationscard)
    -   [RelationOperationsCard](#relationoperationscard)
-   [Hooks Tutorial: Building an "Alice Likes Pizza" Application](#hooks-tutorial-building-an-alice-likes-pizza-application)
-   [Knowledge Graph Concepts](#knowledge-graph-concepts)
    -   [Core Concepts](#core-concepts)
    -   [ID System](#id-system)
    -   [Value Types & Data Formats](#value-types--data-formats)
    -   [Operation Types](#operation-types)
    -   [Publication Workflow](#publication-workflow)
-   [Traditional Interface Usage Guide](#traditional-interface-usage-guide)
-   [Configuration System](#configuration-system)
-   [Getting Started](#getting-started)
-   [Resources](#resources)

## Getting Started

### Prerequisites

-   Node.js (>= v18)
-   Yarn or NPM
-   A web3 wallet (MetaMask, etc.)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd <repository-name>
```

2. Install dependencies:

```bash
yarn install
```

3. Start the development server:

```bash
yarn start
```

4. Visit http://localhost:3000/knowledge-graph to use the application

## Hooks Documentation

This section provides detailed documentation for the hooks that power the knowledge graph application.

### useGraphOperations

This hook manages knowledge graph operations such as adding/removing triples and relations.

```typescript
import { useGraphOperations } from "~/app/knowledge-graph/_hooks/useGraphOperations";

// Inside your component
const {
    operations, // Array of all tracked operations
    operationsCount, // Count of operations
    lastStatus, // Most recent status message
    addTriple, // Function to add a triple
    removeTriple, // Function to remove a triple
    addRelation, // Function to add a relation
    removeRelation, // Function to remove a relation
    clearOperations, // Function to clear all operations
    setStatus, // Function to set status message
} = useGraphOperations();

// Example: Add a triple operation
const tripleResult = addTriple(
    "6vYQR7QmwkCMBbTwqFegDD", // Entity ID
    "PYR6HdNcwTJeeb3Ff2aFJa", // Attribute ID
    { type: "TEXT", value: "Alice" } // Value with type
);

// Example: Add a relation
const relationResult = addRelation(
    "6vYQR7QmwkCMBbTwqFegDD", // From Entity ID
    "8FdfX7N1sPRipLmFcBe3bn", // Relation Type ID
    "PhuQucw8Z2FeUZY3rhiGxm" // To Entity ID
);
```

### useGraphPublishing

This hook manages the publishing workflow: IPFS → Transaction data → Blockchain.

```typescript
import { useGraphPublishing } from "~/app/knowledge-graph/_hooks/useGraphPublishing";

// Inside your component
const {
    // State
    spaceId, // Current space ID
    operationName, // Name of operation being published
    ipfsCid, // IPFS CID after publishing
    txData, // Transaction data for on-chain commitment
    txHash, // Transaction hash after sending
    status, // Current status of publishing workflow
    step, // Current step in publishing workflow

    // Functions
    setSpaceId, // Update space ID
    setOperationName, // Set operation name
    publishToIPFS, // Publish operations to IPFS
    getCallData, // Get transaction data for the IPFS CID
    sendTransaction, // Send transaction with the provided data
    publishToChain, // Complete publishing flow (IPFS → Call Data → Transaction)
} = useGraphPublishing("YOUR_SPACE_ID");

// Example: Complete publishing workflow
const handlePublish = async () => {
    const rawOperations = operations.map((op) => op.data);
    const result = await publishToChain(rawOperations, "0xYourWalletAddress");

    if (result) {
        console.log(`Publication successful! Transaction hash: ${result}`);
    }
};
```

### useGraphIds

This hook provides utilities for generating IDs used in knowledge graph operations.

```typescript
import { useGraphIds } from "~/app/knowledge-graph/_hooks/useGraphIds";

// Inside your component
const {
    generateEntityId, // Generate a unique entity ID
    generateAttributeId, // Generate a unique attribute ID
    generateRelationTypeId, // Generate a unique relation type ID
    generateTripleId, // Generate a unique triple ID
    generateRelationId, // Generate a unique relation ID
} = useGraphIds();

// Example: Generate IDs
const entityId = generateEntityId();
const attributeId = generateAttributeId();
const relationTypeId = generateRelationTypeId();
```

### useGraphRelations

This hook manages relationships between entities in the knowledge graph.

```typescript
import { useGraphRelations } from "~/app/knowledge-graph/_hooks/useGraphRelations";

// Inside your component
const {
    relations, // Record of all relations
    relationsCount, // Count of relations
    createRelation, // Function to create a custom relation
    deleteRelation, // Function to delete a relation
    createLikesRelation, // Function to create a "likes" relation
    createOwnsRelation, // Function to create an "owns" relation
    getRelation, // Get relation by ID
    getRelationsForEntity, // Get all relations for an entity
    clearRelations, // Clear all relations
} = useGraphRelations();

// Example: Create a relation
const result = createRelation(
    "6vYQR7QmwkCMBbTwqFegDD", // From Entity ID
    "likes", // Relation type name
    "PhuQucw8Z2FeUZY3rhiGxm" // To Entity ID
);

// Example: Create a predefined relation
const likesResult = createLikesRelation(
    "6vYQR7QmwkCMBbTwqFegDD", // Person ID
    "PhuQucw8Z2FeUZY3rhiGxm" // Thing ID that is liked
);
```

### useEntityState

This hook manages entities and their attributes and relations.

```typescript
import { useEntityState } from "~/app/knowledge-graph/_hooks/useEntityState";

// Inside your component
const {
    entities, // Array of all entities
    relations, // Array of all relations
    createEntity, // Create a new entity
    addEntityAttribute, // Add an attribute to an entity
    createRelation, // Create a relation between entities
    removeRelation, // Remove a relation
    getEntity, // Get an entity by ID
    getRelation, // Get a relation by ID
    getEntityRelations, // Get all relations for an entity
} = useEntityState();

// Example: Create an entity with attributes
const person = createEntity("entity-123", "Alice");
const withAttributes = addEntityAttribute(
    "entity-123",
    "attribute-456",
    "TEXT",
    "Alice Johnson",
    "name"
);

// Example: Create a relation
const relation = createRelation(
    "person-123", // From entity ID
    "likes-relation-789", // Relation type ID
    "food-456", // To entity ID
    "relation-unique-id", // Optional relation ID
    "likes" // Optional relation name
);
```

### useOperationsLog

This hook manages a log of operations with tracking capabilities.

```typescript
import { useOperationsLog } from "~/app/knowledge-graph/_hooks/useOperationsLog";

// Inside your component
const {
    operations, // Array of all operations
    operationsRef, // Ref to operations (useful for async contexts)
    addOperation, // Add a new operation
    removeOperation, // Remove an operation
    clearOperations, // Clear all operations
    getRawOperations, // Get raw operations data (for publishing)
    trackOperation, // Track operation with backup mechanism
} = useOperationsLog();

// Example: Add and track operation
const newOp = addOperation({
    type: "TRIPLE",
    data: {
        /* operation data */
    },
});

// Example: Track with safety mechanism
const { ensureTracked } = trackOperation({
    type: "RELATION",
    data: {
        /* relation data */
    },
});

// Call ensureTracked later to verify the operation was added
ensureTracked();
```

## UI Components

### OperationsLog

Displays a log of operations with formatting options.

```tsx
import { OperationsLog } from "~/app/knowledge-graph/_components/OperationsLog";

// Inside your component render
<OperationsLog
    ops={operations} // Array of operations to display
    clearOps={clearOperations} // Function to clear operations
/>;
```

### HookDemoCard

Provides a demonstration of using hooks for knowledge graph operations.

```tsx
import { HookDemoCard } from "~/app/knowledge-graph/_components/HookDemoCard";

// Inside your component render
<HookDemoCard
    onStatusChange={(status) => console.log(`Status: ${status}`)}
    onOperationsCountChange={(count) => console.log(`Operations: ${count}`)}
/>;
```

### TripleOperationsCard

UI for creating and managing triple operations.

```tsx
import { TripleOperationsCard } from "~/app/knowledge-graph/_components/TripleOperationsCard";

// Inside your component render
<TripleOperationsCard />;
```

### RelationOperationsCard

UI for creating and managing relation operations.

```tsx
import { RelationOperationsCard } from "~/app/knowledge-graph/_components/RelationOperationsCard";

// Inside your component render
<RelationOperationsCard />;
```

## Hooks Tutorial: Building an "Alice Likes Pizza" Application

This tutorial walks through creating a simple React application that demonstrates the "Alice likes Pizza" example using our custom hooks. By following these steps, you'll build a minimal application that creates entities with types, attributes, and relationships.

### Setup Project Structure

First, create a new component that will incorporate all the necessary hooks:

```tsx
// AliceLikesPizzaDemo.tsx
import { useState } from "react";
import {
    useGraphIds,
    useGraphOperations,
    useGraphPublishing,
    useOperationsTracking,
} from "~/app/knowledge-graph/_hooks";
import { OperationsLog } from "~/app/knowledge-graph/_components/OperationsLog";

const AliceLikesPizzaDemo = () => {
    // State for entity IDs
    const [personId, setPersonId] = useState("");
    const [foodId, setFoodId] = useState("");

    // Status for user feedback
    const [status, setStatus] = useState("Ready");

    // Import necessary hooks
    const { generateEntityId, generateAttributeId, generateRelationTypeId } =
        useGraphIds();
    const { addTriple, addRelation } = useGraphOperations();
    const { operationsCount, operations, trackOperation, clearOperations } =
        useOperationsTracking();
    const {
        operationName,
        setOperationName,
        publishToIPFS,
        getCallData,
        sendTransaction,
        spaceId,
        setSpaceId,
    } = useGraphPublishing();

    // Main component logic will go here

    return (
        <div className="card bg-base-100 shadow-xl">
            <div className="card-body">
                <h2 className="card-title">Alice Likes Pizza Demo</h2>

                {/* UI components will go here */}

                <OperationsLog ops={operations} clearOps={clearOperations} />
            </div>
        </div>
    );
};

export default AliceLikesPizzaDemo;
```

### Step 1: Implement Entity Creation Functions

Next, add functions to create the person and food entities with proper type information:

```tsx
// Add to the AlicePizzaExample component

// Create Person Entity (Alice)
const createPersonEntity = () => {
    try {
        // Generate IDs
        const entityId = generateEntityId();
        setPersonId(entityId);

        // Create name attribute (with proper typing)
        const nameAttrId = generateAttributeId();

        // First, create a triple that defines this as a Person type
        const typeTripleData = {
            type: "SET_TRIPLE",
            triple: {
                entity: entityId,
                attribute: "type",
                value: {
                    type: "TEXT",
                    value: "Person",
                },
            },
        };

        // Track the type operation
        trackOperation(typeTripleData);

        // Then create the name triple
        const nameTripleData = {
            type: "SET_TRIPLE",
            triple: {
                entity: entityId,
                attribute: nameAttrId,
                value: {
                    type: "TEXT",
                    value: "Alice",
                },
                name: "name", // Add explicit name for better display
            },
        };

        // Track the name operation and add it through the hook
        trackOperation(nameTripleData);
        addTriple(entityId, nameAttrId, { type: "TEXT", value: "Alice" });

        setStatus(`Created person: Alice (${entityId})`);
        return entityId;
    } catch (error) {
        setStatus(
            `Error creating person: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
        return null;
    }
};

// Create Food Entity (Pizza)
const createFoodEntity = () => {
    try {
        // Generate IDs
        const entityId = generateEntityId();
        setFoodId(entityId);

        // Create type attribute (Food)
        const typeTripleData = {
            type: "SET_TRIPLE",
            triple: {
                entity: entityId,
                attribute: "type",
                value: {
                    type: "TEXT",
                    value: "Food",
                },
            },
        };

        // Track the type operation
        trackOperation(typeTripleData);

        // Create name attribute (Pizza)
        const nameAttrId = generateAttributeId();
        const nameTripleData = {
            type: "SET_TRIPLE",
            triple: {
                entity: entityId,
                attribute: nameAttrId,
                value: {
                    type: "TEXT",
                    value: "Pizza",
                },
                name: "name", // Add explicit name for better display
            },
        };

        // Track the name operation and add it through the hook
        trackOperation(nameTripleData);
        addTriple(entityId, nameAttrId, { type: "TEXT", value: "Pizza" });

        // Add an 'origin' attribute
        const originAttrId = generateAttributeId();
        const originTripleData = {
            type: "SET_TRIPLE",
            triple: {
                entity: entityId,
                attribute: originAttrId,
                value: {
                    type: "TEXT",
                    value: "Italian",
                },
                name: "origin", // Add explicit name for better display
            },
        };

        // Track and add the origin attribute
        trackOperation(originTripleData);
        addTriple(entityId, originAttrId, { type: "TEXT", value: "Italian" });

        setStatus(`Created food: Pizza (${entityId})`);
        return entityId;
    } catch (error) {
        setStatus(
            `Error creating food: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
        return null;
    }
};
```

### Step 2: Implement Relation Creation Function

Now, add the function to create a "likes" relation between Alice and Pizza:

```tsx
// Add within your component

// Create the "Likes" relation between Alice and Pizza
const createLikesRelation = () => {
    if (!personId || !foodId) {
        setStatus("Please create both Person and Food entities first");
        return null;
    }

    try {
        // Generate a relation type ID for "likes"
        const likesRelationTypeId = generateRelationTypeId();

        // Create the relation data
        const relationData = {
            type: "SET_RELATION",
            relation: {
                from: personId,
                relationType: likesRelationTypeId,
                to: foodId,
            },
        };

        // Track the relation operation
        trackOperation(relationData);

        // Add through the hook
        addRelation(personId, likesRelationTypeId, foodId);

        setStatus(`Created relation: Alice likes Pizza`);
        return true;
    } catch (error) {
        setStatus(
            `Error creating relation: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
        return null;
    }
};
```

### Step 3: Implement Publishing Functions

Add functions to handle the publishing workflow:

```tsx
// Add within your component

// Publish operations to IPFS
const handlePublishToIPFS = async () => {
    if (operationsCount === 0) {
        setStatus("No operations to publish");
        return;
    }

    // Set a descriptive name for the edit
    setOperationName("Alice Likes Pizza Example");

    try {
        setStatus("Publishing to IPFS...");
        const ipfsCid = await publishToIPFS(operations);

        if (ipfsCid) {
            setStatus(`Published to IPFS: ${ipfsCid}`);
        } else {
            setStatus("Failed to publish to IPFS");
        }
    } catch (error) {
        setStatus(
            `IPFS error: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
};

// Get transaction data for the published operations
const handleGetTransactionData = async () => {
    try {
        setStatus("Getting transaction data...");
        const data = await getCallData();

        if (data) {
            setStatus("Transaction data ready");
        } else {
            setStatus("Failed to get transaction data");
        }
    } catch (error) {
        setStatus(
            `Transaction data error: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
};

// Send the transaction to the blockchain
const handleSendTransaction = async () => {
    try {
        setStatus("Sending transaction...");
        const txHash = await sendTransaction();

        if (txHash) {
            setStatus(`Transaction sent: ${txHash}`);
        } else {
            setStatus("Failed to send transaction");
        }
    } catch (error) {
        setStatus(
            `Transaction error: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
};

// Run the full demo in sequence
const runFullDemo = () => {
    setStatus("Starting demo...");
    clearOperations();

    // First create Alice
    const aliceId = createPersonEntity();
    if (!aliceId) return;

    // Then create Pizza
    const pizzaId = createFoodEntity();
    if (!pizzaId) return;

    // Finally create the relation
    createLikesRelation();
};
```

### Step 4: Add UI Components

Complete the component's UI structure:

```tsx
// Replace the UI placeholder in the return statement

return (
    <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
            <h2 className="card-title">Alice Likes Pizza Demo</h2>

            {/* Space ID and status */}
            <div className="flex flex-col md:flex-row justify-between mb-4">
                <div className="form-control max-w-xs">
                    <label className="label">
                        <span className="label-text">Space ID</span>
                    </label>
                    <input
                        type="text"
                        className="input input-bordered input-sm"
                        value={spaceId}
                        onChange={(e) => setSpaceId(e.target.value)}
                        placeholder="Enter space ID"
                    />
                </div>
                <div className="mt-4 md:mt-0">
                    <div className="text-sm opacity-70">Status:</div>
                    <div className="badge badge-lg">{status}</div>
                </div>
            </div>

            {/* Entity creation buttons */}
            <div className="divider">Create Entities and Relations</div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="card border p-4">
                    <h3 className="font-bold mb-2">Step 1: Create Person</h3>
                    <button
                        className="btn btn-primary w-full"
                        onClick={createPersonEntity}
                    >
                        Create Alice
                    </button>
                    {personId && (
                        <div className="mt-2 text-xs font-mono break-all">
                            ID: {personId}
                        </div>
                    )}
                </div>

                <div className="card border p-4">
                    <h3 className="font-bold mb-2">Step 2: Create Food</h3>
                    <button
                        className="btn btn-primary w-full"
                        onClick={createFoodEntity}
                    >
                        Create Pizza
                    </button>
                    {foodId && (
                        <div className="mt-2 text-xs font-mono break-all">
                            ID: {foodId}
                        </div>
                    )}
                </div>

                <div className="card border p-4">
                    <h3 className="font-bold mb-2">Step 3: Create Relation</h3>
                    <button
                        className="btn btn-primary w-full"
                        onClick={createLikesRelation}
                        disabled={!personId || !foodId}
                    >
                        Create "Likes" Relation
                    </button>
                </div>
            </div>

            <div className="mt-4">
                <button className="btn btn-accent w-full" onClick={runFullDemo}>
                    Run Full Demo
                </button>
            </div>

            {/* Publishing workflow */}
            <div className="divider">Publish to Blockchain</div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                    className="btn btn-secondary"
                    onClick={handlePublishToIPFS}
                    disabled={operationsCount === 0}
                >
                    1. Publish to IPFS
                </button>

                <button
                    className="btn btn-secondary"
                    onClick={handleGetTransactionData}
                >
                    2. Get Transaction Data
                </button>

                <button
                    className="btn btn-secondary"
                    onClick={handleSendTransaction}
                >
                    3. Send Transaction
                </button>
            </div>

            {/* Operations log */}
            <div className="divider">Operations Log ({operationsCount})</div>
            <OperationsLog ops={operations} clearOps={clearOperations} />
        </div>
    </div>
);
```

### Step 5: Using the Demo Component

To use this component in your application:

```tsx
// In your app page
import AliceLikesPizzaDemo from "~/components/AliceLikesPizzaDemo";

const DemoPage = () => {
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-8">
                Knowledge Graph Hooks Demo
            </h1>
            <AliceLikesPizzaDemo />
        </div>
    );
};

export default DemoPage;
```

### Key Learnings from this Example

This tutorial demonstrates several important concepts:

1. **Entity Type Tagging**: Uses the `type` attribute to explicitly tag entities as "Person" or "Food"
2. **Attribute Naming**: Uses the `name` property to provide human-readable names for attributes
3. **Operation Tracking**: Uses both the hooks API (`addTriple`, `addRelation`) and manual tracking to ensure operations are properly recorded
4. **Publishing Workflow**: Shows the three-step process of IPFS → Transaction Data → Blockchain
5. **Error Handling**: Implements comprehensive error handling with user-friendly status messages
6. **UI/UX Considerations**: Provides clear step-by-step interface with appropriate button disabling

By following this pattern, you can build more complex knowledge graph applications that maintain clean, well-structured data with explicit entity types and attribute names.

## Knowledge Graph Concepts

### Core Concepts

The Graph Knowledge Graph protocol uses a graph data structure where:

-   **Entities** represent nodes (e.g., people, places, things)
-   **Attributes** define properties of entities (e.g., name, age, color)
-   **Relations** connect entities to each other (e.g., "authored", "belongs_to")
-   **Triples** bind entities, attributes, and values together (representing facts like "Entity X has Attribute Y with Value Z")

### ID System

Knowledge graphs use unique identifiers to maintain data integrity:

1. **Entity IDs**: Unique identifiers for entities (e.g., "A9QizqoXSqjfPUBjLoPJa2")
2. **Attribute IDs**: Identifiers for properties (e.g., "GpnQE6H64aSfIE2ZRqBNZf")
3. **Relation Type IDs**: Identifiers for the nature of connections (e.g., "Cs3KPlZHREpMZLkXPb2nsU")
4. **Relation IDs**: Optional identifiers for specific relations

### Value Types & Data Formats

The GRC-20 protocol supports several value types:

| Type     | Description            | Example                  |
| -------- | ---------------------- | ------------------------ |
| TEXT     | Plain text strings     | `"Hello, world"`         |
| NUMBER   | Numeric values         | `42` or `3.14159`        |
| URL      | Web addresses          | `"https://example.com"`  |
| TIME     | ISO timestamps         | `"2023-05-15T14:30:00Z"` |
| POINT    | Geographic coordinates | `"40.7128,-74.0060"`     |
| CHECKBOX | Boolean values         | `true` or `false`        |

Additionally, for UI purposes, this application supports:

-   **RELATION** - Used to link entities (converted to TEXT when interacting with the SDK)

### Operation Types

Two primary operation types are supported:

1. **Triple Operations**: Associate an entity with an attribute value
2. **Relation Operations**: Connect two entities through a defined relationship type

### Publication Workflow

Operations are batched and published to IPFS before being committed on-chain:

1. **Batch Operations**: Group related operations together
2. **Publish to IPFS**: Store operations on the InterPlanetary File System
3. **Get Transaction Data**: Prepare the transaction for blockchain submission
4. **Send Transaction**: Commit the operations to the blockchain

## Traditional Interface Usage Guide

For those who prefer the traditional interface over hooks, please refer to the [Step-by-Step Tutorial: Creating Entities and Relations](#step-by-step-tutorial-creating-entities-and-relations) section later in this document.

## Configuration System

The application uses a centralized configuration system through `hypergraph.config.ts` located in the NextJS package root. This provides a single source of truth for all hypergraph-related settings.

### Configuration File Structure

The configuration file includes:

```typescript
// hypergraph.config.ts
const hypergraphConfig = {
    // Default network to use (TESTNET or MAINNET)
    defaultNetwork: "MAINNET",

    // Default space ID to use
    defaultSpaceId: "LB1JjNpxXBjP7caanTx3bP",

    // API endpoints by network
    endpoints: {
        TESTNET: {
            url: "https://api-testnet.grc-20.thegraph.com",
            description: "The Graph Protocol Testnet API",
        },
        MAINNET: {
            url: "https://hypergraph.up.railway.app",
            description: "Hypergraph Railway Mainnet API",
        },
    },

    // Whether to use mock data in development
    useMockData:
        process.env.NODE_ENV === "development" &&
        process.env.USE_MOCK_DATA === "true",

    // Mock data for fallback
    mockData: {
        txData: {
            to: "0x731a10897d267e19b34503ad902d0a29173ba4b1",
            data: "0x4554480000000000000000000000000000000000000000000000000000000000",
        },
    },
};
```

### Using the Configuration

The configuration provides helper functions to access settings:

```typescript
// Import in any file
import hypergraphConfig, {
    getApiEndpoint,
    getCalldataApiUrl,
    getDefaultSpaceId,
    getDefaultNetwork,
    shouldUseMockData,
} from "~~/hypergraph.config";

// Get the API endpoint for a network
const apiUrl = getApiEndpoint("MAINNET");
// => "https://hypergraph.up.railway.app"

// Get the full calldata API URL for a space and network
const calldataUrl = getCalldataApiUrl("YOUR_SPACE_ID", "MAINNET");
// => "https://hypergraph.up.railway.app/space/YOUR_SPACE_ID/edit/calldata"
```

## Resources

-   [The Graph Knowledge Graph Documentation - COMING SOON]()
-   [GRC-20 SDK GitHub Repository](https://github.com/graphprotocol/grc-20-ts)
-   [The Graph Official Website](https://thegraph.com)
-   [Scaffold-ETH 2 Documentation](https://docs.scaffoldeth.io)
