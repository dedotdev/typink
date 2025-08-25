import { useCallback, useEffect, useState } from 'react';
import { ISubstrateClient } from 'dedot';
import { toEvmAddress } from 'dedot/contracts';
import { useTypink, SubstrateAddress } from 'typink';

export interface UseCheckMappedAccountResult {
  isMapped: boolean | undefined;
  isLoading: boolean;
  error: Error | undefined;
  evmAddress: string | undefined;
  refresh: () => Promise<void>;
}

/**
 * Check if the revive pallet is available on the current network
 * TODO move this to a generic util method
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
 * @returns Object containing mapping status, loading state, error, EVM address, and refresh function
 */
export function useCheckMappedAccount(address?: SubstrateAddress): UseCheckMappedAccountResult {
  const { client, connectedAccount } = useTypink();
  const [isMapped, setIsMapped] = useState<boolean>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error>();
  const [evmAddress, setEvmAddress] = useState<string>();

  const accountToCheck = address || connectedAccount?.address;

  const checkMapping = useCallback(async () => {
    if (!client || !accountToCheck || !isReviveAvailable(client)) {
      setIsMapped(undefined);
      setEvmAddress(undefined);
      setError(undefined);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(undefined);

      const evmAddr = toEvmAddress(accountToCheck);
      setEvmAddress(evmAddr);

      const originalAccount = await client.query.revive.originalAccount(evmAddr);
      setIsMapped(!!originalAccount);
    } catch (err) {
      console.error('Error checking account mapping:', err);
      setError(err as Error);
      setIsMapped(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [client, accountToCheck]);

  const refresh = useCallback(async () => {
    await checkMapping();
  }, [checkMapping]);

  useEffect(() => {
    checkMapping().catch(console.error);
  }, [checkMapping]);

  return {
    isMapped,
    isLoading,
    error,
    evmAddress,
    refresh,
  };
}
