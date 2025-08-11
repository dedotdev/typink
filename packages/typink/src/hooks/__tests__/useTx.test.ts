import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTx, generalTx } from '../useTx.js';
import { useTypink } from '../useTypink.js';
import { sleep, waitForNextUpdate } from './test-utils.js';
import { checkBalanceSufficiency } from '../../helpers/index.js';
import { BalanceInsufficientError, withReadableErrorMessage } from '../../utils/index.js';

// Mock the useTypink hook
vi.mock('../useTypink', () => ({
  useTypink: vi.fn(),
}));

vi.mock('../../helpers', () => ({
  checkBalanceSufficiency: vi.fn(),
}));

vi.mock('../../utils', () => ({
  withReadableErrorMessage: vi.fn(),
  BalanceInsufficientError: vi.fn().mockImplementation((address) => {
    const error = new Error(`Insufficient balance for account: ${address}`);
    error.name = 'BalanceInsufficientError';
    return error;
  }),
  noop: () => {},
  generateInstanceId: () => `test-instance-${Date.now()}`,
  formatBalance: vi.fn(),
}));

// Type definitions for better test organization
type MockTx = {
  signAndSend: ReturnType<typeof vi.fn>;
  paymentInfo: ReturnType<typeof vi.fn>;
};

type MockClient = {
  tx: {
    system: {
      remark: ReturnType<typeof vi.fn>;
      setCode: ReturnType<typeof vi.fn>;
    };
    balances: {
      transfer: ReturnType<typeof vi.fn>;
      transferKeepAlive: ReturnType<typeof vi.fn>;
    };
  };
};

