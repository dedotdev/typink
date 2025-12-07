import { atom } from 'jotai';
import {
  cacheMetadataAtom,
  clientConnectionStatusMapAtom,
  clientsMapAtom,
  networkConnectionsAtom,
  supportedNetworksAtom,
} from './clientAtoms.js';
import { finalEffectiveSignerAtom } from './walletAtoms.js';
import {
  ClientConnectionStatus,
  JsonRpcApi,
  NetworkConnection,
  NetworkId,
  NetworkInfo,
  validateProvider,
} from '../types.js';
import { DedotClient, JsonRpcProvider, SmoldotProvider, WsProvider } from 'dedot';
import { startWithWorker } from 'dedot/smoldot/with-worker';
import { type Chain, type Client } from 'smoldot';

// Global smoldot instances
let smoldotClient: Client | null = null;
let smoldotChains: Map<string, Chain> = new Map();
let relayChains: Map<string, Chain> = new Map();

/**
 * Initialize smoldot worker
 */
const initSmoldotWorker = () => {
  return startWithWorker(
    new Worker(
      new URL('dedot/smoldot/worker', import.meta.url), // --
      { type: 'module' },
    ),
  );
};

/**
 * Shared method to get or create a smoldot chain with relay chain support
 */
async function getOrCreateSmoldotChain(network: NetworkInfo): Promise<Chain> {
  // Check if chain already exists
  const existingChain = smoldotChains.get(network.id);
  if (existingChain) return existingChain;

  // Initialize smoldot client with Web Worker if needed
  if (!smoldotClient) {
    smoldotClient = initSmoldotWorker();
  }

  let chain: Chain;

  if (network.relayChain && network.relayChain.chainSpec) {
    // Parachain: needs relay chain
    let relayChain = relayChains.get(network.relayChain.id);

    if (!relayChain) {
      // Create relay chain if it doesn't exist
      const relayChainSpec = await network.relayChain.chainSpec();
      relayChain = await smoldotClient!.addChain({
        chainSpec: relayChainSpec,
      });
      relayChains.set(network.relayChain.id, relayChain);
    }

    // Create parachain with relay chain
    const parachainSpec = await network.chainSpec!();
    chain = await smoldotClient!.addChain({
      chainSpec: parachainSpec,
      potentialRelayChains: [relayChain],
    });
  } else {
    // Standalone chain
    const chainSpec = await network.chainSpec!();
    chain = await smoldotClient!.addChain({
      chainSpec,
    });
  }

  smoldotChains.set(network.id, chain);
  return chain;
}

/**
 * Remove a smoldot chain and clean up
 */
async function removeSmoldotChain(networkId: string): Promise<void> {
  const chain = smoldotChains.get(networkId);
  if (chain) {
    await chain.remove();
    smoldotChains.delete(networkId);
  }
}

/**
 * Create a client for a specific network
 */
async function createClient(
  network: NetworkInfo,
  providerType: string | undefined,
  cacheMetadata: boolean,
  signer?: any,
): Promise<DedotClient> {
  const selectedProvider = validateProvider(providerType);
  let provider: JsonRpcProvider;

  if (selectedProvider === 'light-client') {
    if (!network.chainSpec) {
      throw new TypeError('Network does not support light client - missing chainSpec');
    }
    const chain = await getOrCreateSmoldotChain(network);
    provider = new SmoldotProvider(chain);
  } else if (selectedProvider === 'random-rpc' || !selectedProvider) {
    provider = new WsProvider({
      endpoint: network.providers,
      maxRetryAttempts: 5,
      retryDelayMs: 1500,
    });
  } else {
    provider = new WsProvider({
      endpoint: selectedProvider,
      maxRetryAttempts: 5,
      retryDelayMs: 1500,
    });
  }

  // Create client based on API type
  const rpcVersion = network.jsonRpcApi === JsonRpcApi.LEGACY ? 'legacy' : 'v2';

  const client = await DedotClient.new({ provider, cacheMetadata, rpcVersion });

  // Set signer if available
  if (signer) {
    client.setSigner(signer);
  }

  return client;
}

/**
 * Clean up a client and its resources
 */
async function cleanupClient(
  client: DedotClient | undefined,
  networkId: NetworkId,
  providerType?: string,
): Promise<void> {
  if (!client) return;

  try {
    await client.disconnect();

    // Clean up smoldot chain if we were using light client
    if (validateProvider(providerType) === 'light-client') {
      await removeSmoldotChain(networkId);
    }
  } catch (e) {
    console.error(`Error disconnecting client for network ${networkId}:`, e);
  }
}

