import { useEffect, useState } from "react";
import { Wallet } from "ethers";
import { Address } from "~~/components/scaffold-eth";
import { getGeoPrivateKey, shouldUseSmartAccount } from "~~/hypergraph.config";

interface ConnectedAddressCardProps {
  connectedAddress: string | undefined;
  spaceId: string;
  setSpaceId: (spaceId: string) => void;
}

export const ConnectedAddressCard = ({ connectedAddress, spaceId, setSpaceId }: ConnectedAddressCardProps) => {
  const [showPrivateKeyInfo, setShowPrivateKeyInfo] = useState(false);
  const [geoAddress, setGeoAddress] = useState<string | null>(null);
  const usingSmartAccount = shouldUseSmartAccount();
  const privateKey = getGeoPrivateKey();
  const hasPrivateKey = !!privateKey;

  // Derive GEO address from private key
  useEffect(() => {
    const deriveAddress = async () => {
      if (privateKey) {
        try {
          // Create a wallet instance from the private key
          const wallet = new Wallet(privateKey);
          // Get the address
          const address = await wallet.getAddress();
          setGeoAddress(address);
        } catch (error) {
          console.error("Error deriving address from private key:", error);
          setGeoAddress(null);
        }
      } else {
        setGeoAddress(null);
      }
    };

    deriveAddress();
  }, [privateKey]);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-4">
      <div className="card bg-base-100 shadow-xl mb-4">
        <div className="card-body p-4 md:p-6">
          <h2 className="card-title text-xl mb-4">Connection Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm mb-2 opacity-80">Connected Wallet:</p>
              {connectedAddress ? (
                <Address address={connectedAddress} size="base" />
              ) : (
                <p className="text-error">No wallet connected</p>
              )}
            </div>
            <div>
              <p className="text-sm mb-2 opacity-80">Space ID:</p>
              <div className="join w-full">
                <input
                  type="text"
                  className="input input-bordered join-item w-full"
                  placeholder="Space ID"
                  value={spaceId}
                  onChange={e => setSpaceId(e.target.value)}
                />
                <button
                  className="btn join-item"
                  onClick={() => {
                    navigator.clipboard.writeText(spaceId);
                  }}
                >
                  Copy
                </button>
              </div>
            </div>
          </div>

          {/* Smart Account Information */}
          {usingSmartAccount && (
            <div className="mt-6 p-4 bg-base-200 rounded-lg">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V8a2 2 0 00-2-2h-5L9 4H4zm7 5a1 1 0 10-2 0v1H8a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V9z"
                      clipRule="evenodd"
                    />
                  </svg>
                  GEO Smart Account
                </h3>
                <span className={`badge ${hasPrivateKey ? "badge-success" : "badge-error"}`}>
                  {hasPrivateKey ? "Configured" : "Not Configured"}
                </span>
              </div>

              {/* Display the GEO wallet address if available */}
              {geoAddress ? (
                <div className="mt-4 p-4 bg-base-300 rounded-lg">
                  <p className="text-sm mb-2 opacity-80">GEO Smart Account Address:</p>
                  <Address address={geoAddress} size="base" />
                  <div className="text-sm text-info mt-2">
                    This address is derived from your GEO private key and will be used for transactions
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button
                      className="btn btn-outline btn-info flex-1"
                      onClick={async () => {
                        try {
                          // This is just a quick test to validate the private key format
                          // It doesn't actually send any transaction
                          const { getSmartAccountWalletClient } = await import("@graphprotocol/grc-20");
                          await getSmartAccountWalletClient({
                            privateKey: privateKey as `0x${string}`,
                          });
                          // Show success alert or notification
                          alert("Smart Account validated successfully! Your private key is correctly formatted.");
                        } catch (error) {
                          console.error("Smart Account validation error:", error);
                          alert(
                            `Error validating Smart Account: ${error instanceof Error ? error.message : String(error)}`,
                          );
                        }
                      }}
                    >
                      Test Smart Account
                    </button>
                    {process.env.NODE_ENV === "development" && (
                      <button
                        className="btn btn-outline btn-secondary flex-1"
                        onClick={() => {
                          // Show key details for debugging in development mode
                          const keyLength = privateKey.startsWith("0x") ? privateKey.length - 2 : privateKey.length;

                          // Don't show the actual key, just diagnostic info
                          const info = `
Private Key Diagnostics:
- Has 0x prefix: ${privateKey.startsWith("0x") ? "Yes" : "No"}
- Hex part length: ${keyLength} characters (should be 64)
- First 4 chars: ${privateKey.substring(0, 4)}...
- Last 4 chars: ...${privateKey.substring(privateKey.length - 4)}

Proper format requires:
- 0x prefix
- 64 hex characters after prefix
- Total length of 66 characters
                          `;
                          alert(info);
                        }}
                      >
                        Diagnose Key Format
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mt-4 p-4 bg-base-300 rounded-lg text-error">
                  <p>Could not derive smart account address from the provided private key.</p>
                  <p className="text-sm mt-2">
                    The key may be in an invalid format. Please check your environment variable.
                  </p>
                </div>
              )}

              <div className="mt-4">
                <button className="btn btn-outline w-full" onClick={() => setShowPrivateKeyInfo(!showPrivateKeyInfo)}>
                  {showPrivateKeyInfo ? "Hide Setup Instructions" : "Show Setup Instructions"}
                </button>

                {showPrivateKeyInfo && (
                  <div className="mt-4 text-sm space-y-2 p-4 bg-base-300 rounded-lg">
                    <p>To use GEO Smart Account, you need to:</p>
                    <ol className="list-decimal pl-4 space-y-2">
                      <li>
                        Get your GEO Wallet private key from{" "}
                        <a
                          href="https://www.geobrowser.io/export-wallet"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-500 underline"
                        >
                          www.geobrowser.io/export-wallet
                        </a>
                      </li>
                      <li>
                        Create a <code className="bg-base-200 px-1 rounded">packages/nextjs/.env.local</code> file
                      </li>
                      <li>Add the following line (replace with your actual private key):</li>
                    </ol>
                    <div className="bg-neutral text-neutral-content p-4 rounded font-mono mt-2">
                      NEXT_PUBLIC_GEO_PRIVATE_KEY=0xYourPrivateKeyHere
                    </div>
                    <p className="text-warning mt-4">
                      <strong>⚠️ Warning:</strong> Never share your private key. Ensure it's not committed to version
                      control.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
