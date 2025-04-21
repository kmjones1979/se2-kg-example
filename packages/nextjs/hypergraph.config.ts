/**
 * Hypergraph Configuration
 * Global configuration for The Graph Knowledge Graph API integration
 */

export type NetworkType = "TESTNET" | "MAINNET";

interface ApiEndpoint {
  url: string;
  actualUrl: string;
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

  // Smart account settings
  useSmartAccount: boolean;
  geoPrivateKey: string;

  // Mock data for fallback
  mockData: {
    txData: {
      to: string;
      data: string;
    };
  };
}

// The actual GRC-20 API endpoints
const ACTUAL_ENDPOINTS = {
  TESTNET: "https://api-testnet.grc-20.thegraph.com",
  MAINNET: "https://api-testnet.grc-20.thegraph.com", // Currently same as testnet
};

// Helper function to check if running in browser environment
const isBrowser = typeof window !== "undefined";

// Use local proxy in development, direct API in production
const useProxy = process.env.NODE_ENV === "development" && isBrowser;

// Generate proper URLs based on environment
const getProxyUrl = (actualUrl: string) => {
  // In browser dev environment, use the proxy
  if (useProxy) {
    return `/api/proxy?url=${encodeURIComponent(actualUrl)}`;
  }
  // In production or server-side, use the actual URL
  return actualUrl;
};

/**
 * Global Hypergraph configuration
 */
const hypergraphConfig: HypergraphConfig = {
  defaultNetwork: "MAINNET",
  defaultSpaceId: "LB1JjNpxXBjP7caanTx3bP",

  endpoints: {
    TESTNET: {
      url: getProxyUrl(ACTUAL_ENDPOINTS.TESTNET),
      actualUrl: ACTUAL_ENDPOINTS.TESTNET,
      description: "The Graph Protocol GRC-20 Testnet API",
    },
    MAINNET: {
      url: getProxyUrl(ACTUAL_ENDPOINTS.MAINNET),
      actualUrl: ACTUAL_ENDPOINTS.MAINNET,
      description: "The Graph Protocol GRC-20 Mainnet API",
    },
  },

  useMockData: process.env.NODE_ENV === "development" && process.env.USE_MOCK_DATA === "true",

  // Smart account settings
  useSmartAccount: true, // Set to true to always use smart account by default
  geoPrivateKey: process.env.GEO_PRIVATE_KEY || "", // Get private key from environment variable

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
 * Get the actual API endpoint URL (without proxy)
 */
export const getActualApiEndpoint = (network: NetworkType = hypergraphConfig.defaultNetwork): string => {
  return hypergraphConfig.endpoints[network].actualUrl;
};

/**
 * Get the full API URL for calldata endpoint
 */
export const getCalldataApiUrl = (
  spaceId: string = hypergraphConfig.defaultSpaceId,
  network: NetworkType = hypergraphConfig.defaultNetwork,
): string => {
  if (useProxy) {
    // For proxy, encode the full target URL as a query parameter
    const targetUrl = `${getActualApiEndpoint(network)}/space/${spaceId}/edit/calldata`;
    return `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
  } else {
    // Direct API call for server-side or production
    const baseUrl = getApiEndpoint(network);
    return `${baseUrl}/space/${spaceId}/edit/calldata`;
  }
};

/**
 * Create a proxied URL for any API path
 */
export const createProxiedUrl = (path: string, network: NetworkType = hypergraphConfig.defaultNetwork): string => {
  const targetUrl = `${getActualApiEndpoint(network)}${path}`;
  if (useProxy) {
    return `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
  }
  return targetUrl;
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

/**
 * Check if smart account should be used
 */
export const shouldUseSmartAccount = (): boolean => {
  return hypergraphConfig.useSmartAccount;
};

/**
 * Get GEO private key
 */
export const getGeoPrivateKey = (): string => {
  return hypergraphConfig.geoPrivateKey;
};

export default hypergraphConfig;
