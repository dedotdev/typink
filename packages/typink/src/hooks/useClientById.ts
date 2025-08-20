import { useMemo } from 'react';
import { useTypink } from './useTypink.js';
import { NetworkId } from '../types.js';
import { CompatibleSubstrateApi } from '../providers/ClientProvider.js';
import { SubstrateApi } from 'dedot/chaintypes';
import { VersionedGenericSubstrateApi } from 'dedot/types';

/**
 * A React hook for accessing a specific client by network ID.
 *
 * @template ChainApi - The type of the chain API, extending VersionedGenericSubstrateApi
 * @param {NetworkId} [networkId] - The network ID to get the client for. If not provided, returns the primary client.
 * @returns {CompatibleSubstrateApi<ChainApi> | undefined} The client instance for the specified network, or undefined if not found
 */
export function useClientById<ChainApi extends VersionedGenericSubstrateApi = SubstrateApi>(
  networkId?: NetworkId,
): CompatibleSubstrateApi<ChainApi> | undefined {
  const { getClient } = useTypink<ChainApi>();

  return useMemo(() => {
    return getClient(networkId);
  }, [getClient, networkId]);
}