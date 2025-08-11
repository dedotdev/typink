import { useCallback, useEffect, useState } from 'react';
import { useTypink } from './useTypink.js';
import { VersionedGenericSubstrateApi } from 'dedot/types';
import { SubstrateApi } from 'dedot/chaintypes';
import { withReadableErrorMessage } from '../utils/index.js';
import { useDeepDeps } from './internal/index.js';
import { 
  RuntimeChainApi, 
  TxBuilder, 
  UseTxReturnType,
  TxEstimatedFeeParameters 
} from './useTx.js';

// Input types for useTxFee
type UseTxFeeInput<ChainApi extends VersionedGenericSubstrateApi = SubstrateApi> = 
  | TxBuilder<ChainApi> 
  | UseTxReturnType;

// Return type for useTxFee
type UseTxFeeReturnType = {
  fee: bigint | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

// Options for useTxFee
interface UseTxFeeOptions extends TxEstimatedFeeParameters {
  enabled?: boolean;
}

/**
 * A React hook for estimating transaction fees with built-in loading and error state management.
 *
 * This hook can accept either a TxBuilder function or a UseTxReturnType object and will
 * automatically manage the fee estimation process, including loading states and error handling.
 *
 * @param input - Either a TxBuilder function or a UseTxReturnType object
 * @param options - Optional configuration object
 * @param options.txOptions - Transaction options to include in fee estimation (e.g., tip, nonce)
 * @param options.enabled - Whether to automatically fetch the fee estimate (default: true)
 * 
 * @example
 * ```typescript
 * // With TxBuilder
 * const { fee, isLoading, error } = useTxFee((tx) => tx.system.remark('hello'));
 * 
 * // With UseTxReturnType
 * const remarkTx = useTx((tx) => tx.system.remark('hello'));
 * const { fee, isLoading, error } = useTxFee(remarkTx);
 * 
 * // With options
 * const { fee, isLoading, error, refetch } = useTxFee(remarkTx, {
 *   txOptions: { tip: 1000n },
 *   enabled: message.length > 0
 * });
 * ```
 *
 * @returns An object containing:
 *   - fee: The estimated fee in the smallest unit (bigint) or null if not available
 *   - isLoading: Boolean indicating if fee estimation is in progress
 *   - error: Error message string if estimation failed, null otherwise
 *   - refetch: Function to manually trigger fee estimation
 */
export function useTxFee<ChainApi extends VersionedGenericSubstrateApi = SubstrateApi>(
  input: UseTxFeeInput<ChainApi>,
  options: UseTxFeeOptions = {}
): UseTxFeeReturnType {
  const { txOptions = {}, enabled = true } = options;
  const { client, connectedAccount } = useTypink<ChainApi>();
  
  const [fee, setFee] = useState<bigint | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if input is a UseTxReturnType by looking for the estimatedFee method
  const isUseTxReturnType = (input: any): input is UseTxReturnType => {
    return input && typeof input === 'object' && typeof input.estimatedFee === 'function';
  };

  // Dependencies for effect
  const deps = useDeepDeps([
    client,
    connectedAccount,
    input,
    txOptions,
    enabled
  ]);

  const estimateFee = useCallback(async () => {
    if (!enabled || !client || !connectedAccount) {
      setFee(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let estimatedFee: bigint;

      if (isUseTxReturnType(input)) {
        estimatedFee = await input.estimatedFee({ txOptions });
      } else {
        const tx = input(client.tx);
        
        const paymentInfo = await tx.paymentInfo(connectedAccount.address, txOptions);
        
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
  useEffect(() => {
    estimateFee().catch(console.error);
  }, deps);

  return {
    fee,
    isLoading,
    error,
    refetch: estimateFee
  };
}