interface PublishCardProps {
  ipfsCid: string;
  txData: { to: string; data: string } | null;
  txHash: string | null;
  txReceipt: any;
  activeStep: number;
  publishToIPFS: () => void;
  getCallData: () => void;
  sendTransaction: () => void;
  ops: any[];
  operationName: string;
  spaceId: string;
}

export const PublishCard = ({
  ipfsCid,
  txData,
  txHash,
  txReceipt,
  activeStep,
  publishToIPFS,
  getCallData,
  sendTransaction,
  ops,
  operationName,
  spaceId,
}: PublishCardProps) => {
  return (
    <div className="card bg-base-100 shadow-xl mb-8">
      <div className="card-body">
        <h2 className="card-title mb-4">Publish and Execute</h2>
        {/* Action Steps */}
        <div className="flex flex-col gap-4">
          {/* Step 1 */}
          <div className="collapse collapse-arrow bg-base-200 rounded-lg">
            <input type="radio" name="publish-steps" defaultChecked />
            <div className="collapse-title font-medium flex items-center">
              <div className="badge badge-primary mr-2">1</div>
              Publish to IPFS
            </div>
            <div className="collapse-content">
              <button
                className="btn btn-primary w-full mt-2"
                onClick={publishToIPFS}
                disabled={ops.length === 0 || !operationName}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Publish to IPFS
              </button>
            </div>
          </div>

          {/* Step 2 */}
          <div
            className={`collapse collapse-arrow bg-base-200 rounded-lg ${ipfsCid ? "" : "opacity-60 pointer-events-none"}`}
          >
            <input type="radio" name="publish-steps" disabled={!ipfsCid} />
            <div className="collapse-title font-medium flex items-center">
              <div className="badge badge-primary mr-2">2</div>
              Get Transaction Data
            </div>
            <div className="collapse-content">
              {ipfsCid && (
                <div className="mb-4">
                  <p className="text-sm mb-1 opacity-80">IPFS CID:</p>
                  <div className="bg-base-300 p-2 rounded text-xs break-all">{ipfsCid}</div>
                </div>
              )}
              <button className="btn btn-primary w-full mt-2" onClick={getCallData} disabled={!ipfsCid || !spaceId}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
                Get Transaction Data
              </button>
            </div>
          </div>

          {/* Step 3 */}
          <div
            className={`collapse collapse-arrow bg-base-200 rounded-lg ${txData ? "" : "opacity-60 pointer-events-none"}`}
          >
            <input type="radio" name="publish-steps" disabled={!txData} />
            <div className="collapse-title font-medium flex items-center">
              <div className="badge badge-primary mr-2">3</div>
              Send Transaction
            </div>
            <div className="collapse-content">
              {txData && (
                <div className="space-y-4 mb-4">
                  <div>
                    <p className="text-sm mb-1 opacity-80">Contract Address:</p>
                    <div className="bg-base-300 p-2 rounded text-xs break-all">{txData.to}</div>
                  </div>
                  <div>
                    <p className="text-sm mb-1 opacity-80">Call Data:</p>
                    <div className="bg-base-300 p-2 rounded text-xs break-all overflow-auto max-h-24">
                      {txData.data}
                    </div>
                  </div>
                </div>
              )}
              <button className="btn btn-primary w-full mt-2" onClick={sendTransaction} disabled={!txData}>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Send Transaction
              </button>
            </div>
          </div>

          {/* Transaction Result */}
          {txHash && (
            <div className="bg-base-200 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-sm">Transaction Result</h3>
                <div className="badge badge-success">Sent</div>
              </div>
              <div className="divider my-2"></div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs mb-1 opacity-80">Transaction Hash:</p>
                  <div className="bg-base-300 p-2 rounded text-xs break-all">{txHash}</div>
                </div>
                <div>
                  <p className="text-xs mb-1 opacity-80">Status:</p>
                  <div className="bg-base-300 p-2 rounded text-xs">
                    {txReceipt ? (
                      <span className="text-success flex items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 mr-1"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Confirmed in block {txReceipt.blockNumber}
                      </span>
                    ) : (
                      <span className="text-warning flex items-center">
                        <svg
                          className="animate-spin h-4 w-4 mr-1"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Pending...
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
