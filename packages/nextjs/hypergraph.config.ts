/**
 * Hypergraph Configuration
 * Global configuration for The Graph Knowledge Graph API integration
 */

export type NetworkType = "TESTNET" | "MAINNET";

interface ApiEndpoint {
  url: string;
  description: string;
}

interface HypergraphConfig {
  // Default network to use
  defaultNetwork: NetworkType;

  // Default space ID to use
  defaultSpaceId: string;

  // API endpoints by network
  endpoints: Record<NetworkType, ApiEndpoint>;

  // Whether to use mock data in development
  useMockData: boolean;

  // Mock data for fallback
  mockData: {
    txData: {
      to: string;
      data: string;
    };
  };
}

/**
 * Global Hypergraph configuration
 */
const hypergraphConfig: HypergraphConfig = {
  defaultNetwork: "MAINNET",
  defaultSpaceId: "LB1JjNpxXBjP7caanTx3bP",

  endpoints: {
    TESTNET: {
      url: "https://api-testnet.grc-20.thegraph.com",
      description: "The Graph Protocol Testnet API",
    },
    MAINNET: {
      url: "https://hypergraph.up.railway.app",
      description: "Hypergraph Railway Mainnet API",
    },
  },

  useMockData: process.env.NODE_ENV === "development" && process.env.USE_MOCK_DATA === "true",

  mockData: {
    txData: {
      to: "0x731a10897d267e19b34503ad902d0a29173ba4b1",
      data: "0x4554480000000000000000000000000000000000000000000000000000000000",
    },
  },
};

/**
 * Get API endpoint URL for a specific network
 */
export const getApiEndpoint = (network: NetworkType = hypergraphConfig.defaultNetwork): string => {
  return hypergraphConfig.endpoints[network].url;
};

/**
 * Get the full API URL for calldata endpoint
 */
export const getCalldataApiUrl = (
  spaceId: string = hypergraphConfig.defaultSpaceId,
  network: NetworkType = hypergraphConfig.defaultNetwork,
): string => {
  const baseUrl = getApiEndpoint(network);
  return `${baseUrl}/space/${spaceId}/edit/calldata`;
};

/**
 * Check if mock data should be used
 */
export const shouldUseMockData = (): boolean => {
  return hypergraphConfig.useMockData;
};

/**
 * Get mock transaction data
 */
export const getMockTxData = () => {
  return { ...hypergraphConfig.mockData.txData };
};

/**
 * Get default space ID
 */
export const getDefaultSpaceId = (): string => {
  return hypergraphConfig.defaultSpaceId;
};

/**
 * Get default network
 */
export const getDefaultNetwork = (): NetworkType => {
  return hypergraphConfig.defaultNetwork;
};

export default hypergraphConfig;
