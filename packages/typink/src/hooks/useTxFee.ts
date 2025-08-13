import { useCallback, useEffect, useState } from 'react';
import { useTypink } from './useTypink.js';
import { PayloadOptions, VersionedGenericSubstrateApi } from 'dedot/types';
import { SubstrateApi } from 'dedot/chaintypes';
import { withReadableErrorMessage } from '../utils/index.js';
import { useDeepDeps } from './internal/index.js';
import { TxBuilder, UseTxReturnType } from './useTx.js';

// Input types for useTxFee with all parameters merged into a single object
interface UseTxFeeInput<
  ChainApi extends VersionedGenericSubstrateApi = SubstrateApi,
  TxFn extends (...args: any[]) => any = any,
> {
  tx: TxBuilder<ChainApi, TxFn> | UseTxReturnType<TxFn>;
  args?: Parameters<TxFn>;
  txOptions?: Partial<PayloadOptions>;
  enabled?: boolean;
}

// Return type for useTxFee
type UseTxFeeReturnType = {
  fee: bigint | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

/**
 * A React hook for estimating transaction fees with built-in loading and error state management.
 *
 * This hook accepts a transaction and its arguments, automatically managing the fee estimation
 * process, including loading states and error handling. Client and account availability are
 * handled internally.
 *
 * @param input - Object containing tx, args, txOptions, and enabled
 * @param input.tx - TxBuilder function or UseTxReturnType instance
 * @param input.args - Arguments for the transaction (optional)
 * @param input.txOptions - Transaction options to include in fee estimation (e.g., tip, nonce) (optional)
 * @param input.enabled - Whether to automatically fetch the fee estimate (default: true) (optional)
 *
 * @example
 * ```typescript
 * // With TxBuilder
 * const { fee, isLoading, error } = useTxFee({
 *   tx: (tx) => tx.system.remark,
 *   args: ['hello']
 * });
 *
 * // With UseTxReturnType
 * const remarkTx = useTx((tx) => tx.system.remark);
 * const { fee, isLoading, error } = useTxFee({
 *   tx: remarkTx,
 *   args: ['hello']
 * });
 *
 * // With all options
 * const { fee, isLoading, error, refresh } = useTxFee({
 *   tx: remarkTx,
 *   args: ['hello'],
 *   txOptions: { tip: 1000n },
 *   enabled: message.length > 0
 * });
 * ```
 *
 * @returns An object containing:
 *   - fee: The estimated fee in the smallest unit (bigint) or null if not available
 *   - isLoading: Boolean indicating if fee estimation is in progress
 *   - error: Error message string if estimation failed, null otherwise
 *   - refresh: Function to manually trigger fee estimation
 */
export function useTxFee<
  ChainApi extends VersionedGenericSubstrateApi = SubstrateApi,
  TxFn extends (...args: any[]) => any = any,
>(input: UseTxFeeInput<ChainApi, TxFn>): UseTxFeeReturnType {
  const { tx, args = [], txOptions = {}, enabled = true } = input;
  const { client, connectedAccount } = useTypink<ChainApi>();

  const [fee, setFee] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if tx is a UseTxReturnType by looking for the estimatedFee method
  const isUseTxReturnType = (tx: any): tx is UseTxReturnType<TxFn> => {
    return tx && typeof tx === 'object' && typeof tx.estimatedFee === 'function';
  };

  // Dependencies for effect
  const deps = useDeepDeps([client, connectedAccount, tx, args, txOptions, enabled]);

  const estimateFee = useCallback(async () => {
    if (!client || !connectedAccount) {
      setFee(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let estimatedFee: bigint;

      if (isUseTxReturnType(tx)) {
        // For UseTxReturnType, pass args and txOptions in the proper format
        const params = args.length > 0 ? { args, txOptions } : { txOptions };
        estimatedFee = await tx.estimatedFee(params as any);
      } else {
        const txFn = tx(client.tx);
        const transaction = txFn(...args);

        const paymentInfo = await transaction.paymentInfo(connectedAccount.address, txOptions);

        estimatedFee = paymentInfo.partialFee;
      }

      setFee(estimatedFee);
    } catch (e: any) {
      console.error('Error estimating fee:', e);
      const errorMessage = withReadableErrorMessage(client as any, e);
      setError(typeof errorMessage === 'string' ? errorMessage : 'Failed to estimate fee');
      setFee(null);
    } finally {
      setIsLoading(false);
    }
  }, deps);

  // Auto-fetch when dependencies change
  // Only enabled when: user enabled + client available + account connected
  useEffect(() => {
    if (enabled && client && connectedAccount) {
      estimateFee().catch(console.error);
    }
  }, deps);

  return {
    fee,
    isLoading,
    error,
    refresh: estimateFee,
  };
}
