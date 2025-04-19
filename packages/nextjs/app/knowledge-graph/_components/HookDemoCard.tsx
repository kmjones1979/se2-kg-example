import { useState } from "react";
import { useGraphEntities, useGraphIds, useGraphOperations, useGraphPublishing } from "../_hooks";

/**
 * A component that demonstrates using our custom hooks together
 */
export const HookDemoCard = () => {
  const [name, setName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [showHelp, setShowHelp] = useState(false);

  // Section expansion states
  const [expandPersonSection, setExpandPersonSection] = useState(true);
  const [expandPublishingSection, setExpandPublishingSection] = useState(true);
  const [expandStatusSection, setExpandStatusSection] = useState(true);

  // Use our custom hooks
  const { operations, operationsCount, getRawOperations, clearOperations, lastStatus, setStatus } =
    useGraphOperations();

  const { createPersonEntity, entitiesCount, entities } = useGraphEntities();

  const { operationName, setOperationName, publishToIPFS, publishToChain, ipfsCid, txHash, spaceId, setSpaceId } =
    useGraphPublishing();

  // Create a person entity with our hooks
  const handleCreatePerson = () => {
    if (!name) {
      setStatus("Please enter a name");
      return;
    }

    const options: any = {};
    if (age !== "") options.age = age;
    if (bio) options.bio = bio;
    if (location) options.location = location;

    try {
      const { entityId, operations } = createPersonEntity(name, options);
      setStatus(`Created person entity (${entityId}) with ${operations.length} attributes`);

      // Clear the form
      setName("");
      setAge("");
      setBio("");
      setLocation("");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setStatus(`Error creating person: ${message}`);
    }
  };

  // Publish all operations to IPFS and blockchain
  const handlePublish = async () => {
    if (!operationName) {
      setStatus("Please enter an operation name");
      return;
    }

    const txHash = await publishToChain(getRawOperations());
    if (txHash) {
      clearOperations();
    }
  };

  return (
    <div className="card bg-base-100 shadow-xl mb-8">
      <div className="card-body">
        <h2 className="card-title flex justify-between">
          <span>Hook Demo</span>
          <div className="badge badge-primary">{operationsCount} operations</div>
        </h2>

        <button className="btn btn-sm btn-info mt-2 mb-4" onClick={() => setShowHelp(!showHelp)}>
          {showHelp ? "Hide Knowledge Graph Concepts" : "Learn About Knowledge Graph Concepts"}
        </button>

        {showHelp && (
          <div className="bg-base-200 p-4 rounded-lg mb-6">
            <h3 className="font-bold text-lg mb-2">Understanding Knowledge Graphs</h3>

            <div className="divider my-1"></div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-bold text-md mb-1 text-primary">Nodes (Entities)</h4>
                <p className="text-sm mb-2">
                  Nodes are the primary objects in your knowledge graph. They represent things like:
                </p>
                <ul className="list-disc list-inside text-sm ml-2 space-y-1">
                  <li>People (e.g., "John Smith")</li>
                  <li>Places (e.g., "New York City")</li>
                  <li>Concepts (e.g., "Democracy")</li>
                  <li>Physical objects (e.g., "Empire State Building")</li>
                  <li>Digital assets (e.g., "Bitcoin Whitepaper")</li>
                </ul>
                <p className="text-sm mt-2">
                  <span className="font-bold">In this app:</span> Create nodes using the "Create Person" form or Triple
                  Operations.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-md mb-1 text-secondary">Edges (Relations)</h4>
                <p className="text-sm mb-2">
                  Edges connect nodes to each other, defining how entities relate. Examples:
                </p>
                <ul className="list-disc list-inside text-sm ml-2 space-y-1">
                  <li>
                    Person <span className="text-secondary font-bold">→ WORKS_AT →</span> Company
                  </li>
                  <li>
                    Person <span className="text-secondary font-bold">→ KNOWS →</span> Person
                  </li>
                  <li>
                    Book <span className="text-secondary font-bold">→ AUTHORED_BY →</span> Person
                  </li>
                  <li>
                    City <span className="text-secondary font-bold">→ LOCATED_IN →</span> Country
                  </li>
                </ul>
                <p className="text-sm mt-2">
                  <span className="font-bold">In this app:</span> Create edges using Relation Operations by specifying
                  From Entity, Relation Type, and To Entity.
                </p>
              </div>
            </div>

            <div className="divider my-1"></div>

            <div className="mt-2">
              <h4 className="font-bold text-md mb-1">How Triple Operations Work</h4>
              <p className="text-sm mb-2">
                Triple operations define properties of nodes in a subject-predicate-object format:
              </p>
              <div className="bg-base-300 p-3 rounded text-sm font-mono">
                Entity ID (Node) → Attribute ID (Property) → Value (Data)
              </div>
              <div className="flex flex-col text-sm mt-2">
                <span>
                  <span className="font-bold">Example:</span> Person123 → hasName → "John Smith"
                </span>
                <span>
                  <span className="font-bold">Example:</span> City456 → population → 8500000
                </span>
                <span>
                  <span className="font-bold">Example:</span> Movie789 → releaseDate → "2023-05-15"
                </span>
              </div>
            </div>

            <div className="alert alert-info mt-4 text-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                className="stroke-current shrink-0 w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                ></path>
              </svg>
              <div>
                <span className="font-bold">Pro Tip:</span> Think of your knowledge graph like a graph database. Nodes
                store entity information, and edges define how entities relate to each other.
              </div>
            </div>
          </div>
        )}

        {/* Person Entity Section - Expandable */}
        <div className="card bg-base-100 border border-base-300 shadow-sm mb-4">
          <div
            className="card-title p-4 cursor-pointer flex justify-between items-center"
            onClick={() => setExpandPersonSection(!expandPersonSection)}
          >
            <h3 className="text-lg font-bold">Create Person Entity</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transition-transform duration-200 ${expandPersonSection ? "rotate-180" : ""}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {expandPersonSection && (
            <div className="card-body pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Person name"
                    className="input input-bordered"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Age</span>
                  </label>
                  <input
                    type="number"
                    placeholder="Age"
                    className="input input-bordered"
                    value={age}
                    onChange={e => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Location</span>
                  </label>
                  <input
                    type="text"
                    placeholder="City, Country"
                    className="input input-bordered"
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Bio</span>
                  </label>
                  <textarea
                    placeholder="Short biography"
                    className="textarea textarea-bordered"
                    value={bio}
                    onChange={e => setBio(e.target.value)}
                  />
                </div>
              </div>

              <button className="btn btn-primary mt-4" onClick={handleCreatePerson}>
                Create Person
              </button>
            </div>
          )}
        </div>

        {/* Publishing Section - Expandable */}
        <div className="card bg-base-100 border border-base-300 shadow-sm mb-4">
          <div
            className="card-title p-4 cursor-pointer flex justify-between items-center"
            onClick={() => setExpandPublishingSection(!expandPublishingSection)}
          >
            <h3 className="text-lg font-bold">Publishing</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transition-transform duration-200 ${expandPublishingSection ? "rotate-180" : ""}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {expandPublishingSection && (
            <div className="card-body pt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Operation Name</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., Create Person Entities"
                    className="input input-bordered"
                    value={operationName}
                    onChange={e => setOperationName(e.target.value)}
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Space ID</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Space ID"
                    className="input input-bordered"
                    value={spaceId}
                    onChange={e => setSpaceId(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <button
                  className="btn btn-secondary"
                  onClick={handlePublish}
                  disabled={operationsCount === 0 || !operationName}
                >
                  Publish All Operations
                </button>

                <button className="btn btn-outline" onClick={clearOperations} disabled={operationsCount === 0}>
                  Clear Operations
                </button>
              </div>

              {ipfsCid && (
                <div className="alert alert-info mt-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    className="stroke-current shrink-0 w-6 h-6"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                  <div>
                    <div className="text-sm font-bold">IPFS CID</div>
                    <div className="text-xs font-mono">{ipfsCid}</div>
                  </div>
                </div>
              )}

              {txHash && (
                <div className="alert alert-success mt-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="stroke-current shrink-0 h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <div className="text-sm font-bold">Transaction sent!</div>
                    <div className="text-xs font-mono">{txHash}</div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status Section - Expandable */}
        <div className="card bg-base-100 border border-base-300 shadow-sm">
          <div
            className="card-title p-4 cursor-pointer flex justify-between items-center"
            onClick={() => setExpandStatusSection(!expandStatusSection)}
          >
            <h3 className="text-lg font-bold">Status</h3>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 transition-transform duration-200 ${expandStatusSection ? "rotate-180" : ""}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          {expandStatusSection && (
            <div className="card-body pt-0">
              <div className="text-sm opacity-70">{lastStatus || "Ready"}</div>

              {operationsCount > 0 && (
                <div className="mt-2">
                  <h4 className="font-semibold text-sm">Pending Operations: {operationsCount}</h4>
                  <div className="mt-1 p-2 bg-base-200 rounded-lg text-xs max-h-24 overflow-y-auto">
                    {operations.map((op, index) => (
                      <div key={index} className="mb-1">
                        <span className="font-bold">{op.type}</span>: {op.action} -{" "}
                        {op.timestamp ? new Date(op.timestamp).toLocaleTimeString() : ""}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
