import { useMemo } from 'react';
import { Balance, useBalances } from './useBalances.js';
import { NetworkOptions, SubstrateAddress } from '../types.js';

/**
 * A custom React hook that retrieves the balance for a given Substrate address.
 * 
 * This hook uses the `useBalances` hook internally to fetch the balance information.
 * If no address is provided, it returns undefined.
 *
 * @param {SubstrateAddress} [address] - The Substrate address to fetch the balance for.
 *                                       If not provided, the hook will return undefined.
 * @param {NetworkOptions} [options] - Optional network selection options.
 * 
 * @returns {Balance | undefined} The balance information for the given address, or undefined
 *                                if no address was provided or if the balance couldn't be fetched.
 */
export function useBalance(address?: SubstrateAddress, options?: NetworkOptions): Balance | undefined {
  const addresses = useMemo(() => (address ? [address] : []), [address]);
  const balances = useBalances(addresses, options);

  if (addresses.length === 0) return undefined;

  return balances[addresses[0]];
}
