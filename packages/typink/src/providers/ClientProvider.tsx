import { createContext, useContext, useEffect, useMemo } from 'react';
import { useInitializeClient } from '../hooks/internal/index.js';
import { NetworkId, NetworkInfo, Props } from '../types.js';
import { ISubstrateClient } from 'dedot';
import { SubstrateApi } from 'dedot/chaintypes';
import { RpcVersion, VersionedGenericSubstrateApi } from 'dedot/types';
import { assert } from 'dedot/utils';
import { development } from '../networks/index.js';
import { useWallet } from './WalletProvider.js';
import { useLocalStorage } from 'react-use';

export type CompatibleSubstrateApi<ChainApi extends VersionedGenericSubstrateApi = SubstrateApi> = ISubstrateClient<ChainApi[RpcVersion]>;

export interface ClientContextProps<ChainApi extends VersionedGenericSubstrateApi = SubstrateApi> {
  client?: CompatibleSubstrateApi<ChainApi>;
  ready: boolean;
  supportedNetworks: NetworkInfo[];
  network: NetworkInfo;
  networkId: NetworkId;
  setNetworkId: (one: NetworkId) => void;
  cacheMetadata?: boolean;
}

export const ClientContext = createContext<ClientContextProps<any>>({} as any);

export function useClient<ChainApi extends VersionedGenericSubstrateApi = SubstrateApi>(): ClientContextProps<ChainApi> {
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

  const { signer } = useWallet();

  const initialNetworkId = useMemo<NetworkId>(() => {
    return (defaultNetworkId || supportedNetworks[0].id) as NetworkId;
  }, [defaultNetworkId, supportedNetworks]);

  const [networkId, setNetworkId] = useLocalStorage<NetworkId>('TYPINK::CONNECTED_NETWORK', initialNetworkId);

  const network = useMemo(
    () => supportedNetworks.find((network) => network.id === networkId),
    [networkId, supportedNetworks],
  );

  assert(network, `NetworkId ${initialNetworkId} is not available`);

  const { ready, client } = useInitializeClient(network, { cacheMetadata });

  useEffect(() => {
    client?.setSigner(signer);
  }, [signer, client]);

  return (
    <ClientContext.Provider
      key={networkId!}
      value={{
        client,
        ready,
        network,
        networkId: networkId!,
        setNetworkId,
        cacheMetadata,
        supportedNetworks,
      }}>
      {children}
    </ClientContext.Provider>
  );
}
