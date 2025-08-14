import { useCallback, useEffect, useState } from 'react';
import { useTypink } from './useTypink.js';
import { PayloadOptions } from 'dedot/types';
import { SubstrateApi } from 'dedot/chaintypes';
import { withReadableErrorMessage } from '../utils/index.js';
import { useDeepDeps } from './internal/index.js';
import { UseTxReturnType } from './useTx.js';
import type { Args } from '../types.js';

// Input type for useTxFee - only supports UseTxReturnType
type UseTxFeeInput<TxFn extends (...args: any[]) => any = any> = {
  tx: UseTxReturnType<TxFn>;
  txOptions?: Partial<PayloadOptions>;
  enabled?: boolean;
} & Args<Parameters<TxFn>>;

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
 * This hook accepts a transaction created with `useTx` and its arguments, automatically managing
 * the fee estimation process, including loading states and error handling. Client and account
 * availability are handled internally.
 *
 * @param input - Object containing tx, args, txOptions, and enabled
 * @param input.tx - UseTxReturnType instance from useTx hook
 * @param input.args - Arguments for the transaction (required if transaction has parameters)
 * @param input.txOptions - Transaction options to include in fee estimation (e.g., tip, nonce) (optional)
 * @param input.enabled - Whether to automatically fetch the fee estimate (default: true) (optional)
 *
 * @example
 * ```typescript
 * // Basic usage
 * const remarkTx = useTx((tx) => tx.system.remark);
 * const { fee, isLoading, error } = useTxFee({
 *   tx: remarkTx,
 *   args: ['hello']
 * });
 *
 * // With all options
 * const transferTx = useTx((tx) => tx.balances.transfer);
 * const { fee, isLoading, error, refresh } = useTxFee({
 *   tx: transferTx,
 *   args: [recipient, amount],
 *   txOptions: { tip: 1000n },
 *   enabled: isValidRecipient && isValidAmount
 * });
 * ```
 *
 * @returns An object containing:
 *   - fee: The estimated fee in the smallest unit (bigint) or null if not available
 *   - isLoading: Boolean indicating if fee estimation is in progress
 *   - error: Error message string if estimation failed, null otherwise
 *   - refresh: Function to manually trigger fee estimation
 */
export function useTxFee<TxFn extends (...args: any[]) => any = any>(
  input: UseTxFeeInput<TxFn>,
): UseTxFeeReturnType {
  const { tx, args = [], txOptions = {}, enabled = true } = input;
  const { client, connectedAccount } = useTypink<SubstrateApi>();

  const [fee, setFee] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      // Pass args and txOptions in the proper format
      const params = args.length > 0 ? { args, txOptions } : { txOptions };
      const estimatedFee = await tx.getEstimatedFee(params as any);
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
