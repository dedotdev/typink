import { createContext, useCallback, useContext, useEffect, useMemo } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { NetworkConnection, NetworkId, NetworkInfo, Props } from '../types.js';
import { ISubstrateClient } from 'dedot';
import { SubstrateApi } from 'dedot/chaintypes';
import { RpcVersion, VersionedGenericSubstrateApi } from 'dedot/types';
import { assert } from 'dedot/utils';
import { development } from '../networks/index.js';
import {
  cacheMetadataAtom,
  clientAtom,
  clientReadyAtom,
  clientsMapAtom,
  currentNetworkAtom,
  currentNetworksAtom,
  networkConnectionsAtom,
  setNetworkAtom,
  setNetworksAtom,
  supportedNetworksAtom,
} from '../atoms/clientAtoms.js';
import {
  cleanupAllClientsAtom,
  initializeCacheMetadataAtom,
  initializeClientsAtom,
  initializeSupportedNetworksAtom,
  updateClientSignerAtom,
} from '../atoms/clientActions.js';
import { finalEffectiveSignerAtom } from '../atoms/walletAtoms.js';

export type CompatibleSubstrateApi<ChainApi extends VersionedGenericSubstrateApi = SubstrateApi> = // --
  ISubstrateClient<ChainApi[RpcVersion]>;

export interface ClientContextProps<ChainApi extends VersionedGenericSubstrateApi = SubstrateApi> {
  ready: boolean; // aggregated ready state when all clients are connected
  client?: CompatibleSubstrateApi<ChainApi>; // primary client instance

  network: NetworkInfo; // primary network info
  networkConnection: NetworkConnection; // primary network connection details
  networks: NetworkInfo[]; // list of all network infos (primary first)
  networkConnections: NetworkConnection[]; // list of all network connections (primary first)

  setNetwork: (connection: NetworkId | NetworkConnection) => void; // set primary connection
  setNetworks: (networks: (NetworkId | NetworkConnection)[]) => void; // set all network connections (primary first)

  clients: Map<NetworkId, CompatibleSubstrateApi<ChainApi> | undefined>; // client instance per network id

  getClient: (networkId?: NetworkId) => CompatibleSubstrateApi<ChainApi> | undefined;
  supportedNetworks: NetworkInfo[];
  cacheMetadata?: boolean;
}

export const ClientContext = createContext<ClientContextProps<any>>({} as any);

export function useClient<
  ChainApi extends VersionedGenericSubstrateApi = SubstrateApi,
>(): ClientContextProps<ChainApi> {
  return useContext(ClientContext) as ClientContextProps<ChainApi>;
}

export interface ClientProviderProps extends Props {
  supportedNetworks?: NetworkInfo[];
  defaultNetworkIds?: (NetworkId | NetworkConnection)[]; // default networks to use if no stored connections exist (first is primary, rest are secondary)
  defaultNetworkId?: NetworkId | NetworkConnection; // fallback if defaultNetworkIds is not provided
  cacheMetadata?: boolean; // default to false
}

const DEFAULT_NETWORKS = [development];

/**
 * Manages the initialization and state of the Dedot client, network selection, and related configurations.
 *
 * @param {Object} props - The properties passed to the ClientProvider component.
 * @param {React.ReactNode} props.children - The child components to be wrapped by the ClientProvider.
 * @param {(NetworkId | NetworkConnection)[]} [props.defaultNetworkIds] - Default list of networks to use when no stored connections exist (first is primary, rest are secondary).
 * @param {NetworkId | NetworkConnection} [props.defaultNetworkId] - Fallback network if defaultNetworkIds is not provided. Converted to defaultNetworkIds=[defaultNetworkId] internally.
 * @param {NetworkInfo[]} [props.supportedNetworks=DEFAULT_NETWORKS] - An array of supported network information objects.
 * @param {boolean} [props.cacheMetadata=false] - Whether to cache metadata or not.
 */
