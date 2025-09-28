import { useCallback, useEffect, useState } from 'react';
import { Contract, GenericContractApi } from 'dedot/contracts';
import { Unsub } from 'dedot/types';
import { useDeepDeps } from './internal/index.js';

/**
 * Parameters for the useRootStorage hook
 */
export type UseRootStorageParameters<T extends GenericContractApi = GenericContractApi> = {
  /**
   * The contract instance or ContractApi to fetch storage from
   */
  contract: Contract<T> | undefined;
  /**
   * Whether to watch for block changes and automatically refresh the storage
   * @default false
   */
  watch?: boolean;
};

/**
 * Return type for the useRootStorage hook
 */
export type UseRootStorageReturnType<T extends GenericContractApi = GenericContractApi> = {
  /**
   * The root storage data, fully typed based on the contract's storage structure
   */
  storage?: T['types']['RootStorage'];
  /**
   * Whether the initial storage fetch is in progress
   */
  isLoading: boolean;
  /**
   * Whether a manual refresh is in progress
   */
  isRefreshing: boolean;
  /**
   * Any error that occurred during storage fetching
   */
  error?: Error;
  /**
   * Function to manually refresh the storage data
   */
  refresh: () => Promise<void>;
};

/**
 * A React hook for fetching and managing the root storage of an ink! smart contract.
 *
 * This hook provides type-safe access to the entire contract storage structure,
 * with automatic type inference from the ContractApi type. It supports both
 * one-time fetching and continuous watching for storage updates.
 *
 * @example
 * ```typescript
 * // With a Contract instance
 * const { contract } = useContract<FlipperContractApi>('flipper-contract');
 * const { storage, isLoading, refresh } = useRootStorage({
 *   contract,
 *   watch: true
 * });
 *
 * // Access typed storage fields
 * if (storage) {
 *   console.log('Current value:', storage.value); // boolean type
 * }
 * ```
 *
 * @example
 * ```typescript
 * // With a PSP22 token contract
 * const { contract } = useContract<PSP22ContractApi>('psp22-token');
 * const { storage, refresh } = useRootStorage({ contract });
 *
 * if (storage) {
 *   const totalSupply = storage.data.totalSupply;
 *   const balance = await storage.data.balances.get(accountAddress);
 * }
 * ```
 *
 * @param parameters - The hook parameters
 * @param parameters.contract - The contract instance or ContractApi to fetch storage from
 * @param parameters.watch - Whether to watch for block changes and auto-refresh
 * @returns An object containing the storage data, loading states, error, and refresh function
 */
export function useRootStorage<T extends GenericContractApi = GenericContractApi>(
  parameters: UseRootStorageParameters<T> | undefined | false,
): UseRootStorageReturnType<T> {
  const [storage, setStorage] = useState<T['types']['RootStorage']>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<Error>();

  const { contract, watch = false } = parameters || {};

  // Track contract instance changes
  const contractInstanceId = (contract as any)?._instanceId;
  const deps = useDeepDeps([contractInstanceId, watch]);

  // Fetch storage data
  useEffect(() => {
    let mounted = true;

    const fetchStorage = async () => {
      if (!contract) {
        setStorage(undefined);
        setIsLoading(true);
        return;
      }

      try {
        setIsLoading(true);
        setError(undefined);

        // Check if contract has storage property
        if (!('storage' in contract)) {
          throw new TypeError(
            'Contract does not have storage property. Ensure you are using a valid Contract instance.',
          );
        }

        // Fetch root storage
        const rootStorage = await (contract as Contract<T>).storage!.root();

        if (mounted) {
          setStorage(rootStorage as T['types']['RootStorage']);
          setError(undefined);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('Error fetching contract root storage:', err);

        if (mounted) {
          setStorage(undefined);
          setError(err);
          setIsLoading(false);
        }
      }
    };

    fetchStorage().catch(console.error);

    return () => {
      mounted = false;
    };
  }, deps);

  // Manual refresh function
  const refresh = useCallback(async () => {
    if (!contract) return;

    try {
      setIsRefreshing(true);
      setError(undefined);

      // Check if contract has storage property
      if (!('storage' in contract)) {
        throw new TypeError('Contract does not have storage property. Ensure you are using a valid Contract instance.');
      }

      // Fetch root storage
      const rootStorage = await (contract as Contract<T>).storage!.root();

      setStorage(rootStorage as T['types']['RootStorage']);
      setError(undefined);
      setIsRefreshing(false);
    } catch (err: any) {
      console.error('Error refreshing contract root storage:', err);

      setStorage(undefined);
      setError(err);
      setIsRefreshing(false);
    }
  }, deps);

  // Watch for block changes and auto-refresh
  useEffect(
    () => {
      if (!contract || !watch) return;

      const client = contract.client;
      if (!client) return;

      let unsub: Unsub;
      let done = false;

      // Subscribe to new blocks
      client.query.system
        .number(() => {
          // Refresh storage on each new block
          refresh();
        })
        .then((unsubscribe) => {
          if (done) {
            unsubscribe().catch(console.error);
          } else {
            unsub = unsubscribe;
          }
        })
        .catch(console.error);

      return () => {
        done = true;
        unsub && unsub();
      };
    },
    useDeepDeps([(contract as any)?._instanceId, refresh, watch]),
  );

  return {
    storage,
    isLoading,
    isRefreshing,
    error,
    refresh,
  };
}
