# Knowledge Graph Application

A decentralized application for interacting with The Graph Knowledge Graph protocol using the GRC-20 SDK.

## Overview

This application allows you to create, manage and publish knowledge graph data to IPFS and onchain using the [Graph Protocol](https://thegraph.com)'s GRC-20 standard. With this tool, you can:

-   Create Triple operations (entity-attribute-value data)
-   Create Relation operations (connecting entities)
-   Publish data to IPFS
-   Submit transactions to record data on-chain

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