export function ClientProvider({
  children,
  defaultNetworkIds,
  defaultNetworkId,
  supportedNetworks = DEFAULT_NETWORKS,
  cacheMetadata = false,
}: ClientProviderProps) {
  assert(supportedNetworks.length > 0, 'Required at least one supported network');

  // Convert input to NetworkConnection[] format with priority: defaultNetworkIds > defaultNetworkId
  const initialConnections = useMemo(() => {
    const connections: NetworkConnection[] = [];

    // Priority 1: Use defaultNetworkIds if provided
    if (defaultNetworkIds && defaultNetworkIds.length > 0) {
      for (const item of defaultNetworkIds) {
        if (typeof item === 'string') {
          connections.push({ networkId: item });
        } else {
          connections.push(item);
        }
      }
    }
    // Priority 2: Convert defaultNetworkId to defaultNetworkIds=[defaultNetworkId] if provided
    else if (defaultNetworkId) {
      if (typeof defaultNetworkId === 'string') {
        connections.push({ networkId: defaultNetworkId });
      } else {
        connections.push(defaultNetworkId);
      }
    }
    // Priority 3: Default to first supported network
    else {
      connections.push({ networkId: supportedNetworks[0].id });
    }

    return connections;
  }, [defaultNetworkIds, defaultNetworkId, supportedNetworks]);

  // Validate all network IDs
  for (const connection of initialConnections) {
    assert(
      supportedNetworks.some((n) => n.id === connection.networkId),
      `Network ID '${connection.networkId}' not found in supported networks`,
    );
  }

  // Initialize atoms
  const initializeSupportedNetworks = useSetAtom(initializeSupportedNetworksAtom);
  const initializeCacheMetadata = useSetAtom(initializeCacheMetadataAtom);
  const initializeClients = useSetAtom(initializeClientsAtom);
  const updateClientSigner = useSetAtom(updateClientSignerAtom);
  const cleanupAllClients = useSetAtom(cleanupAllClientsAtom);

  // Initialize configuration immediately (synchronous)
  useMemo(() => {
    initializeSupportedNetworks(supportedNetworks);
    initializeCacheMetadata(cacheMetadata);
  }, [supportedNetworks, cacheMetadata, initializeSupportedNetworks, initializeCacheMetadata]);

  // Use atoms for state
  const client = useAtomValue(clientAtom);
  const ready = useAtomValue(clientReadyAtom);
  const clients = useAtomValue(clientsMapAtom);
  const network = useAtomValue(currentNetworkAtom);
  const networks = useAtomValue(currentNetworksAtom);
  const allSupportedNetworks = useAtomValue(supportedNetworksAtom);
  const cacheMeta = useAtomValue(cacheMetadataAtom);
  const finalEffectiveSigner = useAtomValue(finalEffectiveSignerAtom);

  // Use atom actions
  const setNetwork = useSetAtom(setNetworkAtom);
  const setNetworks = useSetAtom(setNetworksAtom);

  // Get network connections from localStorage (via atomWithStorage)
  const [networkConnections, setNetworkConnections] = useAtom(networkConnectionsAtom);

  // Initialize network connections and default network ID properly
  useEffect(() => {
    if (supportedNetworks.length === 0) return;

    // Check if we have stored connections from localStorage
    if (networkConnections.length === 0 && initialConnections.length > 0) {
      setNetworkConnections(initialConnections);
    }
  }, []); // Empty deps - only runs once on mount

  // Initialize all clients when network connections change
  useEffect(() => {
    if (networkConnections.length > 0) {
      initializeClients().catch((e) => {
        console.error('Failed to initialize clients:', e);
      });
    }
  }, [networkConnections, initializeClients]);

  // Update client signer when clients are ready or signer changes
  useEffect(() => {
    if (clients.size > 0) {
      updateClientSigner();
    }
  }, [clients, finalEffectiveSigner, updateClientSigner]);

  // Cleanup all clients on unmount
  useEffect(() => {
    return () => {
      // Only cleanup on unmount, not on every render
      cleanupAllClients().catch((e) => {
        console.error('Error cleaning up clients:', e);
      });
    };
  }, []); // Empty dependency array - only run on mount/unmount

  // Helper function to get a specific client
  const getClient = useCallback(
    (networkId?: NetworkId) => {
      if (!networkId) return client;
      return clients.get(networkId);
    },
    [client, clients],
  );

  return (
    <ClientContext.Provider
      key={`${networkConnections.map((c) => c.networkId).join(',')}`}
      value={{
        ready,
        client,
        clients,
        getClient,
        network,
        networkConnection: networkConnections[0],
        networks,
        networkConnections,
        setNetwork,
        setNetworks,
        cacheMetadata: cacheMeta,
        supportedNetworks: allSupportedNetworks,
      }}>
      {children}
    </ClientContext.Provider>
  );
}
