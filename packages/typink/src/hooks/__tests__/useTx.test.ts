import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { generalTx, useTx } from '../useTx.js';
import { useTypink } from '../useTypink.js';
import { usePolkadotClient } from '../usePolkadotClient.js';
import { checkBalanceSufficiency } from '../../helpers/index.js';
import { BalanceInsufficientError, withReadableErrorMessage } from '../../utils/index.js';

// Mock the useTypink hook
vi.mock('../useTypink', () => ({
  useTypink: vi.fn(),
}));

// Mock the usePolkadotClient hook
vi.mock('../usePolkadotClient', () => ({
  usePolkadotClient: vi.fn(),
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

    // Mock usePolkadotClient to return the client and network
    (usePolkadotClient as any).mockReturnValue({
      client: mockClient,
      network: { id: 'test-network', name: 'Test Network' },
    });

    // Ensure useTypink always returns valid account unless explicitly overridden
    (useTypink as any).mockReturnValue({
      client: mockClient,
      connectedAccount: mockConnectedAccount,
      getClient: vi.fn().mockReturnValue(mockClient),
      networks: [{ id: 'test-network', name: 'Test Network' }],
    });

    // Reset helper mocks to consistent state
    (checkBalanceSufficiency as any).mockResolvedValue(true);
    (withReadableErrorMessage as any).mockImplementation((client: any, error: any) => error);
  });

  describe('Hook Structure and Initial State', () => {
    it('should return the correct structure', () => {
      const { result } = renderHook(() => useTx((tx) => tx.system.remark));

      expect(result.current).toHaveProperty('signAndSend');
      expect(typeof result.current.signAndSend).toBe('function');
      expect(result.current).toHaveProperty('getEstimatedFee');
      expect(typeof result.current.getEstimatedFee).toBe('function');
      expect(result.current.inProgress).toBe(false);
      expect(result.current.inBestBlockProgress).toBe(false);
    });

    it('should handle undefined client gracefully in useTypink', () => {
      (usePolkadotClient as any).mockReturnValue({
        client: undefined,
        network: { id: 'test-network', name: 'Test Network' },
      });

      (useTypink as any).mockReturnValue({
        client: undefined,
        connectedAccount: mockConnectedAccount,
        getClient: vi.fn().mockReturnValue(undefined),
        networks: [{ id: 'test-network', name: 'Test Network' }],
      });

      const { result } = renderHook(() => useTx((tx) => tx.system.remark));

      expect(result.current).toHaveProperty('signAndSend');
      expect(typeof result.current.signAndSend).toBe('function');
      expect(result.current.inProgress).toBe(false);
      expect(result.current.inBestBlockProgress).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should throw an error if client is undefined', async () => {
      (usePolkadotClient as any).mockReturnValue({
        client: undefined,
        network: { id: 'test-network', name: 'Test Network' },
      });

      (useTypink as any).mockReturnValue({
        client: undefined,
        connectedAccount: mockConnectedAccount,
        getClient: vi.fn().mockReturnValue(undefined),
        networks: [{ id: 'test-network', name: 'Test Network' }],
      });

      const { result } = renderHook(() => useTx((tx) => tx.system.remark));

      await expect(result.current.signAndSend({ args: ['test'] })).rejects.toThrow('Client not found');
    });

    it('should throw an error if connectedAccount is undefined', async () => {
      (useTypink as any).mockReturnValue({
        client: mockClient,
        connectedAccount: undefined,
        getClient: vi.fn().mockReturnValue(mockClient),
        networks: [{ id: 'test-network', name: 'Test Network' }],
      });

      const { result } = renderHook(() => useTx((tx) => tx.system.remark));

      await expect(result.current.signAndSend({ args: ['test'] })).rejects.toThrow(
        'No connected account. Please connect your wallet.',
      );
    });

    it('should handle balance check failure', async () => {
      (checkBalanceSufficiency as any).mockRejectedValue(new BalanceInsufficientError('mock-address'));

      mockSignAndSend.mockImplementation((caller, callback) => {
        return new Promise<void>((_, reject) => {
          reject(new BalanceInsufficientError('mock-address'));
        });
      });

      const { result } = renderHook(() => useTx((tx) => tx.system.remark));

      await expect(result.current.signAndSend({ args: ['test'] })).rejects.toThrow();
    });

    it('should handle transaction errors', async () => {
      const mockError = new Error('Transaction failed');
      mockSignAndSend.mockImplementation(() => {
        throw mockError;
      });

      const { result } = renderHook(() => useTx((tx) => tx.system.remark));

      await expect(result.current.signAndSend()).rejects.toThrow('Transaction failed');
    });

    it('should reset states on error', async () => {
      const mockError = new Error('Transaction failed');
      mockSignAndSend.mockImplementation(() => {
        throw mockError;
      });

      const { result } = renderHook(() => useTx((tx) => tx.system.remark));

      try {
        await result.current.signAndSend({ args: ['test'] });
      } catch (e) {
        // Expected to throw
      }

      expect(result.current.inProgress).toBe(false);
      expect(result.current.inBestBlockProgress).toBe(false);
    });
  });

  describe('Progress State Management', () => {
    it('should set inProgress and inBestBlockProgress to true on start', async () => {
      let callbackFn: (result: any) => void;

      mockSignAndSend.mockImplementation((caller, txOptions, callback) => {
        callbackFn = callback;
        // Don't call the callback immediately to keep the transaction in progress
        return new Promise((resolve) => {
          setTimeout(() => {
            callback({ status: { type: 'Finalized' } });
            resolve(undefined);
          }, 50);
        });
      });

      const { result } = renderHook(() => useTx((tx) => tx.system.remark));

      // Start the transaction without awaiting
      const promise = result.current.signAndSend({ args: ['test'] });

      // Give React time to update the state
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      // Check that both states are true while transaction is in progress
      expect(result.current.inProgress).toBe(true);
      expect(result.current.inBestBlockProgress).toBe(true);

      // Wait for the transaction to complete
      await act(async () => {
        await promise;
      });

      // After completion, both should be false
      expect(result.current.inProgress).toBe(false);
      expect(result.current.inBestBlockProgress).toBe(false);
    });

    it('should set both states to false after completion', async () => {
      mockSignAndSend.mockImplementation((caller, txOptions, callback) => {
        // Immediately call callback with Finalized to resolve the deferred promise
        callback({ status: { type: 'Finalized' } });
      });

      const { result } = renderHook(() => useTx((tx) => tx.system.remark));

      await act(async () => {
        await result.current.signAndSend({ args: ['test'] });
      });

      expect(result.current.inProgress).toBe(false);
      expect(result.current.inBestBlockProgress).toBe(false);
    });

    it('should set inBestBlockProgress to false on BestChainBlockIncluded', async () => {
      let callbackFn: (result: any) => void;

      mockSignAndSend.mockImplementation((caller, txOptions, callback) => {
        callbackFn = callback;
      });

      const { result } = renderHook(() => useTx((tx) => tx.system.remark));

      // Start the transaction
      const signAndSendPromise = result.current.signAndSend({ args: ['test'] });

      // Check initial progress state
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
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

      const { result } = renderHook(() => useTx((tx) => tx.system.remark));

      await act(async () => {
        await result.current.signAndSend({
          args: ['test'],
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

      const { result } = renderHook(() => useTx((tx) => tx.system.remark));

      await act(async () => {
        await result.current.signAndSend({
          args: ['test'],
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
      const mockTxFn = vi.fn().mockReturnValue(mockTx);
      const txBuilder = vi.fn().mockReturnValue(mockTxFn);

      const { result } = renderHook(() => useTx(txBuilder));

      mockSignAndSend.mockImplementation((caller, txOptions, callback) => {
        callback({ status: { type: 'Finalized' } });
      });

      await act(async () => {
        await result.current.signAndSend({ args: ['test'] });
      });

      expect(txBuilder).toHaveBeenCalledWith(mockClient.tx);
      expect(mockTxFn).toHaveBeenCalledWith('test');
    });

    it('should work with different transaction types', async () => {
      mockSignAndSend.mockImplementation((caller, txOptions, callback) => {
        callback({ status: { type: 'Finalized' } });
      });

      const { result } = renderHook(() => useTx((tx) => tx.balances.transfer));

      await act(async () => {
        await result.current.signAndSend({ args: ['recipient', 1000] });
      });

      expect(mockClient.tx.balances.transfer).toHaveBeenCalledWith('recipient', 1000);
    });
  });

  describe('getEstimatedFee', () => {
    beforeEach(() => {
      mockPaymentInfo.mockResolvedValue({
        partialFee: 1000000n,
        weight: 100000n,
        class: 'normal',
      });
    });

    it('should estimate fee successfully', async () => {
      const { result } = renderHook(() => useTx((tx) => tx.system.remark));

      const fee = await result.current.getEstimatedFee({ args: ['test message'] });

      expect(fee).toBe(1000000n);
      expect(mockClient.tx.system.remark).toHaveBeenCalledWith('test message');
      expect(mockPaymentInfo).toHaveBeenCalledWith('mock-address', {});
    });

    it('should pass transaction options to getEstimatedFee', async () => {
      const { result } = renderHook(() => useTx((tx) => tx.balances.transfer));

      const fee = await result.current.getEstimatedFee({
        args: ['recipient-address', 1000000n],
        txOptions: { tip: 100000n },
      });

      expect(fee).toBe(1000000n);
      expect(mockClient.tx.balances.transfer).toHaveBeenCalledWith('recipient-address', 1000000n);
      expect(mockPaymentInfo).toHaveBeenCalledWith('mock-address', { tip: 100000n });
    });

    it('should throw error when client is not available', async () => {
      (usePolkadotClient as any).mockReturnValue({
        client: undefined,
        network: { id: 'test-network', name: 'Test Network' },
      });

      (useTypink as any).mockReturnValue({
        client: undefined,
        connectedAccount: mockConnectedAccount,
        getClient: vi.fn().mockReturnValue(undefined),
        networks: [{ id: 'test-network', name: 'Test Network' }],
      });

      const { result } = renderHook(() => useTx((tx) => tx.system.remark));

      await expect(result.current.getEstimatedFee({ args: ['test'] })).rejects.toThrow('Client not found');
    });

    it('should throw error when no connected account', async () => {
      (useTypink as any).mockReturnValue({
        client: mockClient,
        connectedAccount: undefined,
        getClient: vi.fn().mockReturnValue(mockClient),
        networks: [{ id: 'test-network', name: 'Test Network' }],
      });

      const { result } = renderHook(() => useTx((tx) => tx.system.remark));

      await expect(result.current.getEstimatedFee({ args: ['test'] })).rejects.toThrow(
        'No connected account. Please connect your wallet.',
      );
    });

    it('should handle errors with readable message', async () => {
      const mockError = new Error('Transaction failed');
      mockPaymentInfo.mockRejectedValue(mockError);

      (withReadableErrorMessage as any).mockImplementation((_, error) => error);

      const { result } = renderHook(() => useTx((tx) => tx.system.remark));

      await expect(result.current.getEstimatedFee({ args: ['test'] })).rejects.toThrow('Transaction failed');

      expect(withReadableErrorMessage).toHaveBeenCalledWith(mockClient, mockError);
    });
  });
});

describe('generalTx', () => {
  let mockClient: MockClient;
  let mockSignAndSend: ReturnType<typeof vi.fn>;
  let mockPaymentInfo: ReturnType<typeof vi.fn>;
  let mockTx: MockTx;

  beforeEach(() => {
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
        txBuilder: (tx) => tx.system.remark,
        args: ['test'],
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
        txBuilder: (tx) => tx.system.remark,
        args: ['test'],
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
        txBuilder: (tx) => tx.system.remark,
        args: ['test'],
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
        txBuilder: (tx) => tx.system.remark,
        args: ['test'],
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
        txBuilder: (tx) => tx.system.remark,
        args: ['test'],
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
        txBuilder: (tx) => tx.system.remark,
        args: ['test'],
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
        txBuilder: (tx) => tx.system.remark,
        args: ['test'],
        caller: 'test-address',
      });

      expect(mockClient.tx.system.remark).toHaveBeenCalledWith('test');
      expect(mockSignAndSend).toHaveBeenCalledWith('test-address', {}, expect.any(Function));
    });
  });
});
