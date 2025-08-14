import { useMemo, useState } from 'react';
import { useTypink } from './useTypink.js';
import { ISubmittableResult, ISubmittableExtrinsic, RpcVersion, VersionedGenericSubstrateApi, PayloadOptions, SignerOptions } from 'dedot/types';
import { SubstrateApi } from 'dedot/chaintypes';
import { assert, deferred } from 'dedot/utils';
import { withReadableErrorMessage } from '../utils/index.js';
import { useDeepDeps } from './internal/index.js';
import { checkBalanceSufficiency } from '../helpers/index.js';
import { CompatibleSubstrateApi } from '../providers/ClientProvider.js';

// Get the actual ChainApi at runtime version
export type RuntimeChainApi<ChainApi extends VersionedGenericSubstrateApi = SubstrateApi> = ChainApi[RpcVersion];

// Type for transaction builder callback that returns the transaction method (not called)
export type TxBuilder<
  ChainApi extends VersionedGenericSubstrateApi = SubstrateApi,
  TxFn extends (...args: any[]) => ISubmittableExtrinsic<ISubmittableResult> = any
> = (tx: RuntimeChainApi<ChainApi>['tx']) => TxFn;

// Helper type to infer TxFn from a TxBuilder function
export type InferTxFn<T> = T extends TxBuilder<any, infer U> ? U : never;

// Import Args type from types.ts
import type { Args } from '../types.js';

// Parameter types with proper args typing
export type TxSignAndSendParameters<TxFn extends (...args: any[]) => any = any> = {
  txOptions?: Partial<SignerOptions>; // Transaction options (e.g., tip, mortality)
  callback?: (result: ISubmittableResult) => void;
} & Args<Parameters<TxFn>>;

export type TxEstimatedFeeParameters<TxFn extends (...args: any[]) => any = any> = {
  txOptions?: Partial<PayloadOptions>; // Transaction options (e.g., tip, mortality)
} & Args<Parameters<TxFn>>;

// Type for the return value of useTx with proper generics
export type UseTxReturnType<TxFn extends (...args: any[]) => ISubmittableExtrinsic<ISubmittableResult> = any> = {
  signAndSend(parameters?: TxSignAndSendParameters<TxFn>): Promise<void>;
  getEstimatedFee(parameters?: TxEstimatedFeeParameters<TxFn>): Promise<bigint>;
  inProgress: boolean;
  inBestBlockProgress: boolean;
};

/**
 * A React hook for managing general substrate transactions with improved type safety.
 *
 * This hook provides functionality to sign and send transactions to the blockchain,
 * and tracks the progress of the transaction.
 *
 * @param txBuilder - A callback function that receives the tx object and returns a transaction method
 * 
 * @example
 * ```typescript
 * const remarkTx = useTx((tx) => tx.system.remark);
 * await remarkTx.signAndSend({ args: [message] });
 * 
 * const transferTx = useTx((tx) => tx.balances.transfer);
 * const fee = await transferTx.getEstimatedFee({ args: [recipient, amount] });
 * ```
 *
 * @returns An object containing:
 *   - signAndSend: A function to sign and send the transaction
 *   - getEstimatedFee: A function to estimate the transaction fee
 *   - inProgress: A boolean indicating if a transaction is in progress
 *   - inBestBlockProgress: A boolean indicating if the transaction is being processed
 */
export function useTx<
  ChainApi extends VersionedGenericSubstrateApi = SubstrateApi,
  TBuilder extends TxBuilder<ChainApi> = TxBuilder<ChainApi>
>(
  txBuilder: TBuilder
): UseTxReturnType<InferTxFn<TBuilder>> {
  const [inProgress, setInProgress] = useState(false);
  const [inBestBlockProgress, setInBestBlockProgress] = useState(false);

  const { client, connectedAccount } = useTypink<ChainApi>();

  const signAndSend = useMemo(
    () => {
      return async (parameters: TxSignAndSendParameters<InferTxFn<TBuilder>> = {} as any) => {
        assert(client, 'Client not found');
        assert(connectedAccount, 'No connected account. Please connect your wallet.');

        setInProgress(true);
        setInBestBlockProgress(true);

        try {
          const { args = [], txOptions, callback: optionalCallback } = parameters;

          const callback = (result: ISubmittableResult) => {
            const { status } = result;
            if (status.type === 'BestChainBlockIncluded') {
              setInBestBlockProgress(false);
            }

            optionalCallback && optionalCallback(result);
          };

          await generalTx({
            client,
            txBuilder,
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
    useDeepDeps([client, txBuilder, connectedAccount]),
  );

  const getEstimatedFee = useMemo(
    () => {
      return async (parameters: TxEstimatedFeeParameters<InferTxFn<TBuilder>> = {} as any) => {
        assert(client, 'Client not found');
        assert(connectedAccount, 'No connected account. Please connect your wallet.');

        try {
          const { args = [], txOptions = {} } = parameters;

          const txFn = txBuilder(client.tx);
          const tx = txFn(...args);
          
          const paymentInfo = await tx.paymentInfo(connectedAccount.address, txOptions);
          
          return paymentInfo.partialFee;
        } catch (e: any) {
          console.error(e);
          throw withReadableErrorMessage(client as any, e);
        }
      };
    },
    useDeepDeps([client, txBuilder, connectedAccount]),
  );

  return {
    signAndSend,
    getEstimatedFee,
    inProgress,
    inBestBlockProgress,
  };
}

export async function generalTx<
  ChainApi extends VersionedGenericSubstrateApi = SubstrateApi,
  TxFn extends (...args: any[]) => ISubmittableExtrinsic<ISubmittableResult> = any
>(parameters: {
  client: CompatibleSubstrateApi<ChainApi>;
  txBuilder: TxBuilder<ChainApi, TxFn>;
  args?: any[];
  caller: string;
  txOptions?: Partial<SignerOptions>;
  callback?: (result: ISubmittableResult) => void;
}): Promise<void> {
  const defer = deferred<void>();

  const signAndSend = async () => {
    const { client, txBuilder, args = [], caller, txOptions = {}, callback } = parameters;

    await checkBalanceSufficiency(client as any, caller);

    try {
      const txFn = txBuilder(client.tx);
      const tx = txFn(...args);

      await tx.signAndSend(caller, txOptions, (result: ISubmittableResult) => {
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