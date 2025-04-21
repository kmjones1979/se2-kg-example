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
  // You can get your private key using https://www.geobrowser.io/export-wallet
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
  useSmartAccount: true, // Set to true to use smart account wallet by default
  // You can get your private key using https://www.geobrowser.io/export-wallet
  geoPrivateKey: process.env.NEXT_PUBLIC_GEO_PRIVATE_KEY || process.env.GEO_PRIVATE_KEY || "", // Get private key from environment variable

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
 * Validate and fix private key format
 * @param key The private key to validate
 * @returns An object with the fixed key and validation info
 */
const validateAndFixPrivateKey = (
  key: string,
): {
  key: string;
  isValid: boolean;
  message: string;
} => {
  if (!key || key.trim() === "") {
    return {
      key: "",
      isValid: false,
      message: "Private key is empty",
    };
  }

  // Remove any whitespace
  let cleanKey = key.trim();

  // Check if key has 0x prefix, add if missing
  if (!cleanKey.startsWith("0x")) {
    cleanKey = `0x${cleanKey}`;
    console.log("Added 0x prefix to private key");
  }

  // Remove 0x prefix to check the hex part length
  const hexPart = cleanKey.substring(2);

  // Check if key contains only hex characters
  const validHexRegex = /^[0-9a-fA-F]+$/;
  if (!validHexRegex.test(hexPart)) {
    return {
      key: cleanKey,
      isValid: false,
      message: "Private key contains non-hex characters",
    };
  }

  // Check key length
  if (hexPart.length < 64) {
    return {
      key: cleanKey,
      isValid: false,
      message: `Private key too short: ${hexPart.length} chars, expected 64`,
    };
  } else if (hexPart.length > 64) {
    // Key might be too long, try to extract the correct portion
    console.warn(`Private key too long: ${hexPart.length} chars, will attempt to truncate to 64`);
    cleanKey = `0x${hexPart.substring(0, 64)}`;
    return {
      key: cleanKey,
      isValid: true,
      message: "Private key was too long and has been truncated to 64 characters",
    };
  }

  return {
    key: cleanKey,
    isValid: true,
    message: "Private key is valid",
  };
};

/**
 * Get GEO private key
 */
export const getGeoPrivateKey = (): string => {
  // Try to get the private key from environment variables
  const rawPrivateKey = process.env.NEXT_PUBLIC_GEO_PRIVATE_KEY || process.env.GEO_PRIVATE_KEY || "";

  // Validate and potentially fix the key
  const { key, isValid, message } = validateAndFixPrivateKey(rawPrivateKey);

  // For debugging
  if (process.env.NODE_ENV === "development") {
    if (!key) {
      console.warn("⚠️ No GEO private key found in environment variables. Smart account transactions will fail.");
      console.warn("Set NEXT_PUBLIC_GEO_PRIVATE_KEY in your .env.local file.");
    } else if (!isValid) {
      console.warn(`⚠️ ${message}`);
      console.warn("Please check your private key format in .env.local");
    } else {
      // Don't log the actual key, just that it was found and is valid
      console.log(`✅ GEO private key found: ${message}`);
    }
  }

  return key;
};

export default hypergraphConfig;
