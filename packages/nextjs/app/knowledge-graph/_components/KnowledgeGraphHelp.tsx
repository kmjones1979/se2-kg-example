import { ExpandableCard } from "./ExpandableCard";

/**
 * Component providing educational content about knowledge graphs
 */
export const KnowledgeGraphHelp = () => {
  const checkmarkIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l3 3 9-9" />
    </svg>
  );

  return (
    <ExpandableCard title="Understanding Knowledge Graphs" icon={checkmarkIcon} defaultExpanded={true}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card bg-primary/10 shadow-sm">
          <div className="card-body p-4">
            <h3 className="font-bold text-primary">Nodes (Entities)</h3>
            <p className="text-sm">Nodes are the objects in your knowledge graph. They can be:</p>
            <ul className="list-disc list-inside text-sm mt-1 space-y-1">
              <li>People (e.g., "Alice")</li>
              <li>Organizations (e.g., "Acme Corp")</li>
              <li>Concepts (e.g., "Blockchain")</li>
              <li>Physical objects (e.g., "Eiffel Tower")</li>
            </ul>
            <div className="bg-base-300 p-2 rounded text-xs mt-2">
              <span className="font-bold">In this app:</span> Nodes are created using Triple Operations by specifying an
              Entity ID.
            </div>
          </div>
        </div>

        <div className="card bg-secondary/10 shadow-sm">
          <div className="card-body p-4">
            <h3 className="font-bold text-secondary">Edges (Relations)</h3>
            <p className="text-sm">Edges connect nodes, defining how entities relate to each other:</p>
            <ul className="list-disc list-inside text-sm mt-1 space-y-1">
              <li>
                Person <span className="text-secondary font-bold">→ FRIENDS_WITH →</span> Person
              </li>
              <li>
                Company <span className="text-secondary font-bold">→ EMPLOYS →</span> Person
              </li>
              <li>
                Product <span className="text-secondary font-bold">→ MADE_BY →</span> Company
              </li>
            </ul>
            <div className="bg-base-300 p-2 rounded text-xs mt-2">
              <span className="font-bold">In this app:</span> Edges are created using Relation Operations with From ID,
              Relation Type ID, and To ID.
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4">
        <h3 className="font-bold">Triple Operations Explained</h3>
        <p className="text-sm mt-1">A triple is a statement with three parts:</p>

        <div className="overflow-x-auto mt-2">
          <table className="table table-zebra text-sm">
            <thead>
              <tr className="text-primary">
                <th>Subject (Entity)</th>
                <th>Predicate (Attribute)</th>
                <th>Object (Value)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Person123</td>
                <td>hasName</td>
                <td>"John Smith"</td>
              </tr>
              <tr>
                <td>Building456</td>
                <td>height</td>
                <td>100 (meters)</td>
              </tr>
              <tr>
                <td>Document789</td>
                <td>published</td>
                <td>2023-06-15</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="alert alert-info mt-4 text-xs">
          <div>
            <span className="font-bold block">Triple vs. Relation</span>
            <span>
              • Triples define properties of a single entity (e.g., Person123 has name "John")
              <br />• Relations connect two entities (e.g., Person123 WORKS_AT Company456)
            </span>
          </div>
        </div>
      </div>
    </ExpandableCard>
  );
};
