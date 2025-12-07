import { useMemo } from 'react';
import { useTypink } from './useTypink.js';
import { ClientConnectionStatus, NetworkId, NetworkInfo } from '../types.js';
import { SubstrateApi } from 'dedot/chaintypes';
import { GenericSubstrateApi } from 'dedot/types';
import { assert } from 'dedot/utils';
import { DedotClient } from 'dedot';

interface UsePolkadotClient<ChainApi extends GenericSubstrateApi = SubstrateApi> {
  client?: DedotClient<ChainApi> | undefined;
  status: ClientConnectionStatus;
  network: NetworkInfo;
}
/**
 * A React hook for accessing a specific client by network ID.
 *
 * @template ChainApi - The type of the chain API, extending GenericSubstrateApi
 * @param {NetworkId} [networkId] - The network ID to get the client for. If not provided, returns the primary client.
 * @returns {DedotClient<ChainApi> | undefined} The client instance for the specified network, or undefined if not found
 */
export function usePolkadotClient<ChainApi extends GenericSubstrateApi = SubstrateApi>(
  networkId?: NetworkId,
): UsePolkadotClient<ChainApi> {
  const { getClient, networks, connectionStatus } = useTypink<ChainApi>();

  const network = useMemo(() => {
    return networkId ? networks.find((n) => n.id === networkId) : networks?.[0];
  }, [networks, networkId]);

  assert(network, `Network not found with id ${networkId}`);

  const client = useMemo(() => {
    return getClient(networkId);
  }, [getClient, networkId]);

  const status = useMemo(() => {
    return connectionStatus.get(network.id || '') || ClientConnectionStatus.NotConnected;
  }, [connectionStatus, network]);

  return { client, network, status };
}
