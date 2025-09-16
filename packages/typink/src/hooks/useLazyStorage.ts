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
   * Function that navigates the lazy storage structure
   * @param lazy - The lazy storage object with type-safe access
   * @returns The value to fetch (can be a Promise for .get() operations)
   */
  fn: F;
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
 *   fn: (lazy) => lazy.data.balances.get(accountAddress)
 * });
 * // balance: bigint | undefined (fully typed)
 * ```
 *
 * @example
 * ```typescript
 * // Fetch from lazy storage vector
 * const { data: vectorLength } = useLazyStorage({
 *   contract,
 *   fn: (lazy) => lazy.items.len()
 * });
 *
 * const { data: item } = useLazyStorage({
 *   contract,
 *   fn: (lazy) => lazy.items.get(index)
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Can pass undefined/false when data isn't ready
 * const { data: balance } = useLazyStorage(
 *   addressReady ? {
 *     contract,
 *     fn: (lazy) => lazy.data.balances.get(address)
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
  const { contract, fn, watch = false } = parameters || {};

  const [data, setData] = useState<LazyStorageAccessorResult<T, F>>();
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<Error>();

  // Track dependencies for re-execution
  const contractInstanceId = (contract as any)?._instanceId;
  const deps = useDeepDeps([contractInstanceId, fn?.toString()]);

  // Initial data fetch
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (!contract || !fn) {
        setData(undefined);
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

        // Get lazy storage object
        const lazyStorage = (contract as Contract<T>).storage.lazy();

        // Apply the function
        const result = fn(lazyStorage as T['types']['LazyStorage']);

        // Handle both Promise and non-Promise results
        const finalResult = result instanceof Promise ? await result : result;

        if (mounted) {
          setData(finalResult);
          setError(undefined);
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('Error fetching lazy storage data:', err);

        if (mounted) {
          setData(undefined);
          setError(err);
          setIsLoading(false);
        }
      }
    };

    fetchData().catch(console.error);

    return () => {
      mounted = false;
    };
  }, deps);

  // Manual refresh function
  const refresh = useCallback(async () => {
    if (!contract || !fn) return;

    try {
      setIsRefreshing(true);
      setError(undefined);

      // Check if contract has storage property
      if (!('storage' in contract)) {
        throw new TypeError('Contract does not have storage property. Ensure you are using a valid Contract instance.');
      }

      // Get lazy storage object
      const lazyStorage = (contract as Contract<T>).storage.lazy();

      // Apply the function
      const result = fn(lazyStorage as T['types']['LazyStorage']);

      // Handle both Promise and non-Promise results
      const finalResult = result instanceof Promise ? await result : result;

      setData(finalResult);
      setError(undefined);
      setIsRefreshing(false);
    } catch (err: any) {
      console.error('Error when refreshing lazy storage data:', err);

      setData(undefined);
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
