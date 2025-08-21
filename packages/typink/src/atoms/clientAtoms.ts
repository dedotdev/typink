import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { NetworkConnection, NetworkId, NetworkInfo } from '../types.js';
import { CompatibleSubstrateApi } from '../providers/ClientProvider.js';

// Persistent atom for all network connections (primary first, then secondary)
export const networkConnectionsAtom = atomWithStorage<NetworkConnection[]>(
  'TYPINK::NETWORK_CONNECTIONS',
  [],
  undefined,
  { getOnInit: true },
);

// Atom to track if network connections have been initialized from localStorage
export const networkConnectionsInitializedAtom = atom<boolean>(false);

// Atom for supported networks (set during provider initialization)
export const supportedNetworksAtom = atom<NetworkInfo[]>([]);

// Derived atom for current primary network info
export const currentNetworkAtom = atom<NetworkInfo>((get) => {
  const connections = get(networkConnectionsAtom);
  const supportedNetworks = get(supportedNetworksAtom);

  if (supportedNetworks.length === 0) {
    throw new Error('No supported networks available. Please provide at least one network in supportedNetworks.');
  }

  // Get primary network ID from connections or fallback
  const networkId = connections.length > 0 ? connections[0].networkId : supportedNetworks[0].id;

  const network = supportedNetworks.find((network) => network.id === networkId);
  if (!network) {
    const fallback = supportedNetworks[0];
    console.error(`Network with ID '${networkId}' not found in supported networks, fallback to ${fallback.id}`);
    return fallback;
  }

  return network;
});

// Derived atom for all network infos (primary + secondary)
export const networksAtom = atom<NetworkInfo[]>((get) => {
  const connections = get(networkConnectionsAtom);
  const supportedNetworks = get(supportedNetworksAtom);

  const networks: NetworkInfo[] = [];

  for (const connection of connections) {
    const network = supportedNetworks.find((n) => n.id === connection.networkId);
    if (network) {
      networks.push(network);
    } else {
      console.error(`Network with ID '${connection.networkId}' not found in supported networks`);
    }
  }

  // If no networks configured, return at least the first supported network
  if (networks.length === 0 && supportedNetworks.length > 0) {
    networks.push(supportedNetworks[0]);
  }

  return networks;
});

// Atom for all clients map (primary + secondary)
export const clientsMapAtom = atom<Map<NetworkId, CompatibleSubstrateApi>>(new Map());

// Atom for primary client instance (backward compatibility)
export const clientAtom = atom<CompatibleSubstrateApi | undefined>((get) => {
  const connections = get(networkConnectionsAtom);
  const supportedNetworks = get(supportedNetworksAtom);
  const clientsMap = get(clientsMapAtom);

  if (supportedNetworks.length === 0) {
    return undefined;
  }

  // Get primary network ID from connections or fallback
  const networkId = connections.length > 0 ? connections[0].networkId : supportedNetworks[0].id;
  return clientsMap.get(networkId);
});

// Atom for overall ready state - true only when ALL networks have clients
export const clientReadyAtom = atom<boolean>((get) => {
  const connections = get(networkConnectionsAtom);
  const clients = get(clientsMapAtom);

  // Get all network IDs from connections
  const allNetworkIds = connections.map((conn) => conn.networkId);

  // If no networks configured, not ready
  if (allNetworkIds.length === 0) {
    return false;
  }

  // Check if ALL networks have clients
  for (const networkId of allNetworkIds) {
    if (!clients.has(networkId)) {
      return false; // At least one network doesn't have a client
    }
  }

  // All networks have clients
  return true;
});

// Atom for cache metadata setting
export const cacheMetadataAtom = atom(false);

// Write-only atom for updating primary network connection (backward compatibility)
export const setNetworkAtom = atom(null, (get, set, connection: NetworkId | NetworkConnection) => {
  const currentConnections = get(networkConnectionsAtom);
  const newPrimaryConnection = typeof connection === 'string' ? { networkId: connection } : connection;

  // Update only the primary (first) connection, keep the rest
  const newConnections = [newPrimaryConnection, ...currentConnections.slice(1)];
  set(networkConnectionsAtom, newConnections);
});

// Write-only atom for updating all network connections at once
export const setNetworksAtom = atom(null, (_get, set, networks: (NetworkId | NetworkConnection)[]) => {
  const connections: NetworkConnection[] = [];

  for (const network of networks) {
    if (typeof network === 'string') {
      // NetworkId case - use default connection
      connections.push({ networkId: network });
    } else {
      // NetworkConnection case - use provided connection
      connections.push(network);
    }
  }

  // Update all connections (primary is first, rest are secondary)
  set(networkConnectionsAtom, connections);
});

// Initialization atom for setting network IDs from provider props
export const initializeNetworkIdsAtom = atom(null, (_get, set, networkIds: NetworkId[]) => {
  // Initialize default connections for the network IDs
  const defaultConnections: NetworkConnection[] = [];
  for (const networkId of networkIds) {
    defaultConnections.push({ networkId });
  }
  set(networkConnectionsAtom, defaultConnections);
});
