import { useRawContract } from '../useRawContract.js';
import { Psp22ContractApi } from './contracts/psp22';
import { useContractQuery } from '../useContractQuery.js';
import { useTypink } from '../useTypink.js';
import { useWatchContractEvent } from '../useWatchContractEvent.js';
import { useCallback, useEffect, useState } from 'react';
import { SubstrateAddress } from '../../types.js';

/**
 * A custom React hook that retrieves and optionally watches the PSP22 token balance for a given address.
 *
 * This hook fetches the balance of PSP22 tokens for a specified address from a given contract.
 * It can also watch for Transfer events and automatically refresh the balance when relevant transfers occur.
 *
 * @param parameters - An object containing the parameters for the hook.
 * @param parameters.contractAddress - The address of the PSP22 token contract.
 * @param parameters.address - The address for which to check the balance. Defaults to the connected account's address or the default caller.
 * @param parameters.watch - A boolean indicating whether to watch for Transfer events. Defaults to false.
 *
 * @returns A result object from useContractQuery, containing the balance and related query information.
 */
export function usePSP22Balance(parameters: {
  contractAddress?: SubstrateAddress;
  address?: SubstrateAddress;
  watch?: boolean;
}) {
  const { connectedAccount } = useTypink();
  const [psp22Metadata, setPsp22Metadata] = useState<any>();
  const { contractAddress, address, watch = false } = parameters;

  const addressToCheck = address || connectedAccount?.address || '';

  // make sure we only start loading balance if both contractAddress & addressToCheck is available
  const contractAddressToCheck = contractAddress && addressToCheck ? contractAddress : undefined;

  const { contract } = useRawContract<Psp22ContractApi>(psp22Metadata as any, contractAddressToCheck);

  useEffect(() => {
    let mounted = true;

    // @ts-ignore
    import('./contracts/psp22.json')
      .then((metadata) => {
        if (mounted) {
          setPsp22Metadata(metadata);
        }
      })
      .catch(console.error);

    return () => {
      mounted = false;
    };
  }, []);

  const result = useContractQuery({
    contract,
    fn: 'psp22BalanceOf',
    args: [addressToCheck],
  });

  useWatchContractEvent(
    contract,
    'Transfer',
    useCallback(
      (events) => {
        if (!watch || events.length === 0 || !addressToCheck) return;

        if (events.some(({ data: { from, to } }) => from?.eq(addressToCheck) || to?.eq(addressToCheck))) {
          result.refresh();
        }
      },
      [watch, addressToCheck],
    ),
    watch,
  );

  return result;
}
