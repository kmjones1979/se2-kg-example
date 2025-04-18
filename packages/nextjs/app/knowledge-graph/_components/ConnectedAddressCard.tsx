import { Address } from "~~/components/scaffold-eth";

interface ConnectedAddressCardProps {
  connectedAddress: string | undefined;
  spaceId: string;
  setSpaceId: (id: string) => void;
}

export const ConnectedAddressCard = ({ connectedAddress, spaceId, setSpaceId }: ConnectedAddressCardProps) => {
  return (
    <div className="container mx-auto p-4 -mt-8">
      <div className="card bg-base-100 shadow-xl p-4 mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col items-center md:items-start">
            <p className="text-base-content/70 text-sm mb-1">Connected Address</p>
            <Address address={connectedAddress} />
          </div>

          {/* Space ID */}
          <div className="form-control w-full md:w-2/3">
            <label className="label">
              <span className="label-text">Space ID</span>
            </label>
            <input
              type="text"
              placeholder="Enter your space ID"
              className="input input-bordered w-full"
              value={spaceId}
              onChange={e => setSpaceId(e.target.value)}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
