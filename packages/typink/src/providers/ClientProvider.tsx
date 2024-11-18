import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useInitializeClient } from '../hooks/internal/index.js';
import { useWalletContext } from './WalletProvider.js';
import { NetworkInfo, Props } from '../types.js';
import { ISubstrateClient } from 'dedot';
import { SubstrateApi } from 'dedot/chaintypes';
import { RpcVersion } from 'dedot/types';
import { assert } from 'dedot/utils';
import { development, NetworkId } from '../networks/index.js';

export interface ClientContextProps extends Props {
  client?: ISubstrateClient<SubstrateApi[RpcVersion]>;
  ready: boolean;
  supportedNetworks: NetworkInfo[];
  network: NetworkInfo;
  networkId: NetworkId;
  setNetworkId: (one: NetworkId) => void;
  cacheMetadata?: boolean;
}

export const ClientContext = createContext<ClientContextProps>({} as any);

export const useClientContext = () => {
  return useContext(ClientContext);
};

export interface ClientProviderProps extends Props {
  supportedNetworks?: NetworkInfo[];
  defaultNetworkId?: NetworkId; // default to the first network in supported list
  cacheMetadata?: boolean; // default to false
}

const DEFAULT_NETWORKS = [development];

export function ClientProvider({
  children,
  defaultNetworkId,
  supportedNetworks = DEFAULT_NETWORKS,
  cacheMetadata = false,
}: ClientProviderProps) {
  assert(supportedNetworks.length > 0, 'Required at least one supported network');

  const { injectedApi } = useWalletContext();

  const initialNetworkId = useMemo<NetworkId>(() => {
    return (defaultNetworkId || supportedNetworks[0].id) as NetworkId;
  }, [defaultNetworkId, supportedNetworks]);

  const [networkId, setNetworkId] = useState<NetworkId>(initialNetworkId);

  const network = useMemo(
    () => supportedNetworks.find((network) => network.id === networkId),
    [networkId, supportedNetworks],
  );

  assert(network, `NetworkId ${initialNetworkId} is not available`);

  // TODO supports multi clients & lazy initialization
  const { ready, client } = useInitializeClient(network, { cacheMetadata });

  useEffect(() => {
    client?.setSigner(injectedApi?.signer);
  }, [injectedApi, client]);

  return (
    <ClientContext.Provider
      key={networkId}
      value={{
        client,
        ready,
        network,
        networkId: networkId as NetworkId,
        setNetworkId,
        cacheMetadata,
        supportedNetworks,
      }}>
      {children}
    </ClientContext.Provider>
  );
}
