interface OperationDetailsCardProps {
  operationName: string;
  setOperationName: (name: string) => void;
}

export const OperationDetailsCard = ({ operationName, setOperationName }: OperationDetailsCardProps) => {
  return (
    <div className="card bg-base-100 shadow-xl mb-8">
      <div className="card-body">
        <h2 className="card-title">Operation Details</h2>
        <div className="form-control">
          <label className="label">
            <span className="label-text">Operation Name</span>
          </label>
          <input
            type="text"
            placeholder="Name for this edit"
            className="input input-bordered"
            value={operationName}
            onChange={e => setOperationName(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};
