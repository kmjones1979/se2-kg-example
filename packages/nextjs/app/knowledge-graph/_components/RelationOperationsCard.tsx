import { Relation } from "@graphprotocol/grc-20";

interface RelationOperationsCardProps {
  fromId: string;
  relationTypeId: string;
  toId: string;
  relationId: string;
  addOperation: (op: any) => void;
  setStatus: (status: string) => void;
  handleGenerateFromEntityID: () => void;
  handleGenerateRelationTypeID: () => void;
  handleGenerateToEntityID: () => void;
  handleGenerateRelationID: () => void;
}

export const RelationOperationsCard = ({
  fromId,
  relationTypeId,
  toId,
  relationId,
  addOperation,
  setStatus,
  handleGenerateFromEntityID,
  handleGenerateRelationTypeID,
  handleGenerateToEntityID,
  handleGenerateRelationID,
}: RelationOperationsCardProps) => {
  const addRelationOp = () => {
    if (!fromId || !relationTypeId || !toId) {
      setStatus("Please fill all relation fields");
      return;
    }

    const createRelationOp = Relation.make({
      fromId,
      relationTypeId,
      toId,
    });
    addOperation(createRelationOp);
    setStatus(`Added Relation operation`);
  };

  const removeRelationOp = () => {
    if (!relationId) {
      setStatus("Relation ID is required");
      return;
    }

    const deleteRelationOp = Relation.remove(relationId);
    addOperation(deleteRelationOp);
    setStatus(`Added Delete Relation operation`);
  };

  return (
    <div className="card bg-base-100 shadow-xl mb-8">
      <div className="card-body">
        <h2 className="card-title">Relation Operations</h2>
        <div className="grid gap-4">
          <div className="form-control">
            <label className="label">
              <span className="label-text">From ID</span>
              <button className="btn btn-xs btn-outline btn-primary" onClick={handleGenerateFromEntityID}>
                Generate
              </button>
            </label>
            <input type="text" placeholder="From Entity ID" className="input input-bordered" value={fromId} readOnly />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Relation Type ID</span>
              <button className="btn btn-xs btn-outline btn-primary" onClick={handleGenerateRelationTypeID}>
                Generate
              </button>
            </label>
            <input
              type="text"
              placeholder="Relation Type ID"
              className="input input-bordered"
              value={relationTypeId}
              readOnly
            />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">To ID</span>
              <button className="btn btn-xs btn-outline btn-primary" onClick={handleGenerateToEntityID}>
                Generate
              </button>
            </label>
            <input type="text" placeholder="To Entity ID" className="input input-bordered" value={toId} readOnly />
          </div>
          <div className="form-control">
            <label className="label">
              <span className="label-text">Relation ID (for removal)</span>
              <button className="btn btn-xs btn-outline btn-primary" onClick={handleGenerateRelationID}>
                Generate
              </button>
            </label>
            <input type="text" placeholder="Relation ID" className="input input-bordered" value={relationId} readOnly />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
            <button className="btn btn-primary" onClick={addRelationOp}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Add Relation
            </button>
            <button className="btn btn-secondary" onClick={removeRelationOp}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
              Remove Relation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
