import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTxFee } from '../useTxFee.js';
import { useTypink } from '../useTypink.js';
import { withReadableErrorMessage } from '../../utils/index.js';

// Mock the useTypink hook
vi.mock('../useTypink', () => ({
  useTypink: vi.fn(),
}));

vi.mock('../../utils', () => ({
  withReadableErrorMessage: vi.fn(),
}));

// Mock useDeepDeps to avoid complexity in testing
vi.mock('../internal/index.js', () => ({
  useDeepDeps: (deps: any[]) => deps,
}));

// Type definitions for better test organization
type MockTx = {
  paymentInfo: ReturnType<typeof vi.fn>;
};

type MockClient = {
  tx: {
    system: {
      remark: ReturnType<typeof vi.fn>;
    };
  };
};

type MockUseTxReturnType = {
  signAndSend: ReturnType<typeof vi.fn>;
  getEstimatedFee: ReturnType<typeof vi.fn>;
  inProgress: boolean;
  inBestBlockProgress: boolean;
};

describe('useTxFee - Unit Tests', () => {
  let mockClient: MockClient;
  let mockConnectedAccount: { address: string };
  let mockPaymentInfo: ReturnType<typeof vi.fn>;
  let mockTx: MockTx;
  let mockUseTxReturnType: MockUseTxReturnType;

  beforeEach(() => {
    vi.clearAllMocks();

    mockPaymentInfo = vi.fn().mockResolvedValue({
      partialFee: 1000000n
    });

    mockTx = {
      paymentInfo: mockPaymentInfo,
    };

    mockClient = {
      tx: {
        system: {
          remark: vi.fn().mockReturnValue(mockTx),
        },
      },
    };

    mockConnectedAccount = { address: 'mock-address' };

    mockUseTxReturnType = {
      signAndSend: vi.fn().mockResolvedValue(undefined),
      getEstimatedFee: vi.fn().mockResolvedValue(2000000n),
      inProgress: false,
      inBestBlockProgress: false,
    };

    (useTypink as any).mockReturnValue({
      client: mockClient,
      connectedAccount: mockConnectedAccount,
    });

    (withReadableErrorMessage as any).mockImplementation((client: any, error: any) => error.message);
  });

  describe('Hook Structure', () => {
    it('should return correct structure when disabled', () => {
      const { result } = renderHook(() => 
        useTxFee({
          tx: (tx) => tx.system.remark,
          args: ['test'],
          enabled: false
        })
      );

      expect(result.current.fee).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(typeof result.current.refresh).toBe('function');
    });
  });

  describe('Manual Refetch - TxBuilder', () => {
    it('should estimate fee with TxBuilder via refetch', async () => {
      const { result } = renderHook(() => 
        useTxFee({
          tx: (tx) => tx.system.remark,
          args: ['test'],
          enabled: false
        })
      );

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.fee).toBe(1000000n);
      expect(result.current.error).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(mockClient.tx.system.remark).toHaveBeenCalledWith('test');
      expect(mockPaymentInfo).toHaveBeenCalledWith('mock-address', {});
    });

    it('should pass txOptions with TxBuilder', async () => {
      const txOptions = { tip: 500n };
      const { result } = renderHook(() => 
        useTxFee({
          tx: (tx) => tx.system.remark,
          args: ['test'],
          txOptions,
          enabled: false
        })
      );

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.fee).toBe(1000000n);
      expect(mockPaymentInfo).toHaveBeenCalledWith('mock-address', txOptions);
    });

    it('should handle TxBuilder errors', async () => {
      const errorMessage = 'Payment info failed';
      mockPaymentInfo.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => 
        useTxFee({ 
          tx: (tx) => tx.system.remark, 
          args: ['test'],
          enabled: false
        })
      );

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.fee).toBe(null);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Manual Refetch - UseTxReturnType', () => {
    it('should estimate fee with UseTxReturnType via refetch', async () => {
      const { result } = renderHook(() => 
        useTxFee({ 
          tx: mockUseTxReturnType, 
          args: ['test'],
          enabled: false
        })
      );

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.fee).toBe(2000000n);
      expect(result.current.error).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(mockUseTxReturnType.getEstimatedFee).toHaveBeenCalledWith({ args: ['test'], txOptions: {} });
    });

    it('should pass txOptions to UseTxReturnType', async () => {
      const txOptions = { tip: 1000n };
      const { result } = renderHook(() => 
        useTxFee({ 
          tx: mockUseTxReturnType, 
          args: ['test'],
          txOptions,
          enabled: false
        })
      );

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.fee).toBe(2000000n);
      expect(mockUseTxReturnType.getEstimatedFee).toHaveBeenCalledWith({ args: ['test'], txOptions });
    });

    it('should handle UseTxReturnType errors', async () => {
      const errorMessage = 'EstimatedFee failed';
      mockUseTxReturnType.getEstimatedFee.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => 
        useTxFee({ 
          tx: mockUseTxReturnType, 
          args: ['test'],
          enabled: false
        })
      );

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.fee).toBe(null);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Disabled State', () => {
    it('should not fetch when client is not available', () => {
      (useTypink as any).mockReturnValue({
        client: null,
        connectedAccount: mockConnectedAccount,
      });

      const { result } = renderHook(() => useTxFee({ 
        tx: (tx) => tx.system.remark, 
        args: ['test'] 
      }));

      expect(result.current.fee).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should not fetch when connectedAccount is not available', () => {
      (useTypink as any).mockReturnValue({
        client: mockClient,
        connectedAccount: null,
      });

      const { result } = renderHook(() => useTxFee({ 
        tx: (tx) => tx.system.remark, 
        args: ['test'] 
      }));

      expect(result.current.fee).toBe(null);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('Loading States', () => {
    it('should show loading during manual refetch', async () => {
      let resolvePaymentInfo: (value: any) => void;
      const paymentInfoPromise = new Promise((resolve) => {
        resolvePaymentInfo = resolve;
      });
      mockPaymentInfo.mockReturnValue(paymentInfoPromise);

      const { result } = renderHook(() => 
        useTxFee({ 
          tx: (tx) => tx.system.remark, 
          args: ['test'],
          enabled: false
        })
      );

      expect(result.current.isLoading).toBe(false);

      // Start refetch
      const refetchPromise = result.current.refresh();
      
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      act(() => {
        resolvePaymentInfo!({ partialFee: 1500000n });
      });

      await act(async () => {
        await refetchPromise;
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.fee).toBe(1500000n);
    });
  });
});