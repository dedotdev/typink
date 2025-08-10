import { useState } from 'react';
import { useAsync, useToggle } from 'react-use';
import { JsonRpcApi, NetworkInfo } from '../../types.js';
import { DedotClient, ISubstrateClient, JsonRpcProvider, LegacyClient, WsProvider, SmoldotProvider } from 'dedot';
import { SubstrateApi } from 'dedot/chaintypes';
import { RpcVersion } from 'dedot/types';
import { useDeepDeps } from './useDeepDeps.js';
import { startWithWorker } from 'dedot/smoldot/with-worker';
// @ts-ignore
import SmoldotWorker from 'dedot/smoldot/worker?worker';
import { type Chain, type Client } from 'smoldot';

export type CompatibleSubstrateClient = ISubstrateClient<SubstrateApi[RpcVersion]>;

export type UseClient = {
  ready: boolean;
  client?: CompatibleSubstrateClient;
};

export type UseClientOptions = {
  cacheMetadata: boolean;
  selectedProvider?: string;
};

/**
 * A custom React hook that initializes and manages a Dedot client connection.
 *
 * This hook handles the creation, connection, and disconnection of a Dedot client
 * based on the provided network information. It supports both legacy and new
 * JSON-RPC APIs.
 *
 * @param network - Optional. The network information used to establish the connection.
 *                  If not provided, the client will be reset to undefined.
 * @param options - Optional. Configuration options for the client initialization.
 * @param options.cacheMetadata - Whether to cache metadata. Defaults to false.
 *
 * @returns An object containing:
 *          - ready: A boolean indicating whether the client is ready for use.
 *          - client: The initialized Substrate client, or undefined if not ready.
 */
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

export function useInitializeClient(network?: NetworkInfo, options?: UseClientOptions): UseClient {
  const { cacheMetadata = false, selectedProvider } = options || {};

  const [ready, setReady] = useToggle(false);
  const [client, setClient] = useState<CompatibleSubstrateClient>();

  const deps = useDeepDeps([network, options]);

  useAsync(async () => {
    if (client) {
      try {
        // TODO check this again if the network is not available
        await client.disconnect();

        // Clean up smoldot chain if we were using light client
        // Note: We keep relay chains cached for reuse
        if (selectedProvider === 'light-client' && network?.id) {
          await removeSmoldotChain(network.id);
        }
      } catch (e) {
        console.error(e);
      }

      setClient(undefined);
    }

    if (!network) {
      setClient(undefined);
      setReady(false);
      return;
    }

    setReady(false);

    // Determine which provider(s) to use
    let provider: JsonRpcProvider;

    if (selectedProvider === 'light-client') {
      if (!network.chainSpec) {
        throw new TypeError('Network does not support light client - missing chainSpec');
      } else {
        const chain = await getOrCreateSmoldotChain(network);
        provider = new SmoldotProvider(chain);
      }
    } else if (selectedProvider === 'random-rpc' || !selectedProvider) {
      provider = new WsProvider(network.providers);
    } else {
      provider = new WsProvider(selectedProvider);
    }

    if (network.jsonRpcApi === JsonRpcApi.LEGACY) {
      setClient(await LegacyClient.new({ provider, cacheMetadata }));
    } else {
      setClient(await DedotClient.new({ provider, cacheMetadata }));
    }

    setReady(true);
  }, deps);

  return { ready, client };
}
