import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';
import { NetworkConnection, NetworkId, NetworkInfo } from '../types.js';
import { CompatibleSubstrateApi } from '../providers/ClientProvider.js';

// Persistent atom for network connection settings
export const networkConnectionAtom = atomWithStorage<NetworkConnection | null>('TYPINK::NETWORK_CONNECTION', null);

// Atom for supported networks (set during provider initialization)
export const supportedNetworksAtom = atom<NetworkInfo[]>([]);

// Atom for default network ID (set during provider initialization)
export const defaultNetworkIdAtom = atom<NetworkId | undefined>(undefined);

// Derived atom for current network ID
export const networkIdAtom = atom<NetworkId | undefined>((get) => {
  const connection = get(networkConnectionAtom);
  const defaultId = get(defaultNetworkIdAtom);
  const supportedNetworks = get(supportedNetworksAtom);

  return connection?.networkId || defaultId || supportedNetworks[0]?.id;
});

// Derived atom for selected provider
export const selectedProviderAtom = atom((get) => {
  const connection = get(networkConnectionAtom);
  return connection?.provider;
});

// Derived atom for current network info
export const currentNetworkAtom = atom<NetworkInfo | undefined>((get) => {
  const networkId = get(networkIdAtom);
  const supportedNetworks = get(supportedNetworksAtom);

  return supportedNetworks.find((network) => network.id === networkId);
});

// Atom for client instance
export const clientAtom = atom<CompatibleSubstrateApi | undefined>(undefined);

// Atom for client ready state
export const clientReadyAtom = atom(false);

// Atom for cache metadata setting
export const cacheMetadataAtom = atom(false);

// Write-only atom for updating network connection
export const setNetworkAtom = atom(null, (_get, set, connection: NetworkId | NetworkConnection) => {
  if (typeof connection === 'string') {
    // Backward compatibility: if just networkId is passed
    set(networkConnectionAtom, { networkId: connection });
  } else {
    // New format with endpoint selection
    set(networkConnectionAtom, connection);
  }
});

// Write-only atom for updating network ID (backward compatibility)
export const setNetworkIdAtom = atom(null, (_get, set, networkId: NetworkId) => {
  set(setNetworkAtom, networkId);
});