describe('useTx', () => {
  let mockClient: MockClient;
  let mockConnectedAccount: { address: string };
  let mockSignAndSend: ReturnType<typeof vi.fn>;
  let mockPaymentInfo: ReturnType<typeof vi.fn>;
  let mockTx: MockTx;

  beforeEach(() => {
    // Reset all mocks first to ensure clean state
    vi.clearAllMocks();

    // Set up mocks in correct order
    mockSignAndSend = vi.fn();
    mockPaymentInfo = vi.fn();
    mockTx = {
      signAndSend: mockSignAndSend,
      paymentInfo: mockPaymentInfo,
    };

    mockClient = {
      tx: {
        system: {
          remark: vi.fn().mockReturnValue(mockTx),
          setCode: vi.fn().mockReturnValue(mockTx),
        },
        balances: {
          transfer: vi.fn().mockReturnValue(mockTx),
          transferKeepAlive: vi.fn().mockReturnValue(mockTx),
        },
      },
    };

    mockConnectedAccount = { address: 'mock-address' };

    // Ensure useTypink always returns valid account unless explicitly overridden
    (useTypink as any).mockReturnValue({
      client: mockClient,
      connectedAccount: mockConnectedAccount,
    });

    // Reset helper mocks to consistent state
    (checkBalanceSufficiency as any).mockResolvedValue(true);
    (withReadableErrorMessage as any).mockImplementation((client: any, error: any) => error);
  });

  describe('Hook Structure and Initial State', () => {
    it('should return the correct structure', () => {
      const { result } = renderHook(() => useTx((tx) => tx.system.remark('test')));

      expect(result.current).toHaveProperty('signAndSend');
      expect(typeof result.current.signAndSend).toBe('function');
      expect(result.current).toHaveProperty('estimatedFee');
      expect(typeof result.current.estimatedFee).toBe('function');
      expect(result.current.inProgress).toBe(false);
      expect(result.current.inBestBlockProgress).toBe(false);
    });

    it('should handle undefined client gracefully in useTypink', () => {
      (useTypink as any).mockReturnValue({
        client: undefined,
        connectedAccount: mockConnectedAccount,
      });

      const { result } = renderHook(() => useTx((tx) => tx.system.remark('test')));

      expect(result.current).toHaveProperty('signAndSend');
      expect(typeof result.current.signAndSend).toBe('function');
      expect(result.current.inProgress).toBe(false);
      expect(result.current.inBestBlockProgress).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should throw an error if client is undefined', async () => {
      (useTypink as any).mockReturnValue({
        client: undefined,
        connectedAccount: mockConnectedAccount,
      });

      const { result } = renderHook(() => useTx((tx) => tx.system.remark('test')));

      await expect(result.current.signAndSend()).rejects.toThrow('Client not found');
    });

    it('should throw an error if connectedAccount is undefined', async () => {
      (useTypink as any).mockReturnValue({
        client: mockClient,
        connectedAccount: undefined,
      });

      const { result } = renderHook(() => useTx((tx) => tx.system.remark('test')));

      await expect(result.current.signAndSend()).rejects.toThrow('No connected account. Please connect your wallet.');
    });

    it('should handle balance check failure', async () => {
      (checkBalanceSufficiency as any).mockRejectedValue(new BalanceInsufficientError('mock-address'));

      mockSignAndSend.mockImplementation((caller, callback) => {
        return new Promise<void>((_, reject) => {
          reject(new BalanceInsufficientError('mock-address'));
        });
      });

      const { result } = renderHook(() => useTx((tx) => tx.system.remark('test')));

      await expect(result.current.signAndSend()).rejects.toThrow();
    });

    it('should handle transaction errors', async () => {
      const mockError = new Error('Transaction failed');
      mockSignAndSend.mockImplementation(() => {
        throw mockError;
      });

      const { result } = renderHook(() => useTx((tx) => tx.system.remark('test')));

      await expect(result.current.signAndSend()).rejects.toThrow('Transaction failed');
    });

    it('should reset states on error', async () => {
      const mockError = new Error('Transaction failed');
      mockSignAndSend.mockImplementation(() => {
        throw mockError;
      });

      const { result } = renderHook(() => useTx((tx) => tx.system.remark('test')));

      try {
        await result.current.signAndSend();
      } catch (e) {
        // Expected to throw
      }

      expect(result.current.inProgress).toBe(false);
      expect(result.current.inBestBlockProgress).toBe(false);
    });
  });

  describe('Progress State Management', () => {
    it('should set inProgress and inBestBlockProgress to true on start', async () => {
      mockSignAndSend.mockImplementation((caller, txOptions, callback) => {
        // Immediately call callback with Finalized to resolve the deferred promise
        setTimeout(() => {
          callback({ status: { type: 'Finalized' } });
        }, 10);
      });

      const { result } = renderHook(() => useTx((tx) => tx.system.remark('test')));

      // Start the transaction
      const promise = result.current.signAndSend();
      
      // Check initial progress state
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(result.current.inProgress).toBe(true);
      expect(result.current.inBestBlockProgress).toBe(true);

      // Wait for completion
      await promise;
    });

    it('should set both states to false after completion', async () => {
      mockSignAndSend.mockImplementation((caller, txOptions, callback) => {
        // Immediately call callback with Finalized to resolve the deferred promise
        callback({ status: { type: 'Finalized' } });
      });

      const { result } = renderHook(() => useTx((tx) => tx.system.remark('test')));

      await act(async () => {
        await result.current.signAndSend();
      });

      expect(result.current.inProgress).toBe(false);
      expect(result.current.inBestBlockProgress).toBe(false);
    });

    it('should set inBestBlockProgress to false on BestChainBlockIncluded', async () => {
      let callbackFn: (result: any) => void;
      
      mockSignAndSend.mockImplementation((caller, txOptions, callback) => {
        callbackFn = callback;
      });

      const { result } = renderHook(() => useTx((tx) => tx.system.remark('test')));

      // Start the transaction
      const signAndSendPromise = result.current.signAndSend();
      
      // Check initial progress state
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 0));
      });
      
      expect(result.current.inProgress).toBe(true);
      expect(result.current.inBestBlockProgress).toBe(true);

      // Simulate BestChainBlockIncluded status
      await act(async () => {
        callbackFn({ status: { type: 'BestChainBlockIncluded' } });
      });

      // After BestChainBlockIncluded - inProgress stays true, inBestBlockProgress becomes false
      expect(result.current.inProgress).toBe(true);
      expect(result.current.inBestBlockProgress).toBe(false);

      // Simulate Finalized status to complete the transaction
      await act(async () => {
        callbackFn({ status: { type: 'Finalized' } });
        await signAndSendPromise;
      });

      // Final state - both should be false
      expect(result.current.inProgress).toBe(false);
      expect(result.current.inBestBlockProgress).toBe(false);
    });
  });

  describe('Callback Integration', () => {
    it('should call user-provided callback', async () => {
      const mockCallback = vi.fn();
      const mockResult = { status: { type: 'Finalized' } };

      mockSignAndSend.mockImplementation((caller, txOptions, callback) => {
        callback(mockResult);
      });

      const { result } = renderHook(() => useTx((tx) => tx.system.remark('test')));

      await act(async () => {
        await result.current.signAndSend({
          callback: mockCallback,
        });
      });

      expect(mockCallback).toHaveBeenCalledWith(mockResult);
    });

    it('should handle callback and state updates together', async () => {
      const mockCallback = vi.fn();
      let callbackFn: (result: any) => void;

      mockSignAndSend.mockImplementation((caller, txOptions, callback) => {
        callbackFn = callback;
        // Immediately trigger callbacks to simulate transaction flow
        setTimeout(() => {
          callback({ status: { type: 'BestChainBlockIncluded' } });
          callback({ status: { type: 'Finalized' } });
        }, 0);
      });

      const { result } = renderHook(() => useTx((tx) => tx.system.remark('test')));

      await act(async () => {
        await result.current.signAndSend({
          callback: mockCallback,
        });
      });

      expect(mockCallback).toHaveBeenCalledTimes(2);
      expect(mockCallback).toHaveBeenNthCalledWith(1, { status: { type: 'BestChainBlockIncluded' } });
      expect(mockCallback).toHaveBeenNthCalledWith(2, { status: { type: 'Finalized' } });

      // Check that states are reset to false after completion
      expect(result.current.inProgress).toBe(false);
      expect(result.current.inBestBlockProgress).toBe(false);
    });
  });

  describe('Transaction Builder Integration', () => {
    it('should call transaction builder with client.tx', async () => {
      const txBuilder = vi.fn().mockReturnValue(mockTx);

      const { result } = renderHook(() => useTx(txBuilder));

      mockSignAndSend.mockImplementation((caller, txOptions, callback) => {
        callback({ status: { type: 'Finalized' } });
      });

      await act(async () => {
        await result.current.signAndSend();
      });

      expect(txBuilder).toHaveBeenCalledWith(mockClient.tx);
    });

    it('should work with different transaction types', async () => {
      mockSignAndSend.mockImplementation((caller, txOptions, callback) => {
        callback({ status: { type: 'Finalized' } });
      });

      const { result } = renderHook(() => useTx((tx) => tx.balances.transfer('recipient', 1000)));

      await act(async () => {
        await result.current.signAndSend();
      });

      expect(mockClient.tx.balances.transfer).toHaveBeenCalledWith('recipient', 1000);
    });
  });

  describe('estimatedFee', () => {
    beforeEach(() => {
      mockPaymentInfo.mockResolvedValue({
        partialFee: 1000000n,
        weight: 100000n,
        class: 'normal',
      });
    });

    it('should estimate fee successfully', async () => {
      const { result } = renderHook(() => useTx((tx) => tx.system.remark('test message')));

      const fee = await result.current.estimatedFee();

      expect(fee).toBe(1000000n);
      expect(mockClient.tx.system.remark).toHaveBeenCalledWith('test message');
      expect(mockPaymentInfo).toHaveBeenCalledWith('mock-address', {});
    });

    it('should pass transaction options to estimatedFee', async () => {
      const { result } = renderHook(() => useTx((tx) => tx.balances.transfer('recipient-address', 1000000n)));

      const fee = await result.current.estimatedFee({
        txOptions: { tip: 100000n },
      });

      expect(fee).toBe(1000000n);
      expect(mockClient.tx.balances.transfer).toHaveBeenCalledWith('recipient-address', 1000000n);
      expect(mockPaymentInfo).toHaveBeenCalledWith('mock-address', { tip: 100000n });
    });

    it('should throw error when client is not available', async () => {
      (useTypink as any).mockReturnValue({
        client: undefined,
        connectedAccount: mockConnectedAccount,
      });

      const { result } = renderHook(() => useTx((tx) => tx.system.remark('test')));

      await expect(result.current.estimatedFee()).rejects.toThrow('Client not found');
    });

    it('should throw error when no connected account', async () => {
      (useTypink as any).mockReturnValue({
        client: mockClient,
        connectedAccount: undefined,
      });

      const { result } = renderHook(() => useTx((tx) => tx.system.remark('test')));

      await expect(result.current.estimatedFee()).rejects.toThrow('No connected account. Please connect your wallet.');
    });

    it('should handle errors with readable message', async () => {
      const mockError = new Error('Transaction failed');
      mockPaymentInfo.mockRejectedValue(mockError);

      (withReadableErrorMessage as any).mockImplementation((_, error) => error);

      const { result } = renderHook(() => useTx((tx) => tx.system.remark('test')));

      await expect(result.current.estimatedFee()).rejects.toThrow('Transaction failed');

      expect(withReadableErrorMessage).toHaveBeenCalledWith(mockClient, mockError);
    });
  });
});

