import { useEffect, useState } from 'react';
import { useRefresher, useDeepDeps } from './internal/index.js';
import { Args, OmitNever, Pop } from '../types.js';
import { Contract, ContractCallOptions, GenericContractApi } from 'dedot/contracts';
import { useTypink } from './useTypink.js';
import { Unsub } from 'dedot/types';

type ContractQuery<A extends GenericContractApi = GenericContractApi> = OmitNever<{
  [K in keyof A['query']]: K extends string ? (K extends `${infer Literal}` ? Literal : never) : never;
}>;

type UseContractQueryReturnType<
  T extends GenericContractApi = GenericContractApi,
  M extends keyof ContractQuery<T> = keyof ContractQuery<T>,
> = {
  isLoading: boolean;
  refresh: () => void;
  error?: Error;
} & Partial<Awaited<ReturnType<T['query'][M]>>>;

export function useContractQuery<
  T extends GenericContractApi = GenericContractApi,
  M extends keyof ContractQuery<T> = keyof ContractQuery<T>,
>(
  parameters: {
    contract: Contract<T> | undefined;
    fn: M;
    options?: ContractCallOptions;
  } & Args<Pop<Parameters<T['query'][M]>>>,
): UseContractQueryReturnType<T, M> {
  // TODO replace loading tracking state with tanstack
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [result, setResult] = useState<any>();
  const [error, setError] = useState<Error>();
  const { refresh, counter } = useRefresher();

  const { contract, fn, args = [], options } = parameters;
  const deps = useDeepDeps([contract, fn, args, options, counter]);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      if (!contract || !fn || !args) return;

      try {
        const queryResult = await contract.query[fn](...args, options);
        if (mounted) {
          setResult(queryResult);
          setError(undefined);
          setIsLoading(false);
        }
      } catch (error: any) {
        console.error('Error in contract query:', error);

        if (mounted) {
          setResult(undefined);
          setError(error);
          setIsLoading(false);
        }
      }
    };

    fetchData().catch(console.error);

    return () => {
      mounted = false;
    };
  }, deps);

  return {
    isLoading,
    refresh,
    ...(result || {}),
    error,
  } as any;
}

export function useWatchContractQuery<
  T extends GenericContractApi = GenericContractApi,
  M extends keyof ContractQuery<T> = keyof ContractQuery<T>,
>(
  parameters: {
    contract: Contract<T> | undefined;
    fn: M;
    options?: ContractCallOptions;
  } & Args<Pop<Parameters<T['query'][M]>>>,
): UseContractQueryReturnType<T, M> {
  // TODO replace loading tracking state with tanstack
  const { client } = useTypink();
  const result = useContractQuery(parameters);

  useEffect(() => {
    if (!client) return;

    let unsub: Unsub;
    let done = false;

    client.query.system
      .number((_) => {
        result.refresh();
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
  }, [client]);

  return result;
}
