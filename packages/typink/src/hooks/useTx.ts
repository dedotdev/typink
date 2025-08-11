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
type RuntimeChainApi<ChainApi extends VersionedGenericSubstrateApi = SubstrateApi> = ChainApi[RpcVersion];

// Type for transaction builder callback
type TxBuilder<ChainApi extends VersionedGenericSubstrateApi = SubstrateApi> = (
  tx: RuntimeChainApi<ChainApi>['tx']
) => ISubmittableExtrinsic<ISubmittableResult>;

// Type for the return value of useTx
type UseTxReturnType = {
  signAndSend(parameters?: {
    txOptions?: Partial<SignerOptions>; // Transaction options (e.g., tip, mortality)
    callback?: (result: ISubmittableResult) => void;
  }): Promise<void>;
  estimatedFee(parameters?: {
    txOptions?: Partial<PayloadOptions>; // Transaction options (e.g., tip, mortality)
  }): Promise<bigint>;
  inProgress: boolean;
  inBestBlockProgress: boolean;
};

/**
 * A React hook for managing general substrate transactions with improved type safety.
 *
 * This hook provides functionality to sign and send transactions to the blockchain,
 * and tracks the progress of the transaction.
 *
 * @param txBuilder - A callback function that receives the tx object and returns a transaction
 * 
 * @example
 * ```typescript
 * const remarkTx = useTx((tx) => tx.system.remark(message));
 * await remarkTx.signAndSend();
 * 
 * const transferTx = useTx((tx) => tx.balances.transfer(recipient, amount));
 * const fee = await transferTx.estimatedFee();
 * ```
 *
 * @returns An object containing:
 *   - signAndSend: A function to sign and send the transaction
 *   - estimatedFee: A function to estimate the transaction fee
 *   - inProgress: A boolean indicating if a transaction is in progress
 *   - inBestBlockProgress: A boolean indicating if the transaction is being processed
 */
export function useTx<ChainApi extends VersionedGenericSubstrateApi = SubstrateApi>(
  txBuilder: TxBuilder<ChainApi>
): UseTxReturnType {
  const [inProgress, setInProgress] = useState(false);
  const [inBestBlockProgress, setInBestBlockProgress] = useState(false);

  const { client, connectedAccount } = useTypink<ChainApi>();

  const signAndSend = useMemo(
    () => {
      return async (parameters: Parameters<UseTxReturnType['signAndSend']>[0] = {}) => {
        assert(client, 'Client not found');
        assert(connectedAccount, 'No connected account. Please connect your wallet.');

        setInProgress(true);
        setInBestBlockProgress(true);

        try {
          const { txOptions, callback: optionalCallback } = parameters;

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

  const estimatedFee = useMemo(
    () => {
      return async (parameters: Parameters<UseTxReturnType['estimatedFee']>[0] = {}) => {
        assert(client, 'Client not found');
        assert(connectedAccount, 'No connected account. Please connect your wallet.');

        try {
          const { txOptions= {} } = parameters;

          const tx = txBuilder(client.tx);
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
    estimatedFee,
    inProgress,
    inBestBlockProgress,
  };
}

export async function generalTx<ChainApi extends VersionedGenericSubstrateApi = SubstrateApi>(parameters: {
  client: CompatibleSubstrateApi<ChainApi>;
  txBuilder: TxBuilder<ChainApi>;
  caller: string;
  txOptions?: Partial<SignerOptions>;
  callback?: (result: ISubmittableResult) => void;
}): Promise<void> {
  const defer = deferred<void>();

  const signAndSend = async () => {
    const { client, txBuilder, caller, txOptions = {}, callback } = parameters;

    await checkBalanceSufficiency(client as any, caller);

    try {
      const tx = txBuilder(client.tx);

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