import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { ClientConnectionStatus, NetworkConnection, NetworkId, NetworkInfo } from '../types.js';
import { CompatibleSubstrateApi } from '../providers/ClientProvider.js';

// Persistent atom for all network connections (primary first, then secondary)
export const networkConnectionsAtom = atomWithStorage<NetworkConnection[]>(
  'TYPINK::NETWORK_CONNECTIONS',
  [],
  undefined,
  { getOnInit: true },
);

// Persistent atom for storing the intended default network IDs as JSON string to detect changes
export const persistedDefaultNetworkIdsAtom = atomWithStorage<string>(
  'TYPINK::DEFAULT_NETWORK_IDS',
  '',
  undefined,
  { getOnInit: true },
);

// Atom for supported networks (set during provider initialization)
export const supportedNetworksAtom = atom<NetworkInfo[]>([]);

// Derived atom for all network infos (primary + secondary)
export const currentNetworksAtom = atom<NetworkInfo[]>((get) => {
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

// Derived atom for current primary network info
export const currentNetworkAtom = atom<NetworkInfo>((get) => {
  const currentNetworks = get(currentNetworksAtom);
  return currentNetworks[0];
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
  
  // Reuse setNetworksAtom logic to handle connection status management
  set(setNetworksAtom, newConnections);
});

// Write-only atom for updating all network connections at once
export const setNetworksAtom = atom(null, (get, set, networks: (NetworkId | NetworkConnection)[]) => {
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

  // Clear connection status for networks that are no longer in the new connections
  const currentStatusMap = get(clientConnectionStatusMapAtom);
  const newStatusMap = new Map<NetworkId, ClientConnectionStatus>();
  const newNetworkIds = new Set(connections.map(conn => conn.networkId));
  
  // Keep status for networks that are still active, remove others
  for (const [networkId, status] of currentStatusMap.entries()) {
    if (newNetworkIds.has(networkId)) {
      newStatusMap.set(networkId, status);
    }
  }
  
  // Initialize new networks with NotConnected status
  for (const conn of connections) {
    if (!newStatusMap.has(conn.networkId)) {
      newStatusMap.set(conn.networkId, ClientConnectionStatus.NotConnected);
    }
  }
  
  set(clientConnectionStatusMapAtom, newStatusMap);
  // Update all connections (primary is first, rest are secondary)
  set(networkConnectionsAtom, connections);
});

// Atom for tracking connection status of each client
export const clientConnectionStatusMapAtom = atom<Map<NetworkId, ClientConnectionStatus>>(new Map());
