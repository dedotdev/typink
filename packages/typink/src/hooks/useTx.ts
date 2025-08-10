import { useMemo, useState } from 'react';
import { useTypink } from './useTypink.js';
import { Args, OmitNever } from '../types.js';
import { ISubmittableResult, RpcVersion, VersionedGenericSubstrateApi } from 'dedot/types';
import { SubstrateApi } from 'dedot/chaintypes';
import { assert, deferred } from 'dedot/utils';
import { withReadableErrorMessage } from '../utils/index.js';
import { useDeepDeps } from './internal/index.js';
import { checkBalanceSufficiency } from '../helpers/index.js';
import { CompatibleSubstrateApi } from '../providers/ClientProvider.js';

// Get the actual ChainApi at runtime version
type RuntimeChainApi<ChainApi extends VersionedGenericSubstrateApi = SubstrateApi> = ChainApi[RpcVersion];

// Extract pallet names from the runtime ChainApi
type UseTxPallets<ChainApi extends VersionedGenericSubstrateApi = SubstrateApi> = OmitNever<{
  [K in keyof RuntimeChainApi<ChainApi>['tx']]: K extends string
    ? K extends `${infer Literal}`
      ? Literal
      : never
    : never;
}>;

// Extract method names for a specific pallet
type UseTxMethods<
  ChainApi extends VersionedGenericSubstrateApi = SubstrateApi,
  P extends keyof UseTxPallets<ChainApi> = keyof UseTxPallets<ChainApi>,
> = OmitNever<{
  [K in keyof RuntimeChainApi<ChainApi>['tx'][P]]: K extends string
    ? K extends `${infer Literal}`
      ? Literal
      : never
    : never;
}>;

// Type for the return value of useTx with proper generic constraints
type UseTxReturnType<
  ChainApi extends VersionedGenericSubstrateApi = SubstrateApi,
  P extends keyof UseTxPallets<ChainApi> = keyof UseTxPallets<ChainApi>,
  M extends keyof UseTxMethods<ChainApi, P> = keyof UseTxMethods<ChainApi, P>,
> = {
  signAndSend(
    parameters: {
      txOptions?: Record<string, any>; // Transaction options (e.g., tip, mortality)
      callback?: (result: ISubmittableResult) => void;
    } & Args<Parameters<RuntimeChainApi<ChainApi>['tx'][P][M]>>,
  ): Promise<void>;
  inProgress: boolean;
  inBestBlockProgress: boolean;
};

/**
 * A React hook for managing general substrate transactions.
 *
 * This hook provides functionality to sign and send transactions to the blockchain,
 * and tracks the progress of the transaction.
 *
 * @param client - The substrate client instance
 * @param pallet - The pallet name (e.g., 'system', 'balances')
 * @param method - The method name (e.g., 'remark', 'transfer')
 *
 * @returns An object containing:
 *   - signAndSend: A function to sign and send the transaction with fully typed args
 *   - inProgress: A boolean indicating if a transaction is in progress
 *   - inBestBlockProgress: A boolean indicating if the transaction is being processed
 */
export function useTx<
  ChainApi extends VersionedGenericSubstrateApi = SubstrateApi,
  P extends keyof UseTxPallets<ChainApi> = keyof UseTxPallets<ChainApi>,
  M extends keyof UseTxMethods<ChainApi, P> = keyof UseTxMethods<ChainApi, P>,
>(client: CompatibleSubstrateApi<ChainApi> | undefined, pallet: P, method: M): UseTxReturnType<ChainApi, P, M> {
  const [inProgress, setInProgress] = useState(false);
  const [inBestBlockProgress, setInBestBlockProgress] = useState(false);

  const { connectedAccount } = useTypink();

  const signAndSend = useMemo(
    () => {
      return async (o: Parameters<UseTxReturnType<ChainApi, P, M>['signAndSend']>[0]) => {
        assert(client, 'Client not found');
        assert(connectedAccount, 'No connected account. Please connect your wallet.');

        setInProgress(true);
        setInBestBlockProgress(true);

        try {
          // @ts-ignore
          const { args = [], txOptions, callback: optionalCallback } = o;

          const callback = (result: ISubmittableResult) => {
            const { status } = result;
            if (status.type === 'BestChainBlockIncluded') {
              setInBestBlockProgress(false);
            }

            optionalCallback && optionalCallback(result);
          };

          await generalTx({
            client,
            pallet,
            method,
            args,
            caller: connectedAccount.address,
            txOptions,
            callback,
          });
        } catch (e) {
          console.error(e);
          throw e;
        } finally {
          setInProgress(false);
          setInBestBlockProgress(false);
        }
      };
    },
    useDeepDeps([client, pallet, method, connectedAccount]),
  );

  return {
    signAndSend,
    inProgress,
    inBestBlockProgress,
  };
}

export async function generalTx<
  ChainApi extends VersionedGenericSubstrateApi = SubstrateApi,
  P extends keyof UseTxPallets<ChainApi> = keyof UseTxPallets<ChainApi>,
  M extends keyof UseTxMethods<ChainApi, P> = keyof UseTxMethods<ChainApi, P>,
>(parameters: {
  client: CompatibleSubstrateApi<ChainApi>;
  pallet: P;
  method: M;
  caller: string;
  args?: any[];
  txOptions?: Record<string, any>;
  callback?: (result: ISubmittableResult) => void;
}): Promise<void> {
  const defer = deferred<void>();

  const signAndSend = async () => {
    const { client, pallet, method, args = [], caller, txOptions = {}, callback } = parameters;

    await checkBalanceSufficiency(client as any, caller);

    try {
      // @ts-ignore - We need to ignore TS here because of dynamic pallet/method access
      await client.tx[pallet][method](...args, txOptions).signAndSend(caller, (result: ISubmittableResult) => {
        callback && callback(result);

        const {
          status: { type },
        } = result;

        if (type === 'Finalized' || type === 'Invalid' || type === 'Drop') {
          defer.resolve();
        }
      });
    } catch (e: any) {
      throw withReadableErrorMessage(client as any, e);
    }
  };

  signAndSend().catch(defer.reject);

  return defer.promise;
}
