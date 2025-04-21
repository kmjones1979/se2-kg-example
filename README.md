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
    -   [useGraphRelations](#usegraphrelations)
    -   [useEntityState](#useentitystate)
    -   [useOperationsLog](#useoperationslog)
    -   [useOperationsTracking](#useoperationstracking)
    -   [useExpandableSections](#useexpandablesections)
    -   [useEntityIdManagement](#useentityidmanagement)
    -   [useOperationsPublishing](#useoperationspublishing)
    -   [useGraphApi](#usegraphapi)
    -   [useEntityIdState](#useentityidstate)
-   [UI Components](#ui-components)
    -   [OperationsLog](#operationslog)
    -   [HookDemoCard](#hookdemocard)
    -   [TripleOperationsCard](#tripleoperationscard)
    -   [RelationOperationsCard](#relationoperationscard)
    -   [ConnectedAddressCard](#connectedaddresscard)
    -   [OperationDetailsCard](#operationdetailscard)
    -   [PublishCard](#publishcard)
    -   [ExpandableCard](#expandablecard)
    -   [PageHeader](#pageheader)
    -   [StatusFooter](#statusfooter)
    -   [KnowledgeGraphHelp](#knowledgegraphhelp)
    -   [IdHelpCard](#idhelpcard)
    -   [OperationsTabCard](#operationstabcard)
    -   [TraditionalInterface](#traditionalinterface)
-   [Hooks Tutorial: Building an "Alice Likes Pizza" Application](#hooks-tutorial-building-an-alice-likes-pizza-application)
-   [Knowledge Graph Concepts](#knowledge-graph-concepts)
    -   [Core Concepts](#core-concepts)
    -   [ID System](#id-system)
    -   [Value Types & Data Formats](#value-types--data-formats)
    -   [Relation Examples](#relation-examples)
    -   [Operation Types](#operation-types)
    -   [Publication Workflow](#publication-workflow)
-   [Traditional Interface Usage Guide](#traditional-interface-usage-guide)
-   [Configuration System](#configuration-system)
-   [Getting Started](#getting-started)
-   [Resources](#resources)
-   [GEO Smart Account Integration](#geo-smart-account-integration)

## Getting Started

### Prerequisites

-   Node.js (>= v18)
-   Yarn or NPM
-   A web3 wallet (MetaMask, etc.)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/kmjones1979/se2-kg-example.git
cd se2-kg-example
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

> **Note:** The application now defaults to showing the Modern Hooks interface first. You can switch to the Traditional interface using the toggle button in the header.

### Configuration File Structure

The configuration file includes:

> Note: The API endpoints could change be sure to reference The Graph GRC-20-ts project for updates

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
            url: "https://api-testnet.grc-20.thegraph.com",
            description: "The Graph Protocol Mainnet API",
        },
    },

    // Whether to use mock data in development
    useMockData:
        process.env.NODE_ENV === "development" &&
        process.env.USE_MOCK_DATA === "true",

    // Smart account settings
    useSmartAccount: true, // Set to true to always use smart account by default
    geoPrivateKey: process.env.GEO_PRIVATE_KEY || "", // Get private key from environment variable

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
    shouldUseSmartAccount,
    getGeoPrivateKey,
} from "~~/hypergraph.config";

// Get the API endpoint for a network
const apiUrl = getApiEndpoint("MAINNET");
// => "https://hypergraph.up.railway.app"

// Get the full calldata API URL for a space and network
const calldataUrl = getCalldataApiUrl("YOUR_SPACE_ID", "MAINNET");
// => "https://hypergraph.up.railway.app/space/YOUR_SPACE_ID/edit/calldata"

// Check if smart account should be used
const useSmartAccount = shouldUseSmartAccount();
// => true (or whatever is set in the config)

// Get the GEO private key
const geoPrivateKey = getGeoPrivateKey();
// => The private key from environment variable GEO_PRIVATE_KEY
```

## Hooks Documentation

This section provides detailed documentation for the hooks that power the knowledge graph application.

### useGraphOperations

This hook manages knowledge graph operations such as adding/removing triples and relations.

```typescript
import { useGraphOperations } from "~/app/knowledge-graph/_hooks/useGraphOperations";
import { useGraphIds } from "~/app/knowledge-graph/_hooks/useGraphIds";

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

// Get ID generators
const { generateEntityId, generateAttributeId, generateRelationTypeId } =
    useGraphIds();

// First, generate the necessary IDs
const entityId = generateEntityId(); // "6vYQR7QmwkCMBbTwqFegDD"
const attributeId = generateAttributeId(); // "PYR6HdNcwTJeeb3Ff2aFJa"

// Then use those IDs to create a triple
const tripleResult = addTriple(
    entityId, // Entity ID generated above
    attributeId, // Attribute ID generated above
    { type: "TEXT", value: "Alice" } // Value with type
);

// For relations, we need IDs for both entities and the relation type
const personEntityId = generateEntityId();
const foodEntityId = generateEntityId();
const likesRelationTypeId = generateRelationTypeId();

// Create a relation between entities
const relationResult = addRelation(
    personEntityId, // From Entity ID
    likesRelationTypeId, // Relation Type ID
    foodEntityId // To Entity ID
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

// Example: Complete publishing workflow with a regular wallet
const handlePublish = async () => {
    const rawOperations = operations.map((op) => op.data);
    const result = await publishToChain(rawOperations, "0xYourWalletAddress");

    if (result) {
        console.log(`Publication successful! Transaction hash: ${result}`);
    }
};

// Example: Complete publishing workflow with a GEO smart account
const handlePublishWithSmartAccount = async () => {
    const rawOperations = operations.map((op) => op.data);
    // Use smart account by setting useSmartAccount to true and providing private key
    const result = await publishToChain(
        rawOperations,
        "0xYourWalletAddress",
        true, // useSmartAccount
        "0xYourGeoPrivateKey" // privateKey
    );

    if (result) {
        console.log(
            `Publication successful with smart account! Transaction hash: ${result}`
        );
    }
};

// Example: Get smart account settings from config
import { shouldUseSmartAccount, getGeoPrivateKey } from "~~/hypergraph.config";

const handlePublishWithConfigSettings = async () => {
    const rawOperations = operations.map((op) => op.data);
    const useSmartAccount = shouldUseSmartAccount();
    const geoPrivateKey = getGeoPrivateKey();

    const result = await publishToChain(
        rawOperations,
        "0xYourWalletAddress",
        useSmartAccount,
        geoPrivateKey
    );

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

> **Note on ID Generation**: All IDs used in the knowledge graph (entity IDs, attribute IDs, relation type IDs) should be generated using the `useGraphIds` hook. This hook wraps the SDK's `Id.generate()` function and provides tracking capabilities. Always use the appropriate generator function for the type of ID you need, as shown in the examples throughout this documentation.

### useGraphRelations

This hook manages relationships between entities in the knowledge graph.

```typescript
import { useGraphRelations } from "~/app/knowledge-graph/_hooks/useGraphRelations";
import { useGraphIds } from "~/app/knowledge-graph/_hooks/useGraphIds";

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

// Generate entity IDs first
const { generateEntityId } = useGraphIds();
const personId = generateEntityId();
const pizzaId = generateEntityId();

// Create a relation between entities
const result = createRelation(
    personId, // From Entity ID
    "likes", // Relation type name
    pizzaId // To Entity ID
);

// Or use the specialized helper function
const likesResult = createLikesRelation(
    personId, // Person ID
    pizzaId // Thing ID that is liked
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

### useOperationsTracking

This hook tracks operations with backup mechanisms to ensure operations are properly recorded even in async contexts.

```typescript
import { useOperationsTracking } from "~/app/knowledge-graph/_hooks/useOperationsTracking";

// Inside your component
const {
    operations, // Array of operations
    operationsCount, // Count of operations
    operationsRef, // Ref to operations (useful for async contexts)
    addOperation, // Add a new operation
    trackOperation, // Track operation with safety mechanisms
    clearOperations, // Clear all operations
    isUsingBackup, // Whether the hook is using backup operations storage
    setUseBackupOperations, // Manually switch to backup operations
} = useOperationsTracking();

// Example: Track an operation with safety mechanisms
const { ensureTracked } = trackOperation({
    type: "TRIPLE",
    triple: {
        entity: "entity123",
        attribute: "attr456",
        value: { type: "TEXT", value: "Example" },
    },
});

// Later, verify the operation was tracked successfully
ensureTracked();
```

### useExpandableSections

This hook manages expandable UI sections with state tracking.

```typescript
import { useExpandableSections } from "~/app/knowledge-graph/_hooks/useExpandableSections";

// Inside your component
const {
    expandedSections, // Current expanded state of sections
    toggleSection, // Toggle a section's expanded state
    expandSection, // Expand a specific section
    collapseSection, // Collapse a specific section
    expandAll, // Expand all sections
    collapseAll, // Collapse all sections
    resetToDefault, // Reset to initial state
} = useExpandableSections({
    tripleOperations: true, // Initially expanded
    relationOperations: false, // Initially collapsed
});

// Example: Toggle a section
<button onClick={() => toggleSection("tripleOperations")}>
    Toggle Triple Operations
</button>;
```

### useEntityIdManagement

This hook provides utilities for managing entity IDs with status updates.

```typescript
import { useEntityIdManagement } from "~/app/knowledge-graph/_hooks/useEntityIdManagement";

// Inside your component
const {
    entityId, // Current entity ID
    attributeId, // Current attribute ID
    relationTypeId, // Current relation type ID
    relationId, // Current relation ID
    handleGenerateEntityID, // Generate a new entity ID
    handleGenerateAttributeID, // Generate a new attribute ID
    handleGenerateRelationTypeID, // Generate a new relation type ID
    handleGenerateRelationID, // Generate a new relation ID
    handleGenerateID, // Generate a generic ID
} = useEntityIdManagement((status) => console.log(status));

// Example: Generate an entity ID with status update
<button onClick={handleGenerateEntityID}>Generate Entity ID</button>;
```

### useOperationsPublishing

This hook simplifies the publishing workflow for operations.

```typescript
import { useOperationsPublishing } from "~/app/knowledge-graph/_hooks/useOperationsPublishing";

// Inside your component
const {
    publishOperations, // Function to publish operations to IPFS and blockchain
    isPublishing, // Whether a publish operation is in progress
    publishingStatus, // Current status of the publishing operation
    publishingError, // Error that occurred during publishing, if any
    transactionHash, // Transaction hash after successful publishing
} = useOperationsPublishing();

// Example: Publish operations
async function handlePublish(operations) {
    try {
        const txHash = await publishOperations(operations, "My Operations");
        console.log("Published with transaction hash:", txHash);
    } catch (error) {
        console.error("Error publishing:", error);
    }
}
```

### useGraphApi

This hook provides direct access to the Graph API endpoints.

```typescript
import { useGraphApi } from "~/app/knowledge-graph/_hooks/useGraphApi";

// Inside your component
const {
    spaceId, // Current space ID
    setSpaceId, // Update the space ID
    getEditCalldata, // Get calldata for an IPFS edit
    useMockData, // Whether mock data is being used
    setUseMockData, // Toggle mock data usage
} = useGraphApi("YOUR_SPACE_ID");

// Example: Get calldata for a transaction
async function getTransactionData(ipfsCid) {
    try {
        const calldata = await getEditCalldata(ipfsCid, "TESTNET");
        console.log("Transaction data:", calldata);
        return calldata;
    } catch (error) {
        console.error("Error getting calldata:", error);
    }
}
```

### useEntityIdState

This hook manages entity ID state with notifications and validation.

```typescript
import { useEntityIdState } from "~/app/knowledge-graph/_hooks/useEntityIdState";

// Inside your component
const {
    entityId, // Current entity ID
    setEntityId, // Update entity ID with validation
    attributeId, // Current attribute ID
    setAttributeId, // Update attribute ID with validation
    relationTypeId, // Current relation type ID
    setRelationTypeId, // Update relation type ID with validation
    relationId, // Current relation ID
    setRelationId, // Update relation ID with validation
    handleGenerateEntityID, // Generate entity ID with notification
    handleGenerateAttributeID, // Generate attribute ID with notification
    handleGenerateRelationTypeID, // Generate relation type ID with notification
    handleGenerateRelationID, // Generate relation ID with notification
} = useEntityIdState({
    onStatusUpdate: (message) => console.log(message),
    validateIds: true,
});

// Example: Generate a new entity ID with notification
<button onClick={handleGenerateEntityID}>Generate Entity ID</button>;
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

### ConnectedAddressCard

A card component that displays the currently connected wallet address.

```tsx
import { ConnectedAddressCard } from "~/app/knowledge-graph/_components/ConnectedAddressCard";

// Inside your component render
<ConnectedAddressCard />;
```

### OperationDetailsCard

Displays detailed information about knowledge graph operations.

```tsx
import { OperationDetailsCard } from "~/app/knowledge-graph/_components/OperationDetailsCard";

// Inside your component render
<OperationDetailsCard
    operations={operations}
    title="Operation Details"
    expanded={true}
/>;
```

### PublishCard

Provides UI for publishing operations to IPFS and blockchain.

```tsx
import { PublishCard } from "~/app/knowledge-graph/_components/PublishCard";

// Inside your component render
<PublishCard
    ipfsCid={ipfsCid}
    txData={txData}
    txHash={txHash}
    txReceipt={txReceipt}
    activeStep={activeStep}
    publishToIPFS={handlePublishToIPFS}
    getCallData={handleGetCallData}
    sendTransaction={handleSendTransaction}
    publishToChain={handlePublishToChain} // Optional - enables one-click smart account publishing
    ops={operations}
    operationName={operationName}
    spaceId={spaceId}
/>;

// Example handler for publishToChain
const handlePublishToChain = async (operations) => {
    // Get smart account configuration from hypergraph config
    const useSmartAccount = shouldUseSmartAccount();
    const geoPrivateKey = getGeoPrivateKey();

    try {
        return await publishToChain(
            operations,
            walletAddress,
            useSmartAccount,
            geoPrivateKey
        );
    } catch (error) {
        console.error("Error publishing to chain:", error);
        return null;
    }
};
```

When the `publishToChain` prop is provided, the component will display a one-click "Publish Operations with Smart Account" button that combines all publishing steps into a single action.

#### Transaction Status Display

The PublishCard provides clear feedback on transaction status:

-   When a transaction is sent (hash exists) but not yet confirmed (receipt not available), it displays "Success! Transaction sent." with a checkmark icon
-   Once confirmed, it shows "Confirmed in block [blockNumber]"

This immediate success feedback helps users understand their transaction was successfully submitted to the network, while waiting for the final confirmation.

### ExpandableCard

A reusable card component with expand/collapse functionality.

```tsx
import { ExpandableCard } from "~/app/knowledge-graph/_components/ExpandableCard";

// Inside your component render
<ExpandableCard title="My Expandable Section" defaultExpanded={true}>
    <div>Content goes here</div>
</ExpandableCard>;
```

### PageHeader

A header component with title, subtitle, and mode toggle.

```tsx
import { PageHeader } from "~/app/knowledge-graph/_components/PageHeader";

// Inside your component render
<PageHeader
    title="Knowledge Graph"
    subtitle="Create and publish knowledge graph data"
    showHookDemo={showHookDemo}
    setShowHookDemo={setShowHookDemo}
/>;
```

### StatusFooter

A fixed footer showing status updates and operation counts.

```tsx
import { StatusFooter } from "~/app/knowledge-graph/_components/StatusFooter";

// Inside your component render
<StatusFooter
    status={status}
    operationsCount={operationsCount}
    onOperationsClick={() => setShowOperations(true)}
    isHookDemo={isUsingHooks}
/>;
```

### KnowledgeGraphHelp

Provides helpful information and guidance about the knowledge graph.

```tsx
import { KnowledgeGraphHelp } from "~/app/knowledge-graph/_components/KnowledgeGraphHelp";

// Inside your component render
<KnowledgeGraphHelp />;
```

### IdHelpCard

Displays information about ID generation and usage.

```tsx
import { IdHelpCard } from "~/app/knowledge-graph/_components/IdHelpCard";

// Inside your component render
<IdHelpCard />;
```

### OperationsTabCard

A card component with tabs for different operation types.

```tsx
import { OperationsTabCard } from "~/app/knowledge-graph/_components/OperationsTabCard";

// Inside your component render
<OperationsTabCard
    defaultTab="triple"
    tripleContent={<TripleOperationsCard />}
    relationContent={<RelationOperationsCard />}
/>;
```

### TraditionalInterface

A comprehensive component that provides the traditional knowledge graph interface.

```tsx
import { TraditionalInterface } from "~/app/knowledge-graph/_components/TraditionalInterface";

// Inside your component render
<TraditionalInterface
    operations={operations}
    entityIds={entityIds}
    setEntityIds={setEntityIds}
    clearOperations={clearOperations}
    onStatusChange={(status) => setStatus(status)}
    txData={txData}
    txHash={txHash}
    publishToIPFS={publishToIPFS}
    getCallData={getCallData}
    sendTransaction={sendTransaction}
/>;
```

## Hooks Tutorial: Building an "Alice Likes Pizza" Application

This tutorial walks through creating a simple React application that demonstrates the "Alice likes Pizza" example using our custom hooks. By following these steps, you'll build a minimal application that creates entities with types, attributes, and relationships.

### Setup Project Structure

First, create a new component that will incorporate all the necessary hooks:

```tsx
// AliceLikesPizzaDemo.tsx
import { useState } from "react";
import { OperationsLog } from "~~/app/knowledge-graph/_components/OperationsLog";
import {
    useGraphIds,
    useGraphOperations,
    useGraphPublishing,
    useOperationsTracking,
} from "~~/app/knowledge-graph/_hooks";

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
    const { operations, trackOperation, clearOperations } =
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
// Create Person Entity (Alice)
const createPersonEntity = () => {
    try {
        // Generate IDs
        const entityId = generateEntityId();
        setPersonId(entityId);

        // Create type triple first (Person type)
        const typeTripleData = {
            type: "SET_TRIPLE",
            triple: {
                entity: entityId,
                attribute: "type", // Reserved attribute name
                value: {
                    type: "TEXT",
                    value: "Person",
                },
                // IMPORTANT: Don't include 'name' field inside the triple
            },
        };

        // Track the type operation
        trackOperation(typeTripleData);

        // Now create name attribute
        const nameAttrId = generateAttributeId();

        // Create name triple without 'name' field in the triple itself
        const nameTripleData = {
            type: "SET_TRIPLE",
            triple: {
                entity: entityId,
                attribute: nameAttrId,
                value: {
                    type: "TEXT",
                    value: "Alice",
                },
                // No name field here - it causes SDK errors
            },
            // Use a separate metadata object if you need to track attribute names
            metadata: {
                attributeName: "name",
            },
        };

        // Track the name operation
        trackOperation(nameTripleData);

        // Add through the hooks API
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
                attribute: "type", // Reserved attribute
                value: {
                    type: "TEXT",
                    value: "Food",
                },
                // No name field here
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
                // No name field here
            },
            metadata: {
                attributeName: "name",
            },
        };

        // Track and add the name operation
        trackOperation(nameTripleData);
        addTriple(entityId, nameAttrId, { type: "TEXT", value: "Pizza" });

        // Add origin attribute
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
                // No name field here
            },
            metadata: {
                attributeName: "origin",
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
// Create the "Likes" relation between Alice and Pizza
const createLikesRelation = () => {
    if (!personId || !foodId) {
        setStatus("Please create both Person and Food entities first");
        return null;
    }

    try {
        // Generate a relation type ID
        const likesRelationTypeId = generateRelationTypeId();

        // Create the relation data
        const relationData = {
            type: "SET_RELATION",
            relation: {
                from: personId,
                relationType: likesRelationTypeId,
                to: foodId,
            },
            // Store relation name in metadata instead of the relation object
            metadata: {
                relationName: "likes",
            },
        };

        // Track the relation operation
        trackOperation(relationData);

        // Add through the hooks API
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

Next, let's implement the publishing functions, taking care to handle only SDK-compatible data:

```tsx
// Publish all operations to IPFS and blockchain
const handlePublish = async () => {
    if (operations.length === 0) {
        setStatus("No operations to publish");
        return;
    }

    // Set a descriptive name for the edit
    setOperationName("Alice Likes Pizza Example");

    try {
        setStatus("Publishing to blockchain...");
        // Get only the data field from operations, not the metadata
        const rawOps = operations.map((op) => op.data);

        // Get smart account configuration
        const useSmartAccount = shouldUseSmartAccount();
        const geoPrivateKey = getGeoPrivateKey();

        // Use one-step publishing with smart account if configured
        if (useSmartAccount && geoPrivateKey) {
            console.log("Using smart account for publishing");
            const txHash = await publishToChain(
                rawOps,
                connectedAddress,
                useSmartAccount,
                geoPrivateKey
            );

            if (txHash) {
                setStatus(`Transaction sent with smart account: ${txHash}`);
                return;
            } else {
                setStatus("Failed to publish with smart account");
            }
        } else {
            // Fallback to manual three-step process
            console.log("Using manual publishing process");
            await handlePublishToIPFS();
        }
    } catch (error) {
        setStatus(
            `Publishing error: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
        console.error("Publishing error:", error);
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

    // Set operation name for publishing
    setOperationName("Alice Likes Pizza Demo");
};
```

### Step 4: Add UI Components

Complete the component's UI structure:

```tsx
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
                    onClick={handlePublish}
                    disabled={operations.length === 0}
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
            <div className="divider">Operations Log ({operations.length})</div>
            <OperationsLog ops={operations} clearOps={clearOperations} />
        </div>
    </div>
);
```

### Step 5: Using the Demo Component

Create a page to integrate the demo component:

```tsx
// In app/alice-demo/page.tsx
"use client";

import AliceLikesPizzaDemo from "./_components/AliceLikesPizzaDemo";

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

### Key Implementation Details

1. **SDK Compatibility**:

    - We keep the triple objects clean with only `entity`, `attribute`, and `value` fields
    - We store metadata like attribute names separately in a `metadata` object
    - When publishing to IPFS, we extract only the SDK-compatible `data` field

2. **Proper ID Generation**:

    - All IDs are generated using the appropriate functions from `useGraphIds`
    - Entity IDs, attribute IDs, and relation type IDs are tracked for reuse

3. **Error Handling**:

    - Each function includes comprehensive error handling
    - Status messages provide feedback to the user

4. **Publishing Workflow**:
    - The three-step process (IPFS → Transaction Data → Blockchain) is clearly defined
    - Each step depends on the successful completion of the previous one

Follow this pattern to create your own knowledge graph applications!

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

### Relation Examples

Here are examples of how entities can be related:

-   Person `→ WORKS_AT →` Company
-   Person `→ KNOWS →` Person
-   Book `→ AUTHORED_BY →` Person
-   City `→ LOCATED_IN →` Country

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

While the application now defaults to showing the Modern Hooks interface first, you can still access the Traditional interface by clicking the "Switch to Traditional Interface" button in the header. For those who prefer the traditional interface over hooks, please refer to the [Step-by-Step Tutorial: Creating Entities and Relations](#step-by-step-tutorial-creating-entities-and-relations) section later in this document.

## Configuration System

The application uses a centralized configuration system through `hypergraph.config.ts` located in the NextJS package root. This provides a single source of truth for all hypergraph-related settings.

## GEO Smart Account Integration

The application supports using GEO smart accounts for publishing operations to the chain, which can simplify the transaction process.

### Setting Up Your GEO Private Key

To use a GEO smart account, you need to:

1. Get your GEO private key from <https://www.geobrowser.io/export-wallet>
2. Set it as an environment variable:

```bash
# In your .env file
GEO_PRIVATE_KEY=your_private_key_here
```

3. Make sure `useSmartAccount` is set to `true` in your hypergraph.config.ts file (enabled by default).

### Using Smart Accounts in the UI

The application provides two ways to publish operations using smart accounts:

1. **One-Click Publish**: The Traditional Interface now includes a "Publish Operations with Smart Account" button that combines all publishing steps.

2. **Step-by-Step Process**: You can still use the manual three-step process (IPFS → Get Transaction Data → Send Transaction) if you need more control.

### Programmatic Smart Account Usage

```typescript
import { useGraphPublishing } from "~/app/knowledge-graph/_hooks";
import { shouldUseSmartAccount, getGeoPrivateKey } from "~~/hypergraph.config";

// Inside your component
const { publishToChain } = useGraphPublishing();
const useSmartAccount = shouldUseSmartAccount();
const geoPrivateKey = getGeoPrivateKey();

// Publish operations with smart account
const handlePublish = async () => {
    const result = await publishToChain(
        operations,
        walletAddress,
        useSmartAccount,
        geoPrivateKey
    );

    if (result) {
        console.log(`Transaction successful: ${result}`);
    }
};
```

## Resources

-   [The Graph Knowledge Graph Documentation - COMING SOON]()
-   [GRC-20 SDK GitHub Repository](https://github.com/graphprotocol/grc-20-ts)
-   [The Graph Official Website](https://thegraph.com)
-   [Scaffold-ETH 2 Documentation](https://docs.scaffoldeth.io)
