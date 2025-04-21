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
            <span className="label-text">
              Operation Name <span className="text-error">*</span>
            </span>
            <span className="label-text-alt text-info">Required for publishing</span>
          </label>
          <input
            type="text"
            placeholder="Name for this edit"
            className={`input input-bordered ${!operationName ? "input-error" : "input-success"}`}
            value={operationName}
            onChange={e => setOperationName(e.target.value)}
          />
          <label className="label">
            <span className="label-text-alt">
              {!operationName ? (
                <span className="text-error">Operation name is required to publish operations</span>
              ) : (
                <span className="text-success">✓ Ready to publish</span>
              )}
            </span>
          </label>
        </div>
        <div className="bg-base-200 p-3 rounded-lg mt-2">
          <p className="text-sm">
            <span className="font-semibold">Important:</span> The "Publish Operations" button will be disabled until
            you:
            <ul className="list-disc list-inside mt-1 ml-2">
              <li className={operationName ? "text-success" : "text-error"}>Enter an operation name above</li>
              <li>Add at least one operation to the list</li>
            </ul>
          </p>
        </div>
      </div>
    </div>
  );
};
