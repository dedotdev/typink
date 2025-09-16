import { useCallback, useEffect, useState } from 'react';
import { Contract, GenericContractApi } from 'dedot/contracts';
import { Unsub } from 'dedot/types';
import { useDeepDeps } from './internal/index.js';

/**
 * Type helper to extract the result type from a lazy storage accessor function
 */
type LazyStorageAccessorResult<T extends GenericContractApi, F> = F extends (lazy: T['types']['LazyStorage']) => infer R
  ? R extends Promise<infer U>
    ? U
    : R
  : never;

/**
 * Parameters for the useLazyStorage hook
 */
export type UseLazyStorageParameters<
  T extends GenericContractApi = GenericContractApi,
  F extends (lazy: T['types']['LazyStorage']) => any = (lazy: T['types']['LazyStorage']) => any,
> = {
  /**
   * The contract instance to fetch lazy storage from
   */
  contract: Contract<T> | undefined;
  /**
   * Accessor function that navigates the lazy storage structure
   * @param lazy - The lazy storage object with type-safe access
   * @returns The value to fetch (can be a Promise for .get() operations)
   */
  accessor: F;
  /**
   * Whether to watch for block changes and automatically refresh the data
   * @default false
   */
  watch?: boolean;
};

/**
 * Return type for the useLazyStorage hook
 */
export type UseLazyStorageReturnType<
  T extends GenericContractApi = GenericContractApi,
  F extends (lazy: T['types']['LazyStorage']) => any = (lazy: T['types']['LazyStorage']) => any,
> = {
  /**
   * The fetched data, fully typed based on the accessor function result
   */
  data?: LazyStorageAccessorResult<T, F>;
  /**
   * Whether the initial data fetch is in progress
   */
  isLoading: boolean;
  /**
   * Whether a manual refresh is in progress
   */
  isRefreshing: boolean;
  /**
   * Any error that occurred during data fetching
   */
  error?: Error;
  /**
   * Function to manually refresh the data
   */
  refresh: () => Promise<void>;
};

/**
 * A React hook for fetching specific lazy storage values from ink! smart contracts.
 *
 * This hook provides type-safe access to individual lazy storage fields with automatic
 * type inference from the ContractApi. It supports lazy mappings, objects, and vectors
 * with intelligent caching and optional real-time watching.
 *
 * @example
 * ```typescript
 * // Fetch balance from PSP22 mapping
 * const { contract } = useContract<PSP22ContractApi>('psp22');
 * const { data: balance, isLoading } = useLazyStorage({
 *   contract,
 *   accessor: (lazy) => lazy.data.balances.get(accountAddress)
 * });
 * // balance: bigint | undefined (fully typed)
 * ```
 *
 * @example
 * ```typescript
 * // Fetch simple lazy object value
 * const { data: totalSupply } = useLazyStorage({
 *   contract,
 *   accessor: (lazy) => lazy.data.totalSupply
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Fetch from lazy storage vector
 * const { data: vectorLength } = useLazyStorage({
 *   contract,
 *   accessor: (lazy) => lazy.items.len()
 * });
 *
 * const { data: item } = useLazyStorage({
 *   contract,
 *   accessor: (lazy) => lazy.items.get(index)
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Can pass undefined/false when data isn't ready
 * const { data: balance } = useLazyStorage(
 *   addressReady ? {
 *     contract,
 *     accessor: (lazy) => lazy.data.balances.get(address)
 *   } : undefined
 * );
 * ```
 *
 * @param parameters - The hook parameters or undefined/false to disable
 * @returns An object containing the fetched data, loading states, error, and refresh function
 */
export function useLazyStorage<
  T extends GenericContractApi = GenericContractApi,
  F extends (lazy: T['types']['LazyStorage']) => any = (lazy: T['types']['LazyStorage']) => any,
>(parameters: UseLazyStorageParameters<T, F> | undefined | false): UseLazyStorageReturnType<T, F> {
  const { contract, accessor, watch = false } = parameters || {};

  const [data, setData] = useState<LazyStorageAccessorResult<T, F>>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<Error>();

  // Track dependencies for re-execution
  const contractInstanceId = (contract as any)?._instanceId;
  const accessorString = accessor?.toString();
  const deps = useDeepDeps([contractInstanceId, accessorString, watch]);

  // Fetch lazy storage data
  const fetchData = useCallback(async () => {
    if (!contract || !accessor) {
      setData(undefined);
      setIsLoading(true);
      return;
    }

    try {
      setError(undefined);

      // Check if contract has storage property
      if (!('storage' in contract)) {
        throw new TypeError('Contract does not have storage property. Ensure you are using a valid Contract instance.');
      }

      // Get lazy storage object
      const lazyStorage = (contract as Contract<T>).storage.lazy();

      // Apply the accessor function
      const result = accessor(lazyStorage as T['types']['LazyStorage']);

      // Handle both Promise and non-Promise results
      const finalResult = result instanceof Promise ? await result : result;

      setData(finalResult);
      setError(undefined);
    } catch (err: any) {
      console.error('Error fetching lazy storage data:', err);
      setData(undefined);
      setError(err);
    }
  }, [contract, accessor]);

  // Initial data fetch
  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      if (mounted) {
        setIsLoading(true);
        await fetchData();
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    loadData().catch(console.error);

    return () => {
      mounted = false;
    };
  }, deps);

  // Manual refresh function
  const refresh = useCallback(async () => {
    if (!contract || !accessor) return;

    try {
      setIsRefreshing(true);
      await fetchData();
    } finally {
      setIsRefreshing(false);
    }
  }, [contract, accessor, fetchData]);

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
          // Refresh data on each new block
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
    useDeepDeps([contractInstanceId, refresh, watch]),
  );

  return {
    data,
    isLoading,
    isRefreshing,
    error,
    refresh,
  };
}