// Write-only atom for initializing all clients (merged from initializeClientAtom and initializeAdditionalClientsAtom)
export const initializeClientsAtom = atom(null, async (get, set) => {
  const connections = get(networkConnectionsAtom);
  const supportedNetworks = get(supportedNetworksAtom);
  const cacheMetadata = get(cacheMetadataAtom);
  const signer = get(finalEffectiveSignerAtom);

  if (connections.length === 0) {
    console.warn('No network connections configured');
    return;
  }

  const allNetworkIds = connections.map((conn) => conn.networkId);
  const activeNetworkIds = new Set(allNetworkIds);

  // Reset connection status for all active networks
  const newStatusMap = new Map<NetworkId, ClientConnectionStatus>();
  for (const networkId of allNetworkIds) {
    newStatusMap.set(networkId, ClientConnectionStatus.NotConnected);
  }
  set(clientConnectionStatusMapAtom, newStatusMap);

  // Clean up ALL networks that aren't in the current connections list
  // This ensures complete ecosystem switching cleanup
  const currentClients = get(clientsMapAtom);
  const currentNetworkIds = Array.from(currentClients.keys());

  // Clean up obsolete networks sequentially (cleanup needs to be sequential)
  for (const networkId of currentNetworkIds) {
    if (!activeNetworkIds.has(networkId)) {
      // This network is no longer active, clean it up
      const existingClient = currentClients.get(networkId);
      if (existingClient) {
        const connection = connections.find((conn) => conn.networkId === networkId);
        await cleanupClient(existingClient, networkId, connection?.provider);
      }
      set(removeNetworkStateAtom, networkId);
    }
  }

  // Helper function to initialize a single network
  const initializeNetwork = async (connection: NetworkConnection): Promise<void> => {
    const { networkId, provider: providerType } = connection;
    const network = supportedNetworks.find((n) => n.id === networkId);

    if (!network) {
      console.error(`Network with ID '${networkId}' not found in supported networks`);
      return;
    }

    // Set status to Connecting
    set(updateClientConnectionStatusAtom, networkId, ClientConnectionStatus.Connecting);

    // Clean up existing client if any (for re-initialization)
    const existingClient = get(clientsMapAtom).get(networkId);
    if (existingClient) {
      await cleanupClient(existingClient, networkId, providerType);
      set(removeNetworkStateAtom, networkId);
    }

    try {
      const client = await createClient(network, providerType, cacheMetadata, signer);

      // Add provider event listeners
      const provider = client.provider;

      provider.on('connected', () => {
        set(updateClientConnectionStatusAtom, networkId, ClientConnectionStatus.Connected);
      });

      provider.on('reconnecting', () => {
        set(updateClientConnectionStatusAtom, networkId, ClientConnectionStatus.Connecting);
      });

      provider.on('disconnected', () => {
        set(updateClientConnectionStatusAtom, networkId, ClientConnectionStatus.NotConnected);
      });

      provider.on('error', (error: any) => {
        console.error(`Provider error for network ${networkId}:`, error);

        const currentStatus = get(clientConnectionStatusMapAtom).get(networkId);
        if (currentStatus !== ClientConnectionStatus.Connected) {
          set(updateClientConnectionStatusAtom, networkId, ClientConnectionStatus.Error);
        }
      });

      // Check current status and update accordingly
      if (provider.status === 'connected') {
        set(updateClientConnectionStatusAtom, networkId, ClientConnectionStatus.Connected);
      } else if (provider.status === 'reconnecting') {
        set(updateClientConnectionStatusAtom, networkId, ClientConnectionStatus.Connecting);
      }

      // Update client immediately (only add when successfully connected)
      set(setNetworkClientAtom, networkId, client);
    } catch (e) {
      console.error(`Error initializing client for network ${networkId}:`, e);
      set(updateClientConnectionStatusAtom, networkId, ClientConnectionStatus.Error);
      throw e;
    }
  };

  await Promise.all(connections.map((conn) => initializeNetwork(conn)));
});

// Write-only atom for cleaning up all clients
export const cleanupAllClientsAtom = atom(null, async (get, set) => {
  const clientsMap = get(clientsMapAtom);
  const connections = get(networkConnectionsAtom);

  // Clean up all clients
  for (const [id, client] of clientsMap.entries()) {
    const connection = connections.find((conn) => conn.networkId === id);
    await cleanupClient(client, id, connection?.provider);
  }

  // Clear the map
  set(clientsMapAtom, new Map());
});

// Atomic update functions to prevent race conditions
export const setNetworkClientAtom = atom(null, (get, set, networkId: NetworkId, client: DedotClient | undefined) => {
  const clientsMap = new Map(get(clientsMapAtom));
  if (client) {
    clientsMap.set(networkId, client);
  } else {
    clientsMap.delete(networkId);
  }
  set(clientsMapAtom, clientsMap);
});

export const removeNetworkStateAtom = atom(null, (get, set, networkId: NetworkId) => {
  const clientsMap = new Map(get(clientsMapAtom));
  clientsMap.delete(networkId);
  set(clientsMapAtom, clientsMap);
});

// Write-only atom for updating signer on all clients
export const updateClientSignerAtom = atom(null, (get) => {
  const clientsMap = get(clientsMapAtom);
  const signer = get(finalEffectiveSignerAtom);

  // Update signer for all clients
  for (const client of clientsMap.values()) {
    if (client) {
      client.setSigner(signer);
    }
  }
});

// Initialization atom for setting supported networks
export const initializeSupportedNetworksAtom = atom(null, (_get, set, networks: NetworkInfo[]) => {
  set(supportedNetworksAtom, networks);
});

// Initialization atom for setting cache metadata
export const initializeCacheMetadataAtom = atom(null, (_get, set, cacheMetadata: boolean) => {
  set(cacheMetadataAtom, cacheMetadata);
});

// Write-only atom for updating client connection status
export const updateClientConnectionStatusAtom = atom(
  null,
  (get, set, networkId: NetworkId, status: ClientConnectionStatus) => {
    const currentConnections = get(networkConnectionsAtom);
    const activeNetworkIds = new Set(currentConnections.map((conn) => conn.networkId));

    if (!activeNetworkIds.has(networkId)) return;

    const statusMap = new Map(get(clientConnectionStatusMapAtom));
    statusMap.set(networkId, status);
    set(clientConnectionStatusMapAtom, statusMap);
  },
);