describe('generalTx', () => {
  let mockClient: MockClient;
  let mockSignAndSend: ReturnType<typeof vi.fn>;
  let mockTx: MockTx;

  beforeEach(() => {
    mockSignAndSend = vi.fn();
    mockTx = {
      signAndSend: mockSignAndSend,
    };

    mockClient = {
      tx: {
        system: {
          remark: vi.fn().mockReturnValue(mockTx),
          setCode: vi.fn().mockReturnValue(mockTx),
        },
        balances: {
          transfer: vi.fn().mockReturnValue(mockTx),
          transferKeepAlive: vi.fn().mockReturnValue(mockTx),
        },
      },
    };

    (checkBalanceSufficiency as any).mockResolvedValue(true);
    (withReadableErrorMessage as any).mockImplementation((client: any, error: any) => error);
  });

  describe('Transaction Execution', () => {
    it('should execute transaction with txBuilder', async () => {
      mockSignAndSend.mockImplementation((caller, txOptions, callback) => {
        callback({ status: { type: 'Finalized' } });
      });

      await generalTx({
        client: mockClient,
        txBuilder: (tx) => tx.system.remark('test'),
        caller: 'test-address',
      });

      expect(mockClient.tx.system.remark).toHaveBeenCalledWith('test');
    });

    it('should call callback with transaction results', async () => {
      const mockCallback = vi.fn();

      mockSignAndSend.mockImplementation((caller, txOptions, callback) => {
        callback({ status: { type: 'BestChainBlockIncluded' } });
        callback({ status: { type: 'Finalized' } });
      });

      await generalTx({
        client: mockClient,
        txBuilder: (tx) => tx.system.remark('test'),
        caller: 'test-address',
        callback: mockCallback,
      });

      expect(mockCallback).toHaveBeenCalledTimes(2);
      expect(mockCallback).toHaveBeenNthCalledWith(1, { status: { type: 'BestChainBlockIncluded' } });
      expect(mockCallback).toHaveBeenNthCalledWith(2, { status: { type: 'Finalized' } });
    });

    it('should resolve on Finalized status', async () => {
      mockSignAndSend.mockImplementation((caller, txOptions, callback) => {
        callback({ status: { type: 'Finalized' } });
      });

      const promise = generalTx({
        client: mockClient,
        txBuilder: (tx) => tx.system.remark('test'),
        caller: 'test-address',
      });

      await expect(promise).resolves.toBeUndefined();
    });

    it('should resolve on Invalid status', async () => {
      mockSignAndSend.mockImplementation((caller, txOptions, callback) => {
        callback({ status: { type: 'Invalid' } });
      });

      const promise = generalTx({
        client: mockClient,
        txBuilder: (tx) => tx.system.remark('test'),
        caller: 'test-address',
      });

      await expect(promise).resolves.toBeUndefined();
    });

    it('should resolve on Drop status', async () => {
      mockSignAndSend.mockImplementation((caller, txOptions, callback) => {
        callback({ status: { type: 'Drop' } });
      });

      const promise = generalTx({
        client: mockClient,
        txBuilder: (tx) => tx.system.remark('test'),
        caller: 'test-address',
      });

      await expect(promise).resolves.toBeUndefined();
    });

    it('should handle txOptions with tip', async () => {
      mockSignAndSend.mockImplementation((caller, txOptions, callback) => {
        callback({ status: { type: 'Finalized' } });
      });

      await generalTx({
        client: mockClient,
        txBuilder: (tx) => tx.system.remark('test'),
        caller: 'test-address',
        txOptions: { tip: 1000n },
      });

      expect(mockSignAndSend).toHaveBeenCalledWith('test-address', { tip: 1000n }, expect.any(Function));
    });

    it('should use empty object as default txOptions', async () => {
      mockSignAndSend.mockImplementation((caller, txOptions, callback) => {
        callback({ status: { type: 'Finalized' } });
      });

      await generalTx({
        client: mockClient,
        txBuilder: (tx) => tx.system.remark('test'),
        caller: 'test-address',
      });

      expect(mockClient.tx.system.remark).toHaveBeenCalledWith('test');
      expect(mockSignAndSend).toHaveBeenCalledWith('test-address', {}, expect.any(Function));
    });
  });
});