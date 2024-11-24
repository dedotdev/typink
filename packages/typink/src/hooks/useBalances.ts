import { useEffect, useState } from 'react';
import { useTypink } from './useTypink.js';
import { SubstrateAddress } from '../types.js';
import { Unsub } from 'dedot/types';

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

  // TODO filter out invalid addresses

  useEffect(() => {
    if (!client || addresses.length === 0) {
      setBalances({});

      return;
    }

    let done = false;
    let unsub: Unsub;

    client.query.system.account
      .multi(addresses, (balances) => {
        setBalances(
          balances.reduce((balances, accountInfo, currentIndex) => {
            balances[addresses[currentIndex]] = accountInfo.data;
            return balances;
          }, {} as Balances),
        );
      })
      .then((x) => {
        if (done) {
          x().catch(console.error);
        } else {
          unsub = x;
        }
      })
      .catch(console.error); // TODO should show exception for the wrapper component to handle

    return () => {
      done = true;
      unsub && unsub();
    };
  }, [client, addresses]);

  return balances;
}
