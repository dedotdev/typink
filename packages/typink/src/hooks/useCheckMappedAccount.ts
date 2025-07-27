import { useEffect, useState } from 'react';
import { useTypink } from './useTypink.js';
import { toEvmAddress } from 'dedot/contracts';
import { SubstrateAddress } from '../types.js';
import { ISubstrateClient } from 'dedot';

export interface UseCheckMappedAccountResult {
  isMapped: boolean | undefined;
  isLoading: boolean;
  error: Error | undefined;
  evmAddress: string | undefined;
}

/**
 * Check if the revive pallet is available on the current network
 */
function isReviveAvailable(client: ISubstrateClient<any>): boolean {
  try {
    return typeof client.query.revive.originalAccount === 'function';
  } catch {
    return false;
  }
}

/**
 * Hook to check if a Substrate account is mapped to an EVM address for ink! v6 contracts
 * deployed on pallet revive.
 *
 * @param address - The Substrate address to check (defaults to connected account)
 * @param enabled - Whether to enable the check (defaults to true)
 * @returns Object containing mapping status, loading state, error, and EVM address
 */
export function useCheckMappedAccount(
  address?: SubstrateAddress,
  enabled: boolean = true,
): UseCheckMappedAccountResult {
  const { client, connectedAccount } = useTypink();
  const [isMapped, setIsMapped] = useState<boolean>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const [evmAddress, setEvmAddress] = useState<string>();

  const accountToCheck = address || connectedAccount?.address;

  useEffect(() => {
    if (!client || !accountToCheck || !enabled || !isReviveAvailable(client)) {
      setIsMapped(undefined);
      setEvmAddress(undefined);
      setError(undefined);
      setIsLoading(false);
      return;
    }

    const checkMapping = async () => {
      try {
        setIsLoading(true);
        setError(undefined);

        const evmAddress = toEvmAddress(accountToCheck);
        setEvmAddress(evmAddress);

        const originalAccount = await client.query.revive.originalAccount(evmAddress);
        setIsMapped(!!originalAccount);
      } catch (err) {
        console.error('Error checking account mapping:', err);
        setError(err as Error);
        setIsMapped(undefined);
      } finally {
        setIsLoading(false);
      }
    };

    checkMapping().catch(console.error);
  }, [client, accountToCheck, enabled]);

  return {
    isMapped,
    isLoading,
    error,
    evmAddress,
  };
}
