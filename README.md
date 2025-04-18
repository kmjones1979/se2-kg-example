# Knowledge Graph Application

A decentralized application for interacting with The Graph Knowledge Graph protocol using the GRC-20 SDK.

## Overview

This application allows you to create, manage and publish knowledge graph data to IPFS and onchain using the [Graph Protocol](https://thegraph.com)'s GRC-20 standard. With this tool, you can:

-   Create Triple operations (entity-attribute-value data)
-   Create Relation operations (connecting entities)
-   Publish data to IPFS
-   Submit transactions to record data on-chain

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
