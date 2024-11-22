import { useState } from 'react';
import { useAsync } from 'react-use';
import { useTypink } from './useTypink.js';
import { SubstrateAddress } from '../types.js';

export interface Balance {
  free: bigint;
  reserved: bigint;
  frozen: bigint;
}

export interface Balances {
  [address: SubstrateAddress]: Balance;
}

/**
 * A custom React hook that fetches and manages balances for multiple Substrate addresses.
 *
 * This hook uses the connected Substrate client to query the system accounts for the provided addresses.
 * It updates the balances state whenever the client or addresses change.
 *
 * @param addresses - An array of Substrate addresses to fetch balances for.
 * @returns An object containing the balances for each provided address. The object keys are the addresses,
 *          and the values are Balance objects containing free, reserved, and frozen amounts.
 */
export function useBalances(addresses: SubstrateAddress[]) {
  const [balances, setBalances] = useState<Balances>({});
  const { client } = useTypink();

  useAsync(async () => {
    if (!client) {
      setBalances({});

      return;
    }

    return await client.query.system.account.multi(addresses, (balances) => {
      setBalances(
        balances.reduce((balances, accountInfo, currentIndex) => {
          balances[addresses[currentIndex]] = accountInfo.data;
          return balances;
        }, {} as Balances),
      );
    });
  }, [client, addresses]);

  return balances;
}
