import { useState } from 'react';
import { useAsync, useToggle } from 'react-use';
import { JsonRpcApi, NetworkInfo } from '../../types.js';
import { DedotClient, ISubstrateClient, JsonRpcProvider, LegacyClient, WsProvider } from 'dedot';
import { SubstrateApi } from 'dedot/chaintypes';
import { RpcVersion } from 'dedot/types';
import { useDeepDeps } from './useDeepDeps.js';

export type CompatibleSubstrateClient = ISubstrateClient<SubstrateApi[RpcVersion]>;

export type UseClient = {
  ready: boolean;
  client?: CompatibleSubstrateClient;
};

export type UseClientOptions = {
  cacheMetadata: boolean;
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
export function useInitializeClient(network?: NetworkInfo, options?: UseClientOptions): UseClient {
  const { cacheMetadata = false } = options || {};

  const [ready, setReady] = useToggle(false);
  const [client, setClient] = useState<CompatibleSubstrateClient>();

  const deps = useDeepDeps([network, options]);

  useAsync(async () => {
    if (client) {
      try {
        setClient(undefined);
        // TODO check this again if the network is not available
        await client.disconnect();
      } catch (e) {
        console.error(e);
      }
    }

    if (!network) {
      setClient(undefined);
      setReady(false);
      return;
    }

    setReady(false);

    // TODO support light-client
    const provider: JsonRpcProvider = new WsProvider(network.provider);

    if (network.jsonRpcApi === JsonRpcApi.LEGACY) {
      setClient(await LegacyClient.new({ provider, cacheMetadata }));
    } else {
      setClient(await DedotClient.new({ provider, cacheMetadata }));
    }

    setReady(true);

    // TODO emit connected event or smt?
  }, deps);

  return { ready, client };
}
