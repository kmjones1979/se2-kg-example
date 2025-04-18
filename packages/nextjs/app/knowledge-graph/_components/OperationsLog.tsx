interface OperationsLogProps {
  ops: any[];
  clearOps: () => void;
}

export const OperationsLog = ({ ops, clearOps }: OperationsLogProps) => {
  return (
    <div className="card bg-base-100 shadow-xl mb-8">
      <div className="card-body">
        <h2 className="card-title">
          Operations Log
          <div className="badge badge-primary">{ops.length}</div>
          {ops.length > 0 && (
            <button className="btn btn-sm btn-error ml-auto" onClick={clearOps}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              Clear
            </button>
          )}
        </h2>
        <div className="bg-base-300 p-4 rounded-lg overflow-auto max-h-60">
          {ops.length > 0 ? (
            <pre className="text-sm">{JSON.stringify(ops, null, 2)}</pre>
          ) : (
            <div className="text-center text-base-content/60 py-8">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 mx-auto mb-2 opacity-40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <p>No operations added yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
