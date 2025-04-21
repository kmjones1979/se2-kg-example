// AliceLikesPizzaDemo.tsx
import { useState } from "react";
import { OperationsLog } from "~~/app/knowledge-graph/_components/OperationsLog";
import {
  useGraphIds,
  useGraphOperations,
  useGraphPublishing,
  useOperationsTracking,
} from "~~/app/knowledge-graph/_hooks";

// Define operation format to match SDK expectations
interface TripleOperation {
  type: "SET_TRIPLE";
  triple: {
    entity: string;
    attribute: string;
    value: {
      type: string;
      value: string;
    };
  };
}

interface RelationOperation {
  type: "SET_RELATION";
  relation: {
    from: string;
    relationType: string;
    to: string;
  };
}

const AliceLikesPizzaDemo = () => {
  // State for entity IDs
  const [personId, setPersonId] = useState("");
  const [foodId, setFoodId] = useState("");

  // Status for user feedback
  const [status, setStatus] = useState("Ready");

  // Import necessary hooks
  const { generateEntityId, generateAttributeId, generateRelationTypeId } = useGraphIds();
  const { addTriple, addRelation } = useGraphOperations();
  const { operations, trackOperation, clearOperations } = useOperationsTracking();
  const { operationName, setOperationName, publishToIPFS, getCallData, sendTransaction, spaceId, setSpaceId } =
    useGraphPublishing();

  // Helper function to ensure operations match SDK format
  const createAndTrackTriple = (entity: string, attribute: string, valueType: string, valueContent: string) => {
    const tripleOp: TripleOperation = {
      type: "SET_TRIPLE",
      triple: {
        entity,
        attribute,
        value: {
          type: valueType,
          value: valueContent,
        },
      },
    };

    trackOperation(tripleOp);
    return tripleOp;
  };

  // Create Person Entity (Alice)
  const createPersonEntity = () => {
    try {
      // Generate IDs
      const entityId = generateEntityId();
      setPersonId(entityId);

      // Create type triple first (Person type)
      createAndTrackTriple(entityId, "type", "TEXT", "Person");

      // Now create name attribute
      const nameAttrId = generateAttributeId();

      // Create name triple
      createAndTrackTriple(entityId, nameAttrId, "TEXT", "Alice");

      // Add through the hooks API
      addTriple(entityId, nameAttrId, { type: "TEXT", value: "Alice" });

      setStatus(`Created person: Alice (${entityId})`);
      return entityId;
    } catch (error) {
      setStatus(`Error creating person: ${error instanceof Error ? error.message : String(error)}`);
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
      createAndTrackTriple(entityId, "type", "TEXT", "Food");

      // Create name attribute (Pizza)
      const nameAttrId = generateAttributeId();

      // Create name triple
      createAndTrackTriple(entityId, nameAttrId, "TEXT", "Pizza");

      // Add through the hooks API
      addTriple(entityId, nameAttrId, { type: "TEXT", value: "Pizza" });

      // Add origin attribute
      const originAttrId = generateAttributeId();

      // Create origin triple
      createAndTrackTriple(entityId, originAttrId, "TEXT", "Italian");

      // Add through the hooks API
      addTriple(entityId, originAttrId, { type: "TEXT", value: "Italian" });

      setStatus(`Created food: Pizza (${entityId})`);
      return entityId;
    } catch (error) {
      setStatus(`Error creating food: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  };

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
      const relationOp: RelationOperation = {
        type: "SET_RELATION",
        relation: {
          from: personId,
          relationType: likesRelationTypeId,
          to: foodId,
        },
      };

      // Track the relation operation
      trackOperation(relationOp);

      // Add through the hooks API
      addRelation(personId, likesRelationTypeId, foodId);

      setStatus(`Created relation: Alice likes Pizza`);
      return true;
    } catch (error) {
      setStatus(`Error creating relation: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  };

  // Publish operations to IPFS
  const handlePublishToIPFS = async () => {
    if (operations.length === 0) {
      setStatus("No operations to publish");
      return;
    }

    // Set a descriptive name for the edit
    setOperationName("Alice Likes Pizza Example");

    try {
      setStatus("Publishing to IPFS...");

      // Create a new array with just the operations in the SDK-compatible format
      const rawOps = operations.map(op => op.data || op);

      console.log("Publishing operations:", JSON.stringify(rawOps, null, 2));
      const ipfsCid = await publishToIPFS(rawOps);

      if (ipfsCid) {
        setStatus(`Published to IPFS: ${ipfsCid}`);
      } else {
        setStatus("Failed to publish to IPFS");
      }
    } catch (error) {
      setStatus(`IPFS error: ${error instanceof Error ? error.message : String(error)}`);
      console.error("IPFS error details:", error);
    }
  };

  // Get transaction data for the published operations
  const handleGetTransactionData = async () => {
    try {
      setStatus("Getting transaction data...");
      const data = await getCallData();

      if (data) {
        setStatus("Transaction data ready");
        console.log("Transaction data:", data);
      } else {
        setStatus("Failed to get transaction data");
      }
    } catch (error) {
      setStatus(`Transaction data error: ${error instanceof Error ? error.message : String(error)}`);
      console.error("Transaction data error details:", error);
    }
  };

  // Send the transaction to the blockchain
  const handleSendTransaction = async () => {
    try {
      setStatus("Sending transaction...");
      const txHash = await sendTransaction();

      if (txHash) {
        setStatus(`Transaction sent: ${txHash}`);
        console.log("Transaction hash:", txHash);
      } else {
        setStatus("Failed to send transaction");
      }
    } catch (error) {
      setStatus(`Transaction error: ${error instanceof Error ? error.message : String(error)}`);
      console.error("Transaction error details:", error);
    }
  };

  // Run the full demo in sequence
  const runFullDemo = async () => {
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

    setStatus("Demo entities created successfully!");
  };

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
              onChange={e => setSpaceId(e.target.value)}
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
            <button className="btn btn-primary w-full" onClick={createPersonEntity}>
              Create Alice
            </button>
            {personId && <div className="mt-2 text-xs font-mono break-all">ID: {personId}</div>}
          </div>

          <div className="card border p-4">
            <h3 className="font-bold mb-2">Step 2: Create Food</h3>
            <button className="btn btn-primary w-full" onClick={createFoodEntity}>
              Create Pizza
            </button>
            {foodId && <div className="mt-2 text-xs font-mono break-all">ID: {foodId}</div>}
          </div>

          <div className="card border p-4">
            <h3 className="font-bold mb-2">Step 3: Create Relation</h3>
            <button className="btn btn-primary w-full" onClick={createLikesRelation} disabled={!personId || !foodId}>
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
          <button className="btn btn-secondary" onClick={handlePublishToIPFS} disabled={operations.length === 0}>
            1. Publish to IPFS
          </button>

          <button className="btn btn-secondary" onClick={handleGetTransactionData}>
            2. Get Transaction Data
          </button>

          <button className="btn btn-secondary" onClick={handleSendTransaction}>
            3. Send Transaction
          </button>
        </div>

        {/* Operations log */}
        <div className="divider">Operations Log ({operations.length})</div>
        <OperationsLog ops={operations} clearOps={clearOperations} />
      </div>
    </div>
  );
};

export default AliceLikesPizzaDemo;
