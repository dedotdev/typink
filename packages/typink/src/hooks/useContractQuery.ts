import { useEffect } from 'react';
import { useDeepDeps } from './internal/index.js';
import { Args, OmitNever, Pop } from '../types.js';
import { Contract, ContractCallOptions, GenericContractApi } from 'dedot/contracts';
import { useTypink } from './useTypink.js';
import { Unsub } from 'dedot/types';
import { useQuery } from '@tanstack/react-query';
import { stringify } from '../utils/misc.js';

type ContractQuery<A extends GenericContractApi = GenericContractApi> = OmitNever<{
  [K in keyof A['query']]: K extends string ? (K extends `${infer Literal}` ? Literal : never) : never;
}>;

type UseContractQueryReturnType<
  T extends GenericContractApi = GenericContractApi,
  M extends keyof ContractQuery<T> = keyof ContractQuery<T>,
> = {
  isLoading: boolean;
  refresh: () => Promise<void>;
  isRefreshing: boolean;
  error?: Error;
} & Partial<Awaited<ReturnType<T['query'][M]>>>;

/**
 * A React hook for querying a smart contract.
 *
 * This hook manages the state of a contract query, including loading state,
 * query results, and error handling. It automatically fetches data when the
 * contract, function, or arguments change.
 *
 * @param parameters - An object containing the query parameters
 * @param parameters.contract - The contract instance to query
 * @param parameters.fn - The name of the query function to call on the contract
 * @param parameters.options - Optional contract call options
 * @param parameters.args - The arguments to pass to the query function
 * @param parameters.watch - Whether to watch the chain for changes and refresh the query
 *
 * @returns An object containing the result of the query and:
 *   - isLoading: A boolean indicating whether the query is in progress
 *   - refresh: A function to manually trigger a refresh of the query
 *   - error: Any error that occurred during the query
 */
export function useContractQuery<
  T extends GenericContractApi = GenericContractApi,
  M extends keyof ContractQuery<T> = keyof ContractQuery<T>,
>(
  parameters: {
    contract: Contract<T> | undefined;
    fn: M;
    options?: ContractCallOptions;
    watch?: boolean;
  } & Args<Pop<Parameters<T['query'][M]>>>,
): UseContractQueryReturnType<T, M> {
  const { client } = useTypink();
  const { contract, fn, args = [], options, watch = false } = parameters;

  const { isLoading, error, isRefetching, data, refetch } = useQuery({
    // TODO!: Stringify a contract is not efficient, pick important fields only
    queryKey: [fn!, !!client, contract?.address, stringify(args), stringify(options)],
    queryFn: async () => {
      if (!client || !contract) return {};

      try {
        return await contract.query[fn](...args, options);
      } catch (error) {
        throw error;
      }
    },
    // Temporary until we allow retry in the future, if enabled the error will not be updated immediately
    retry: false,
  });

  useEffect(
    () => {
      if (!client || !watch) return;

      let unsub: Unsub;
      let done = false;

      client.query.system
        .number((_) => {
          refetch();
        })
        .then((x) => {
          if (done) {
            x().catch(console.error);
          } else {
            unsub = x;
          }
        })
        .catch(console.error);

      return () => {
        done = true;
        unsub && unsub();
      };
    },
    useDeepDeps([client, refetch, watch]),
  );

  return {
    isLoading,
    refresh: refetch,
    isRefreshing: isRefetching,
    ...(data || {}),
    error,
  } as any;
}
