import { createContext, useContext, useEffect, useMemo } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { NetworkConnection, NetworkId, NetworkInfo, Props, validateProvider } from '../types.js';
import { ISubstrateClient } from 'dedot';
import { SubstrateApi } from 'dedot/chaintypes';
import { RpcVersion, VersionedGenericSubstrateApi } from 'dedot/types';
import { assert } from 'dedot/utils';
import { development } from '../networks/index.js';
import {
  cacheMetadataAtom,
  clientAtom,
  clientReadyAtom,
  currentNetworkAtom,
  networkConnectionAtom,
  networkIdAtom,
  selectedProviderAtom,
  setNetworkAtom,
  setNetworkIdAtom,
  supportedNetworksAtom,
} from '../atoms/clientAtoms.js';
import {
  initializeCacheMetadataAtom,
  initializeClientAtom,
  initializeDefaultNetworkIdAtom,
  initializeSupportedNetworksAtom,
  updateClientSignerAtom,
} from '../atoms/clientActions.js';
import { finalEffectiveSignerAtom } from '../atoms/walletAtoms.js';

export type CompatibleSubstrateApi<ChainApi extends VersionedGenericSubstrateApi = SubstrateApi> = // --
  ISubstrateClient<ChainApi[RpcVersion]>;

export interface ClientContextProps<ChainApi extends VersionedGenericSubstrateApi = SubstrateApi> {
  client?: CompatibleSubstrateApi<ChainApi>;
  ready: boolean;
  supportedNetworks: NetworkInfo[];
  network: NetworkInfo;
  networkId: NetworkId;
  selectedProvider?: string;
  setNetworkId: (connection: NetworkId) => void;
  setNetwork: (connection: NetworkId | NetworkConnection) => void;
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
  defaultNetworkId?: NetworkId; // default to the first network in supported list
  cacheMetadata?: boolean; // default to false
}

const DEFAULT_NETWORKS = [development];

/**
 * Manages the initialization and state of the Dedot client, network selection, and related configurations.
 *
 * @param {Object} props - The properties passed to the ClientProvider component.
 * @param {React.ReactNode} props.children - The child components to be wrapped by the ClientProvider.
 * @param {NetworkId} [props.defaultNetworkId] - The default network ID to use. If not provided, the first network in the supported networks list is used.
 * @param {NetworkInfo[]} [props.supportedNetworks=DEFAULT_NETWORKS] - An array of supported network information objects.
 * @param {boolean} [props.cacheMetadata=false] - Whether to cache metadata or not.
 */
export function ClientProvider({
  children,
  defaultNetworkId,
  supportedNetworks = DEFAULT_NETWORKS,
  cacheMetadata = false,
}: ClientProviderProps) {
  assert(supportedNetworks.length > 0, 'Required at least one supported network');

  // Initialize atoms
  const initializeSupportedNetworks = useSetAtom(initializeSupportedNetworksAtom);
  const initializeDefaultNetworkId = useSetAtom(initializeDefaultNetworkIdAtom);
  const initializeCacheMetadata = useSetAtom(initializeCacheMetadataAtom);
  const initializeClient = useSetAtom(initializeClientAtom);
  const updateClientSigner = useSetAtom(updateClientSignerAtom);

  // Initialize configuration immediately (synchronous)
  useMemo(() => {
    initializeSupportedNetworks(supportedNetworks);
    initializeDefaultNetworkId(defaultNetworkId);
    initializeCacheMetadata(cacheMetadata);
  }, [
    supportedNetworks,
    defaultNetworkId,
    cacheMetadata,
    initializeSupportedNetworks,
    initializeDefaultNetworkId,
    initializeCacheMetadata,
  ]);

  // Use atoms for state
  const client = useAtomValue(clientAtom);
  const ready = useAtomValue(clientReadyAtom);
  const networkId = useAtomValue(networkIdAtom);
  const selectedProvider = useAtomValue(selectedProviderAtom);
  const network = useAtomValue(currentNetworkAtom);
  const allSupportedNetworks = useAtomValue(supportedNetworksAtom);
  const cacheMeta = useAtomValue(cacheMetadataAtom);
  const finalEffectiveSigner = useAtomValue(finalEffectiveSignerAtom);

  // Use atom actions
  const setNetwork = useSetAtom(setNetworkAtom);
  const setNetworkId = useSetAtom(setNetworkIdAtom);

  // Initialize network connection on first mount from localStorage
  const [networkConnection, setNetworkConnection] = useAtom(networkConnectionAtom);

  // Initialize network connection synchronously if not set or invalid
  useMemo(() => {
    if (supportedNetworks.length === 0) return;

    // Check if stored network connection is valid
    const storedNetworkId = networkConnection?.networkId;
    const isStoredNetworkValid = storedNetworkId && supportedNetworks.some((network) => network.id === storedNetworkId);

    // Only set network connection if no valid stored connection exists
    if (!networkConnection || !isStoredNetworkValid) {
      const initialNetworkId = defaultNetworkId || supportedNetworks[0].id;
      console.log('initialNetworkId', initialNetworkId);
      setNetworkConnection({ networkId: initialNetworkId });
    }
  }, [networkConnection, defaultNetworkId, supportedNetworks, setNetworkConnection]);

  // Network and networkId are now guaranteed to be initialized by atoms

  // Initialize client when network or provider changes
  useEffect(() => {
    initializeClient().catch((e) => {
      console.error('Failed to initialize client:', e);
    });
  }, [networkId, selectedProvider, initializeClient]);

  // Update client signer when client is ready or signer changes
  useEffect(() => {
    if (client && ready) {
      updateClientSigner();
    }
  }, [client, ready, finalEffectiveSigner, updateClientSigner]);

  return (
    <ClientContext.Provider
      key={`${networkId}-${selectedProvider || 'default'}`}
      value={{
        client,
        ready,
        network,
        networkId,
        selectedProvider: validateProvider(selectedProvider),
        setNetworkId,
        setNetwork,
        cacheMetadata: cacheMeta,
        supportedNetworks: allSupportedNetworks,
      }}>
      {children}
    </ClientContext.Provider>
  );
}
