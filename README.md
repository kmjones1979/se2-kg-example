# Knowledge Graph Application

A decentralized application for interacting with The Graph Knowledge Graph protocol using the GRC-20 SDK.

## Overview

This application allows you to create, manage and publish knowledge graph data to IPFS and onchain using the [Graph Protocol](https://thegraph.com)'s GRC-20 standard. With this tool, you can:

-   Create Triple operations (entity-attribute-value data)
-   Create Relation operations (connecting entities)
-   Publish data to IPFS
-   Submit transactions to record data on-chain

## Table of Contents

-   [Comprehensive Developer Guide](#comprehensive-developer-guide)
    -   [Core Concepts](#core-concepts)
    -   [SDK Installation & Setup](#sdk-installation--setup)
    -   [ID System Architecture](#id-system-architecture)
    -   [Value Types & Data Formats](#value-types--data-formats)
    -   [Operation Types](#operation-types)
    -   [Publication Workflow](#publication-workflow)
-   [Step-by-Step Tutorial: Creating Entities and Relations](#step-by-step-tutorial-creating-entities-and-relations)
-   [Advanced SDK Usage Examples](#advanced-sdk-usage-examples)
-   [ID System Flow](#id-system-flow)
-   [Supported Value Types](#supported-value-types)
-   [Knowledge Graph Operations Flow](#knowledge-graph-operations-flow)
-   [Error Handling](#error-handling)
-   [Performance Considerations](#performance-considerations)
-   [Built With](#built-with)
-   [Getting Started](#getting-started)
-   [Using a Space ID](#using-a-space-id)
-   [Resources](#resources)
-   [Components and Hooks Documentation](#components-and-hooks-documentation)
    -   [Core Hooks](#core-hooks)
    -   [UI Components](#ui-components)
-   [Step-by-Step: Implementing "Alice Likes Pizza" Example](#step-by-step-implementing-alice-likes-pizza-example)
-   [Error Handling in the Knowledge Graph Hooks](#error-handling-in-the-knowledge-graph-hooks)
-   [Using the Hypergraph Railway API](#using-the-hypergraph-railway-api)
-   [Hooks Tutorial: Building an "Alice Likes Pizza" Application](#hooks-tutorial-building-an-alice-likes-pizza-application)
-   [Configuration System](#configuration-system)

## Comprehensive Developer Guide

### Core Concepts

The Graph Knowledge Graph protocol uses a graph data structure where:

-   **Entities** represent nodes (e.g., people, places, things)
-   **Attributes** define properties of entities (e.g., name, age, color)
-   **Relations** connect entities to each other (e.g., "authored", "belongs_to")
-   **Triples** bind entities, attributes, and values together (representing facts like "Entity X has Attribute Y with Value Z")

### SDK Installation & Setup

To use the GRC-20 SDK in your own projects:

```bash
# Install the SDK
npm install @graphprotocol/grc-20

# Or with yarn
yarn add @graphprotocol/grc-20
```

Import the necessary modules in your TypeScript/JavaScript code:

```typescript
import { Graph, Ipfs, Relation, Triple } from "@graphprotocol/grc-20";
```

### ID System Architecture

Knowledge graphs use unique identifiers to maintain data integrity:

#### 1. Entity IDs

Entities are the core objects in your knowledge graph. Each entity requires a unique ID.

```typescript
// Generate a new entity ID
const entityId = generateEntityID();
// Example: "A9QizqoXSqjfPUBjLoPJa2"

// Using an entity ID
const personEntity = {
    id: entityId,
    // other properties
};
```

#### 2. Attribute IDs

Attributes define the properties that can be attached to entities. Each attribute has a unique ID.

```typescript
// Generate a new attribute ID
const nameAttributeId = generateAttributeID();
// Example: "GpnQE6H64aSfIE2ZRqBNZf"

// Create a triple associating an entity with an attribute value
const nameTriple = Triple.make({
    entityId: personEntityId,
    attributeId: nameAttributeId,
    value: {
        type: "TEXT",
        value: "John Doe",
    },
});
```

#### 3. Relation Type IDs

Relation types define the nature of connections between entities.

```typescript
// Generate a new relation type ID
const authoredRelationTypeId = generateRelationTypeID();
// Example: "Cs3KPlZHREpMZLkXPb2nsU"

// Create a relation between two entities
const authorRelation = Relation.make({
    fromId: personEntityId,
    relationTypeId: authoredRelationTypeId,
    toId: bookEntityId,
});
```

#### 4. Relation IDs

When creating relations, you can optionally specify a unique relation ID for future reference:

```typescript
// Generate a relation ID
const relationId = generateID();
// Example: "HxP5jDb8QcMnWrLaCo9AzD"

// Create a relation with a specific ID
const taggedRelation = Relation.make({
    id: relationId,
    fromId: photoEntityId,
    relationTypeId: taggedRelationTypeId,
    toId: personEntityId,
});
```

### Value Types & Data Formats

The GRC-20 protocol supports several value types, each with specific formats:

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

#### Triple Operations

Triples associate an entity with an attribute value:

```typescript
// Create a triple
const setTripleOp = Triple.make({
    entityId: "A9QizqoXSqjfPUBjLoPJa2",
    attributeId: "GpnQE6H64aSfIE2ZRqBNZf",
    value: {
        type: "TEXT",
        value: "Example value",
    },
});

// Remove a triple
const removeTripleOp = Triple.remove({
    entityId: "A9QizqoXSqjfPUBjLoPJa2",
    attributeId: "GpnQE6H64aSfIE2ZRqBNZf",
});
```

#### Relation Operations

Relations connect two entities through a defined relationship type:

```typescript
// Create a relation
const addRelationOp = Relation.make({
    fromId: "A9QizqoXSqjfPUBjLoPJa2", // Person entity
    relationTypeId: "Cs3KPlZHREpMZLkXPb2nsU", // "knows" relation type
    toId: "B8RizpoXSqjfPUBjLoPJa3", // Another person entity
});

// Remove a relation
const removeRelationOp = Relation.remove({
    id: "HxP5jDb8QcMnWrLaCo9AzD", // Specific relation ID
});
```

### Publication Workflow

Operations are batched and published to IPFS before being committed on-chain:

```typescript
// Example publishing workflow
async function publishOperations(ops, name, authorAddress) {
    // 1. Publish to IPFS
    const ipfsResult = await Ipfs.publishEdit({
        name,
        ops,
        author: authorAddress,
    });

    const cid = ipfsResult.cid;

    // 2. Get transaction data for on-chain commitment

    // Mainet endpoint https://hypergraph.up.railway.app

    const response = await fetch(
        `https://api-testnet.grc-20.thegraph.com/space/${spaceId}/edit/calldata`,
        {
            method: "POST",
            body: JSON.stringify({
                cid,
                network: "TESTNET",
            }),
        }
    );

    const txData = await response.json();

    // 3. Submit transaction to blockchain (example using ethers.js)
    const tx = await signer.sendTransaction({
        to: txData.to,
        data: txData.data,
    });

    return tx.hash;
}
```

## Step-by-Step Tutorial: Creating Entities and Relations

This comprehensive tutorial demonstrates how to create two entities and connect them with a relation in your knowledge graph.

### Prerequisites

-   The application is running locally at http://localhost:3000/knowledge-graph
-   You have a Web3 wallet (like MetaMask) connected to the application
-   You're connected to a blockchain with GRC-20 support (e.g., Goerli testnet)

### Step 1: Create the First Entity - Person

1. **Navigate** to the Knowledge Graph Builder tab
2. **Ensure** "Triple Operations" is selected in the tab interface
3. **Click** the "Generate" button next to "Entity ID" to create a new entity ID
    - _Note down this ID as your "Person Entity ID"_
4. **Click** the "Generate" button next to "Attribute ID" to create a new attribute ID for the name property
    - _Note down this ID as your "Name Attribute ID"_
5. **Select** "TEXT" from the Value Type dropdown
6. **Enter** "John Doe" in the text field
7. **Click** "Add Triple" to add this operation to your batch
8. **Repeat** steps 4-7 to add more attributes to your person entity:
    - Generate a new Attribute ID for "age"
    - Select "NUMBER" as Value Type
    - Enter "30" as the value
    - Click "Add Triple"

### Step 2: Create the Second Entity - Book

1. **Click** the "Generate" button next to "Entity ID" to create a new entity ID
    - _Note down this ID as your "Book Entity ID"_
2. **Click** the "Generate" button next to "Attribute ID" to create a new attribute ID for the title
    - _Note down this ID as your "Title Attribute ID"_
3. **Select** "TEXT" from the Value Type dropdown
4. **Enter** "My Autobiography" in the text field
5. **Click** "Add Triple" to add this operation to your batch
6. **Repeat** steps 2-5 to add more attributes to your book entity:
    - Generate a new Attribute ID for "publication_date"
    - Select "TIME" as Value Type
    - Enter a date using the date picker
    - Click "Add Triple"

### Step 3: Create a Relation Between Entities

1. **Switch** to the "Relation Operations" tab
2. **Enter** the Person Entity ID from Step 1 in the "From Entity ID" field (or click "Generate" and manually replace it)
3. **Click** the "Generate" button next to "Relation Type ID" to create a new relation type
    - _Note down this ID as your "Authored Relation Type ID"_
4. **Enter** the Book Entity ID from Step 2 in the "To Entity ID" field (or click "Generate" and manually replace it)
5. **Optionally** generate a Relation ID or leave it blank for auto-generation
6. **Click** "Add Relation" to add this operation to your batch

### Step 4: Publish Operations to IPFS

1. **Enter** a descriptive operation name like "Create Author and Book Relationship"
2. **Review** your pending operations in the Operations Log section
3. **Click** "Publish to IPFS" button
4. **Wait** for the IPFS publication to complete (the status will update with the IPFS CID)

### Step 5: Commit Operations On-Chain

1. **Click** "Get Transaction Data" once the IPFS publication is complete
2. **Click** "Send Transaction" when the transaction data is ready
3. **Confirm** the transaction in your Web3 wallet
4. **Wait** for the transaction to be mined (the status will update with the transaction hash)

### Step 6: Verify Your Knowledge Graph

Your knowledge graph now contains:

-   A Person entity with name and age attributes
-   A Book entity with title and publication date attributes
-   A relation indicating the Person authored the Book

You've successfully created a simple knowledge graph with entities and relationships!

## Advanced SDK Usage Examples

### Creating Multiple Operations in Batch

```typescript
const operations = [];

// Create a person entity with multiple attributes
const personEntityId = generateEntityID();
const nameAttributeId = generateAttributeID();
const ageAttributeId = generateAttributeID();

operations.push(
    Triple.make({
        entityId: personEntityId,
        attributeId: nameAttributeId,
        value: { type: "TEXT", value: "Alice Johnson" },
    })
);

operations.push(
    Triple.make({
        entityId: personEntityId,
        attributeId: ageAttributeId,
        value: { type: "NUMBER", value: "28" },
    })
);

// Create a company entity
const companyEntityId = generateEntityID();
const companyNameAttributeId = generateAttributeID();
const foundedAttributeId = generateAttributeID();

operations.push(
    Triple.make({
        entityId: companyEntityId,
        attributeId: companyNameAttributeId,
        value: { type: "TEXT", value: "TechCorp Inc." },
    })
);

operations.push(
    Triple.make({
        entityId: companyEntityId,
        attributeId: foundedAttributeId,
        value: { type: "TIME", value: "2010-05-12T00:00:00Z" },
    })
);

// Create employment relation
const worksForRelationTypeId = generateRelationTypeID();

operations.push(
    Relation.make({
        fromId: personEntityId,
        relationTypeId: worksForRelationTypeId,
        toId: companyEntityId,
    })
);

// Publish all operations in one batch
const result = await Ipfs.publishEdit({
    name: "Create Person and Company Graph",
    ops: operations,
    author: walletAddress,
});
```

### Advanced Relation Patterns

```typescript
// Create a directed graph of influences
const influencedByRelationTypeId = generateRelationTypeID();

// Einstein influenced Bohr
operations.push(
    Relation.make({
        fromId: einsteinEntityId,
        relationTypeId: influencedByRelationTypeId,
        toId: bohrEntityId,
    })
);

// Bohr influenced Heisenberg
operations.push(
    Relation.make({
        fromId: bohrEntityId,
        relationTypeId: influencedByRelationTypeId,
        toId: heisenbergEntityId,
    })
);

// Relation with metadata
const collaboratedWithRelationTypeId = generateRelationTypeID();
const relationId = generateID();

operations.push(
    Relation.make({
        id: relationId,
        fromId: curieEntityId,
        relationTypeId: collaboratedWithRelationTypeId,
        toId: joliotEntityId,
    })
);

// Add metadata to the relation
const yearAttributeId = generateAttributeID();
operations.push(
    Triple.make({
        entityId: relationId, // Using the relation ID as an entity
        attributeId: yearAttributeId,
        value: { type: "TEXT", value: "1934" },
    })
);
```

### Working with Geographic Data

```typescript
// Create a location entity with coordinates
const locationEntityId = generateEntityID();
const nameAttributeId = generateAttributeID();
const coordinatesAttributeId = generateAttributeID();

operations.push(
    Triple.make({
        entityId: locationEntityId,
        attributeId: nameAttributeId,
        value: { type: "TEXT", value: "Eiffel Tower" },
    })
);

operations.push(
    Triple.make({
        entityId: locationEntityId,
        attributeId: coordinatesAttributeId,
        value: { type: "POINT", value: "48.8584,2.2945" },
    })
);
```

## ID System Flow

The application uses a system of IDs to structure knowledge graph data:

### 1. Entity IDs

-   Unique identifiers for entities in your knowledge graph
-   Example: `A9QizqoXSqjfPUBjLoPJa2`
-   Use the Generate button or enter existing IDs from your knowledge graph

### 2. Attribute IDs

-   Identifiers for properties that can be attached to entities
-   Example: `GpnQE6H64aSfIE2ZRqBNZf`
-   Use the Generate button or enter existing IDs from your knowledge graph

### 3. Relation Type IDs

-   Identifiers for types of relationships between entities
-   Example: `Cs3KPlZHREpMZLkXPb2nsU`
-   Use the Generate button or enter existing IDs from your knowledge graph

### 4. Relation IDs

-   Identifiers for specific relations (used for removal operations)
-   Generate or provide when removing relations

## Supported Value Types

The application supports all value types specified in the GRC-20 SDK:

-   **TEXT**: Plain text values
-   **NUMBER**: Numeric values
-   **URL**: Web addresses
-   **TIME**: Date and time values
-   **POINT**: Coordinate values
-   **CHECKBOX**: Boolean true/false values

### Additional Types

-   **RELATION**: Used for property definitions to define relations between entities (not used directly in Triple values)

## Knowledge Graph Operations Flow

### Creating Triple Operations:

1. Enter or generate an Entity ID
2. Enter or generate an Attribute ID
3. Select a value type (TEXT, NUMBER, etc.)
4. Enter the value in the appropriate format
5. Click "Add Triple" to add the operation to your batch

### Creating Relation Operations:

1. Enter or generate a From Entity ID
2. Enter or generate a Relation Type ID
3. Enter or generate a To Entity ID
4. Click "Add Relation" to add the operation to your batch

### Understanding RELATION Type Properties

The RELATION type is special in the GRC-20 SDK. Unlike other value types which store data directly, RELATION type properties create links between entities. When creating a property with type RELATION:

1. Create a property using Graph.createProperty with type RELATION
2. Use this property ID when creating entities to establish relationships
3. The relationship requires a "to" field referring to another entity

Example with RELATION property:

```typescript
// Create a "likes" property of type RELATION
const { id: likesPropertyId, ops: createLikesPropertyOps } =
    Graph.createProperty({
        type: "RELATION",
        name: "Likes",
    });

// Create a person entity with a relation to a restaurant entity
const { id: personId, ops: createPersonOps } = Graph.createEntity({
    name: "Jane Doe",
    properties: {
        // Using the RELATION property to create a link
        [likesPropertyId]: {
            to: restaurantId, // ID of another entity
        },
    },
});
```

### Publishing Operations:

1. Add one or more operations to your batch
2. Enter an operation name
3. Click "Publish to IPFS" to store your operations on IPFS
4. Once IPFS publishing completes, click "Get Transaction Data"
5. Send the transaction to record your operations on-chain

## Error Handling

When working with the knowledge graph SDK, you might encounter various errors:

```typescript
try {
    // Attempt to publish to IPFS
    const result = await Ipfs.publishEdit({
        name: operationName,
        ops,
        author: connectedAddress,
    });

    // Success
    console.log(`Published to IPFS: ${result.cid}`);
} catch (error) {
    // Handle different error types
    if (error.message.includes("Invalid operation format")) {
        console.error("Operation format error:", error);
        // Handle format errors
    } else if (error.message.includes("Network error")) {
        console.error("Network error:", error);
        // Handle network issues
    } else {
        console.error("Unknown error:", error);
        // Handle other errors
    }
}
```

## Performance Considerations

For optimal performance when working with knowledge graphs:

1. **Batch operations**: Group related operations together in a single publish request
2. **ID caching**: Store and reuse IDs for entities and attributes that you'll reference multiple times
3. **Minimize redundancy**: Avoid creating duplicate entities or attributes
4. **Transaction optimization**: Group multiple operations in a single transaction to minimize gas costs

## Built With

-   [Scaffold-ETH 2](https://github.com/scaffold-eth/scaffold-eth-2)
-   [@graphprotocol/grc-20](https://github.com/graphprotocol/grc-20-ts) SDK

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

## Using a Space ID

The application comes pre-configured with the Space ID: `LB1JjNpxXBjP7caanTx3bP`

You can use this space for testing or enter your own space ID.

## Resources

-   [The Graph Knowledge Graph Documentation](https://thegraph.com/docs/en/knowledge-graph/)
-   [GRC-20 SDK GitHub Repository](https://github.com/graphprotocol/grc-20-ts)
-   [The Graph Official Website](https://thegraph.com)
-   [Scaffold-ETH 2 Documentation](https://docs.scaffoldeth.io)

## Components and Hooks Documentation

This section provides an overview of the key components and hooks used in the Knowledge Graph application, with usage examples for developers.

### Core Hooks

#### 1. `useGraphOperations`

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
    "entity-123", // Entity ID
    "attribute-456", // Attribute ID
    { type: "TEXT", value: "John" } // Value with type
);

// Example: Add a relation
const relationResult = addRelation(
    "person-123", // From Entity ID
    "likes-relation-789", // Relation Type ID
    "food-456" // To Entity ID
);
```

#### 2. `useGraphPublishing`

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

#### 3. `useEntityState`

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

#### 4. `useOperationsLog`

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

### UI Components

#### 1. `OperationsLog`

Displays a log of operations with formatting options.

```tsx
import { OperationsLog } from "~/app/knowledge-graph/_components/OperationsLog";

// Inside your component render
<OperationsLog
    ops={operations} // Array of operations to display
    clearOps={clearOperations} // Function to clear operations
    showRawJson={false} // Optional: show raw JSON
/>;
```

#### 2. `HookDemoCard`

Provides a demonstration of using hooks for knowledge graph operations.

```tsx
import { HookDemoCard } from "~/app/knowledge-graph/_components/HookDemoCard";

// Inside your component render
<HookDemoCard
    onStatusChange={(status) => console.log(`Status: ${status}`)}
    onOperationsCountChange={(count) => console.log(`Operations: ${count}`)}
/>;
```

#### 3. `TripleOperationsCard`

UI for creating and managing triple operations.

```tsx
import { TripleOperationsCard } from "~/app/knowledge-graph/_components/TripleOperationsCard";

// Inside your component render
<TripleOperationsCard />;
```

#### 4. `RelationOperationsCard`

UI for creating and managing relation operations.

```tsx
import { RelationOperationsCard } from "~/app/knowledge-graph/_components/RelationOperationsCard";

// Inside your component render
<RelationOperationsCard />;
```

## Step-by-Step: Implementing "Alice likes Pizza" Example

This step-by-step guide demonstrates how to implement the "Alice likes Pizza" example using the hooks system.

### Step 1: Set Up Component Structure

```tsx
import { useState, useRef } from "react";
import { useGraphOperations } from "~/app/knowledge-graph/_hooks/useGraphOperations";
import { useGraphPublishing } from "~/app/knowledge-graph/_hooks/useGraphPublishing";
import { OperationsLog } from "~/app/knowledge-graph/_components/OperationsLog";

const AlicePizzaExample = () => {
    // State for IDs and values
    const [personId, setPersonId] = useState("");
    const [personNameAttrId, setPersonNameAttrId] = useState("");
    const [foodId, setFoodId] = useState("");
    const [foodNameAttrId, setFoodNameAttrId] = useState("");
    const [relationTypeId, setRelationTypeId] = useState("");
    const [relationId, setRelationId] = useState("");
    const [status, setStatus] = useState("Ready");

    // Use hooks
    const {
        operations,
        operationsCount,
        addTriple,
        addRelation,
        clearOperations,
    } = useGraphOperations();

    const { publishToChain, setOperationName } = useGraphPublishing();

    // Helper functions for ID generation
    const generateEntityId = () =>
        `entity-${Math.random().toString(36).substring(2, 10)}`;
    const generateAttributeId = () =>
        `attr-${Math.random().toString(36).substring(2, 10)}`;
    const generateRelationTypeId = () =>
        `reltype-${Math.random().toString(36).substring(2, 10)}`;
    const generateRelationId = () =>
        `relation-${Math.random().toString(36).substring(2, 10)}`;

    // UI rendering...
};
```

### Step 2: Implement Entity Creation Functions

```tsx
// Add to the AlicePizzaExample component

// Create Person Entity (Alice)
const createPersonEntity = () => {
    try {
        // Generate IDs if not already set
        const entityId = personId || generateEntityId();
        const nameAttrId = personNameAttrId || generateAttributeId();

        // Store IDs
        setPersonId(entityId);
        setPersonNameAttrId(nameAttrId);

        // Create the triple for person's name
        const result = addTriple(entityId, nameAttrId, {
            type: "TEXT",
            value: "Alice",
        });

        setStatus(`Created person entity: Alice (${entityId})`);
        return entityId;
    } catch (error) {
        setStatus(
            `Error creating person: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
        console.error("Error creating person:", error);
        return null;
    }
};

// Create Food Entity (Pizza)
const createFoodEntity = () => {
    try {
        // Generate IDs if not already set
        const entityId = foodId || generateEntityId();
        const nameAttrId = foodNameAttrId || generateAttributeId();

        // Store IDs
        setFoodId(entityId);
        setFoodNameAttrId(nameAttrId);

        // Create the triple for food's name
        const result = addTriple(entityId, nameAttrId, {
            type: "TEXT",
            value: "Pizza",
        });

        // Add food type attribute
        const typeAttrId = generateAttributeId();
        addTriple(entityId, typeAttrId, { type: "TEXT", value: "Italian" });

        setStatus(`Created food entity: Pizza (${entityId})`);
        return entityId;
    } catch (error) {
        setStatus(
            `Error creating food: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
        console.error("Error creating food:", error);
        return null;
    }
};
```

### Step 3: Implement Relation Creation Function

```tsx
// Add to the AlicePizzaExample component

// Create Relation (Alice likes Pizza)
const createRelation = () => {
    try {
        if (!personId || !foodId) {
            setStatus("Please create both person and food entities first");
            return null;
        }

        // Generate IDs if not already set
        const relTypeId = relationTypeId || generateRelationTypeId();
        const relId = relationId || generateRelationId();

        // Store IDs
        setRelationTypeId(relTypeId);
        setRelationId(relId);

        // Create the relation
        const result = addRelation(
            personId, // From: Alice
            relTypeId, // Relation type: likes
            foodId, // To: Pizza
            relId // Explicit relation ID
        );

        setStatus(`Created relation: Alice likes Pizza`);
        return relId;
    } catch (error) {
        setStatus(
            `Error creating relation: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
        console.error("Error creating relation:", error);
        return null;
    }
};
```

### Step 4: Implement Demo Workflow Function

```tsx
// Add to the AlicePizzaExample component

// Run the full demo workflow
const runDemo = () => {
    clearOperations(); // Start fresh
    setStatus("Starting demo workflow...");

    // Create entities and relation with proper sequencing
    setTimeout(() => {
        const personEntityId = createPersonEntity();

        if (personEntityId) {
            setTimeout(() => {
                const foodEntityId = createFoodEntity();

                if (foodEntityId) {
                    setTimeout(() => {
                        const relationEntityId = createRelation();

                        if (relationEntityId) {
                            setStatus(
                                "Demo complete! Alice likes Pizza relation created."
                            );
                        }
                    }, 500);
                }
            }, 500);
        }
    }, 100);
};
```

### Step 5: Implement Publishing Function

```tsx
// Add to the AlicePizzaExample component

// Publish to blockchain
const publishDemo = async () => {
    if (operations.length === 0) {
        setStatus("No operations to publish");
        return;
    }

    setStatus("Publishing operations...");
    setOperationName("Alice likes Pizza Demo");

    try {
        // Get raw operations data
        const rawOps = operations.map((op) => op.data);

        // Publish to chain (IPFS → Transaction)
        const result = await publishToChain(rawOps);

        if (result) {
            setStatus(`Published successfully! Transaction hash: ${result}`);
        } else {
            setStatus("Publication failed");
        }
    } catch (error) {
        setStatus(
            `Error publishing: ${
                error instanceof Error ? error.message : String(error)
            }`
        );
    }
};
```

### Step 6: Implement UI Rendering

```tsx
// Add to the AlicePizzaExample component

return (
    <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
            <h2 className="card-title">Alice Likes Pizza Example</h2>

            <div className="mt-4 space-y-4">
                <div className="flex flex-col gap-2">
                    <div className="text-sm font-semibold">Entity IDs</div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="label">Person ID (Alice)</label>
                            <input
                                type="text"
                                className="input input-bordered w-full"
                                value={personId}
                                onChange={(e) => setPersonId(e.target.value)}
                                placeholder="Generate or enter ID"
                            />
                            <button
                                className="btn btn-xs mt-1"
                                onClick={() => setPersonId(generateEntityId())}
                            >
                                Generate
                            </button>
                        </div>
                        <div>
                            <label className="label">Food ID (Pizza)</label>
                            <input
                                type="text"
                                className="input input-bordered w-full"
                                value={foodId}
                                onChange={(e) => setFoodId(e.target.value)}
                                placeholder="Generate or enter ID"
                            />
                            <button
                                className="btn btn-xs mt-1"
                                onClick={() => setFoodId(generateEntityId())}
                            >
                                Generate
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <div className="text-sm font-semibold">Relation</div>
                    <div>
                        <label className="label">
                            Relation Type ID (likes)
                        </label>
                        <input
                            type="text"
                            className="input input-bordered w-full"
                            value={relationTypeId}
                            onChange={(e) => setRelationTypeId(e.target.value)}
                            placeholder="Generate or enter ID"
                        />
                        <button
                            className="btn btn-xs mt-1"
                            onClick={() =>
                                setRelationTypeId(generateRelationTypeId())
                            }
                        >
                            Generate
                        </button>
                    </div>
                </div>

                <div className="divider"></div>

                <div className="flex flex-wrap gap-2">
                    <button
                        className="btn btn-primary"
                        onClick={createPersonEntity}
                    >
                        1. Create Alice
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={createFoodEntity}
                    >
                        2. Create Pizza
                    </button>
                    <button
                        className="btn btn-primary"
                        onClick={createRelation}
                    >
                        3. Create 'Likes' Relation
                    </button>
                    <button className="btn btn-accent" onClick={runDemo}>
                        Run Full Demo
                    </button>
                </div>

                <div className="divider"></div>

                <button
                    className="btn btn-secondary w-full"
                    onClick={publishDemo}
                    disabled={operations.length === 0}
                >
                    Publish to Blockchain
                </button>
            </div>

            <div className="divider"></div>

            <div className="flex items-center justify-between">
                <div className="font-semibold">Status:</div>
                <div className="badge badge-info">{status}</div>
            </div>

            <div className="divider"></div>

            <div className="bg-base-200 p-4 rounded-lg">
                <OperationsLog
                    ops={operations}
                    clearOps={clearOperations}
                    showRawJson={true}
                />
            </div>
        </div>
    </div>
);
```

### Step 7: Use the Example Component

```tsx
// In your main page component
import { AlicePizzaExample } from "~/app/knowledge-graph/_components/AlicePizzaExample";

export default function KnowledgeGraphPage() {
    return (
        <div className="container mx-auto p-4">
            <h1 className="text-3xl font-bold mb-8">Knowledge Graph Demo</h1>
            <AlicePizzaExample />
        </div>
    );
}
```

## Error Handling in the Knowledge Graph Hooks

The hooks system implements comprehensive error handling to provide clear feedback on transaction failures and other issues:

```typescript
// Example of enhanced error handling in the sendTransaction function
const sendTransaction = async (): Promise<`0x${string}` | null> => {
    if (!state.txData) {
        console.error("No transaction data available");
        return null;
    }

    try {
        setState({ ...state, status: "sending" });

        // Log transaction details for debugging
        console.log("Sending transaction to:", state.txData.to);
        console.log("Transaction data length:", state.txData.data.length);
        console.log(
            "Transaction data (subset):",
            state.txData.data.substring(0, 66) + "..."
        );

        // Send transaction
        const hash = await transactor({
            to: state.txData.to,
            value: BigInt(0),
            data: state.txData.data as `0x${string}`,
        });

        if (hash) {
            console.log(`Transaction sent successfully! Hash: ${hash}`);
            setState((prev) => ({
                ...prev,
                txHash: hash,
                status: "success",
                step: 4,
            }));
            return hash;
        } else {
            console.error("Transaction was sent but no hash was returned");
            return null;
        }
    } catch (error) {
        // Enhanced error details
        const errorName = error instanceof Error ? error.name : "Unknown";
        const errorMessage =
            error instanceof Error ? error.message : "No message available";

        // User-friendly error messages
        let userMessage = "Transaction failed";
        if (errorMessage.includes("user rejected")) {
            userMessage = "Transaction was rejected by user";
        } else if (errorMessage.includes("insufficient funds")) {
            userMessage = "Insufficient funds to complete the transaction";
        }

        console.error(
            `Error details - Name: ${errorName}, Message: ${errorMessage}`
        );
        setState((prev) => ({
            ...prev,
            status: "error",
            error: userMessage,
            errorDetails: `${errorName}: ${errorMessage}`,
        }));
        return null;
    }
};
```

## Using the Hypergraph Railway API

This application can use the `hypergraph.up.railway.app` API endpoint for MAINNET operations. The application is configured to automatically use this endpoint when performing operations on the MAINNET network.

### API Endpoint Configuration

The application uses the following API endpoints:

-   **TESTNET**: `https://api-testnet.grc-20.thegraph.com`
-   **MAINNET**: `https://hypergraph.up.railway.app`

When making API calls, the endpoint is constructed as follows:

```typescript
const baseUrl =
    network === "TESTNET"
        ? "https://api-testnet.grc-20.thegraph.com"
        : "https://hypergraph.up.railway.app";

const apiEndpoint = `${baseUrl}/space/${spaceId}/edit/calldata`;
```

### Manual API Testing

You can manually test the API using curl:

```bash
# For MAINNET (using hypergraph.up.railway.app)
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"cid":"ipfs://YOUR_CID_HERE","network":"MAINNET"}' \
  https://hypergraph.up.railway.app/space/YOUR_SPACE_ID/edit/calldata

# For TESTNET
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"cid":"ipfs://YOUR_CID_HERE","network":"TESTNET"}' \
  https://api-testnet.grc-20.thegraph.com/space/YOUR_SPACE_ID/edit/calldata
```

### Error Handling

The application includes comprehensive error handling for API communications, providing detailed information about any issues encountered when communicating with the hypergraph API endpoint. Common errors include:

-   **404 Not Found**: This might indicate an incorrect path structure in the API URL.
-   **Invalid Response Format**: If the API response doesn't contain the expected `to` and `data` fields.
-   **Connection Issues**: If the API endpoint cannot be reached.

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

### Customizing Configuration

To change the default space ID or endpoints, simply update the configuration file:

1. Edit `packages/nextjs/hypergraph.config.ts`
2. Update the desired settings
3. The changes will automatically apply throughout the application

### Environment Variables

You can control certain behaviors with environment variables:

-   `USE_MOCK_DATA=true` - Force the use of mock data in development mode

Example using `.env.local`:

```
# Enable mock data for local development
USE_MOCK_DATA=true
```
