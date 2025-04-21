import { ExpandableCard } from "./ExpandableCard";

/**
 * Component providing educational content about knowledge graph IDs
 */
export const IdHelpCard = () => {
  const infoIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );

  return (
    <ExpandableCard
      title={
        <div className="flex items-center gap-2">
          {infoIcon}
          <span>About IDs</span>
        </div>
      }
      defaultExpanded={true}
    >
      <div className="space-y-2 text-sm">
        <p>
          <span className="font-bold text-primary">Entity IDs</span> - Unique identifiers for entities (nodes) in your
          knowledge graph. Entities represent distinct objects, concepts, or things.
        </p>
        <p>
          <span className="font-bold text-primary">Attribute IDs</span> - Identifiers for properties or characteristics
          that can be attached to entities. These define what kind of data can be stored.
        </p>
        <p>
          <span className="font-bold text-primary">Relation Type IDs</span> - Identifiers that define types of
          relationships between entities. These describe how entities are connected.
        </p>
        <p>
          <span className="font-bold text-primary">Relation IDs</span> - Unique identifiers for specific relationship
          instances between entities. Used when removing specific relations.
        </p>
      </div>

      <div className="mt-4 p-3 bg-base-200 rounded-box">
        <h3 className="font-bold mb-2">ID Format</h3>
        <p className="text-sm mb-2">All IDs are 22-character unique strings generated cryptographically secure.</p>
        <div className="overflow-x-auto">
          <table className="table table-xs">
            <thead>
              <tr>
                <th>ID Type</th>
                <th>Example</th>
                <th>Used For</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Entity ID</td>
                <td>
                  <code className="bg-base-300 px-1 rounded">A9QizqoXSqjfPUBjLoPJa2</code>
                </td>
                <td>Identifying objects/concepts</td>
              </tr>
              <tr>
                <td>Attribute ID</td>
                <td>
                  <code className="bg-base-300 px-1 rounded">GpnQE6H64aSfIE2ZRqBNZf</code>
                </td>
                <td>Defining properties</td>
              </tr>
              <tr>
                <td>Relation Type ID</td>
                <td>
                  <code className="bg-base-300 px-1 rounded">Cs3KPlZHREpMZLkXPb2nsU</code>
                </td>
                <td>Defining relationship types</td>
              </tr>
              <tr>
                <td>Relation ID</td>
                <td>
                  <code className="bg-base-300 px-1 rounded">j8KpR2mT7YhN3xZsF9aBcQ</code>
                </td>
                <td>Identifying specific relationships</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-xs italic mt-2">
          Note: You can generate random IDs using the Generate buttons, or use existing IDs from your knowledge graph to
          reference them.
        </p>
      </div>

      <div className="mt-4 p-3 bg-base-200 rounded-box">
        <h3 className="font-bold mb-2">Working with IDs - Best Practices</h3>
        <div className="space-y-3 text-sm">
          <div>
            <h4 className="font-semibold text-primary">Naming Conventions</h4>
            <p className="text-xs mt-1">
              While IDs are random strings, it's helpful to use consistent naming conventions for your attributes and
              relation types. For example:
            </p>
            <ul className="list-disc list-inside text-xs ml-2 mt-1">
              <li>
                <span className="font-medium">Attribute IDs</span>: hasName, createdAt, isActive
              </li>
              <li>
                <span className="font-medium">Relation Types</span>: WORKS_FOR, PART_OF, LOCATED_IN
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-primary">ID Management Tips</h4>
            <ul className="list-disc list-inside text-xs ml-2">
              <li>Create a separate entity for each distinct object in your domain</li>
              <li>Reuse existing IDs to connect related information</li>
              <li>Store important IDs in a separate document for reference</li>
              <li>Use the operations log to track your created entities and relationships</li>
            </ul>
          </div>

          <div className="bg-primary/10 p-2 rounded text-xs">
            <span className="font-bold block">Example Usage Pattern:</span>
            <ol className="list-decimal list-inside space-y-1 mt-1">
              <li>Generate an Entity ID for "Company XYZ"</li>
              <li>Add triples to define its properties (name, location, founded date)</li>
              <li>Generate Entity IDs for related entities (products, employees)</li>
              <li>Create relations between the company and these entities</li>
            </ol>
          </div>
        </div>
      </div>
    </ExpandableCard>
  );
};
