import { atom } from 'jotai';
import {
  clientAtom,
  clientReadyAtom,
  currentNetworkAtom,
  selectedProviderAtom,
  cacheMetadataAtom,
  supportedNetworksAtom,
  defaultNetworkIdAtom,
} from './clientAtoms.js';
import { primarySignerAtom } from './walletAtoms.js';
import { JsonRpcApi, NetworkInfo, validateProvider } from '../types.js';
import { DedotClient, ISubstrateClient, JsonRpcProvider, LegacyClient, WsProvider, SmoldotProvider } from 'dedot';
import { startWithWorker } from 'dedot/smoldot/with-worker';
// @ts-ignore
import SmoldotWorker from 'dedot/smoldot/worker?worker';
import { type Chain, type Client } from 'smoldot';

// Global smoldot instances
let smoldotClient: Client | null = null;
let smoldotChains: Map<string, Chain> = new Map();
let relayChains: Map<string, Chain> = new Map();

/**
 * Shared method to get or create a smoldot chain with relay chain support
 */
async function getOrCreateSmoldotChain(network: NetworkInfo): Promise<Chain> {
  // Check if chain already exists
  const existingChain = smoldotChains.get(network.id);
  if (existingChain) return existingChain;

  // Initialize smoldot client with Web Worker if needed
  if (!smoldotClient) {
    smoldotClient = startWithWorker(new SmoldotWorker());
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

// Write-only atom for initializing/updating the client
export const initializeClientAtom = atom(
  null,
  async (get, set) => {
    const network = get(currentNetworkAtom);
    const selectedProvider = validateProvider(get(selectedProviderAtom));
    const cacheMetadata = get(cacheMetadataAtom);
    const signer = get(primarySignerAtom);
    
    // Clean up existing client
    const existingClient = get(clientAtom);
    if (existingClient) {
      try {
        await existingClient.disconnect();
        
        // Clean up smoldot chain if we were using light client
        if (selectedProvider === 'light-client' && network?.id) {
          await removeSmoldotChain(network.id);
        }
      } catch (e) {
        console.error('Error disconnecting client:', e);
      }
    }
    
    if (!network) {
      set(clientAtom, undefined);
      set(clientReadyAtom, false);
      return;
    }
    
    set(clientReadyAtom, false);
    
    try {
      // Determine which provider to use
      let provider: JsonRpcProvider;
      
      if (selectedProvider === 'light-client') {
        if (!network.chainSpec) {
          throw new TypeError('Network does not support light client - missing chainSpec');
        }
        const chain = await getOrCreateSmoldotChain(network);
        provider = new SmoldotProvider(chain);
      } else if (selectedProvider === 'random-rpc' || !selectedProvider) {
        provider = new WsProvider(network.providers);
      } else {
        provider = new WsProvider(selectedProvider);
      }
      
      // Create client based on API type
      let client: ISubstrateClient<any>;
      if (network.jsonRpcApi === JsonRpcApi.LEGACY) {
        client = await LegacyClient.new({ provider, cacheMetadata });
      } else {
        client = await DedotClient.new({ provider, cacheMetadata });
      }
      
      // Set signer if available
      if (signer) {
        client.setSigner(signer);
      }
      
      set(clientAtom, client);
      set(clientReadyAtom, true);
    } catch (e) {
      console.error('Error initializing client:', e);
      set(clientAtom, undefined);
      set(clientReadyAtom, false);
      throw e;
    }
  }
);

// Write-only atom for updating signer on client
export const updateClientSignerAtom = atom(
  null,
  (get, set) => {
    const client = get(clientAtom);
    const signer = get(primarySignerAtom);
    
    if (client) {
      client.setSigner(signer);
    }
  }
);

// Initialization atom for setting supported networks
export const initializeSupportedNetworksAtom = atom(
  null,
  (_get, set, networks: NetworkInfo[]) => {
    set(supportedNetworksAtom, networks);
  }
);

// Initialization atom for setting default network ID
export const initializeDefaultNetworkIdAtom = atom(
  null,
  (_get, set, networkId: string | undefined) => {
    set(defaultNetworkIdAtom, networkId);
  }
);

// Initialization atom for setting cache metadata
export const initializeCacheMetadataAtom = atom(
  null,
  (_get, set, cacheMetadata: boolean) => {
    set(cacheMetadataAtom, cacheMetadata);
  }
);