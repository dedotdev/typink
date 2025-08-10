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

describe('useTx', () => {
  let mockClient: any;
  let mockConnectedAccount: { address: string };
  let mockSignAndSend: ReturnType<typeof vi.fn>;
  let mockTxMethod: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    // Reset all mocks first to ensure clean state
    vi.clearAllMocks();

    // Set up mocks in correct order
    mockSignAndSend = vi.fn();
    mockTxMethod = vi.fn().mockReturnValue({ signAndSend: mockSignAndSend });

    mockClient = {
      tx: {
        system: {
          remark: mockTxMethod,
          setCode: mockTxMethod,
        },
        balances: {
          transfer: mockTxMethod,
          transferKeepAlive: mockTxMethod,
        },
      },
    };

    mockConnectedAccount = { address: 'mock-address' };

    // Ensure useTypink always returns valid account unless explicitly overridden
    (useTypink as any).mockReturnValue({
      connectedAccount: mockConnectedAccount,
    });

    // Reset helper mocks to consistent state
    (checkBalanceSufficiency as any).mockResolvedValue(true);
    (withReadableErrorMessage as any).mockImplementation((client: any, error: any) => error);
  });

  describe('Hook Structure and Initial State', () => {
    it('should return the correct structure', () => {
      const { result } = renderHook(() => useTx(mockClient, 'system', 'remark'));

      expect(result.current).toHaveProperty('signAndSend');
      expect(typeof result.current.signAndSend).toBe('function');
      expect(result.current.inProgress).toBe(false);
      expect(result.current.inBestBlockProgress).toBe(false);
    });

    it('should handle undefined client gracefully', () => {
      const { result } = renderHook(() => useTx(undefined, 'system', 'remark'));

      expect(result.current).toHaveProperty('signAndSend');
      expect(typeof result.current.signAndSend).toBe('function');
      expect(result.current.inProgress).toBe(false);
      expect(result.current.inBestBlockProgress).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should throw an error if client is undefined', async () => {
      const { result } = renderHook(() => useTx(undefined, 'system', 'remark'));

      await expect(result.current.signAndSend({ args: ['test'] })).rejects.toThrow('Client not found');
    });

    it('should throw an error if connectedAccount is undefined', async () => {
      (useTypink as any).mockReturnValue({
        connectedAccount: undefined,
      });

      const { result } = renderHook(() => useTx(mockClient, 'system', 'remark'));

      await expect(result.current.signAndSend({ args: ['test'] })).rejects.toThrow(
        'No connected account. Please connect your wallet.',
      );
    });

    it('should handle balance check failure', async () => {
      const balanceError = new BalanceInsufficientError('mock-address');
      vi.mocked(checkBalanceSufficiency).mockRejectedValue(balanceError);

      const { result } = renderHook(() => useTx(mockClient, 'system', 'remark'));

      await expect(result.current.signAndSend({ args: ['test'] })).rejects.toThrow(balanceError);

      expect(checkBalanceSufficiency).toHaveBeenCalledWith(mockClient, 'mock-address');
      expect(mockTxMethod).not.toHaveBeenCalled();
      expect(mockSignAndSend).not.toHaveBeenCalled();
    });

    it('should handle transaction errors', async () => {
      const transactionError = new Error('Transaction failed');
      mockSignAndSend.mockRejectedValue(transactionError);

      const { result } = renderHook(() => useTx(mockClient, 'system', 'remark'));

      await expect(result.current.signAndSend({ args: ['test'] })).rejects.toThrow('Transaction failed');
      expect(withReadableErrorMessage).toHaveBeenCalledWith(mockClient, transactionError);
    });

    it('should reset states on error', async () => {
      mockSignAndSend.mockRejectedValue(new Error('Transaction failed'));

      const { result } = renderHook(() => useTx(mockClient, 'system', 'remark'));

      expect(result.current.inProgress).toBe(false);
      expect(result.current.inBestBlockProgress).toBe(false);

      try {
        await result.current.signAndSend({ args: ['test'] });
      } catch {
        // Expected error
      }

      await waitForNextUpdate();

      expect(result.current.inProgress).toBe(false);
      expect(result.current.inBestBlockProgress).toBe(false);
    });
  });

  describe('Successful Transaction Flow', () => {
    it('should call the transaction method with correct parameters', async () => {
      mockSignAndSend.mockImplementation((caller, callback) => {
        return new Promise<void>((resolve) => {
          callback({ status: { type: 'Finalized' } });
          resolve();
        });
      });

      const { result } = renderHook(() => useTx(mockClient, 'system', 'remark'));

      await waitForNextUpdate(async () => {
        await result.current.signAndSend({
          args: ['test message'],
          txOptions: { tip: 1000n },
        });
      });

      expect(mockClient.tx.system.remark).toHaveBeenCalledWith('test message', { tip: 1000n });
      expect(mockSignAndSend).toHaveBeenCalledWith('mock-address', expect.any(Function));
    });

    it('should work with different pallet methods', async () => {
      mockSignAndSend.mockImplementation((caller, callback) => {
        return new Promise<void>((resolve) => {
          callback({ status: { type: 'Finalized' } });
          resolve();
        });
      });

      const { result: remarkResult } = renderHook(() => useTx(mockClient, 'system', 'remark'));
      const { result: transferResult } = renderHook(() => useTx(mockClient, 'balances', 'transferKeepAlive'));

      await waitForNextUpdate(async () => {
        await remarkResult.current.signAndSend({ args: ['test'] });
      });

      await waitForNextUpdate(async () => {
        await transferResult.current.signAndSend({
          args: ['dest-address', 1000n],
        });
      });

      expect(mockClient.tx.system.remark).toHaveBeenCalledWith('test', {});
      expect(mockClient.tx.balances.transfer).toHaveBeenCalledWith('dest-address', 1000n, {});
    });

    it('should handle empty args array', async () => {
      mockSignAndSend.mockImplementation((caller, callback) => {
        return new Promise<void>((resolve) => {
          callback({ status: { type: 'Finalized' } });
          resolve();
        });
      });

      const { result } = renderHook(() => useTx(mockClient, 'system', 'remark'));

      await waitForNextUpdate(async () => {
        await result.current.signAndSend({} as any);
      });

      expect(mockClient.tx.system.remark).toHaveBeenCalledWith({});
    });

    it('should verify balance before transaction', async () => {
      mockSignAndSend.mockImplementation((caller, callback) => {
        return new Promise<void>((resolve) => {
          callback({ status: { type: 'Finalized' } });
          resolve();
        });
      });

      const { result } = renderHook(() => useTx(mockClient, 'system', 'remark'));

      await waitForNextUpdate(async () => {
        await result.current.signAndSend({ args: ['test'] });
      });

      expect(checkBalanceSufficiency).toHaveBeenCalledWith(mockClient, 'mock-address');
      expect(mockTxMethod).toHaveBeenCalled();
    });
  });

  describe('Progress State Management', () => {
    it('should update inProgress and inBestBlockProgress states correctly', async () => {
      mockSignAndSend.mockImplementation((_, callback) => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            callback({ status: { type: 'BestChainBlockIncluded' } });
            setTimeout(() => {
              callback({ status: { type: 'Finalized' } });
              resolve();
            }, 10);
          }, 10);
        });
      });

      const { result } = renderHook(() => useTx(mockClient, 'system', 'remark'));

      expect(result.current.inProgress).toBe(false);
      expect(result.current.inBestBlockProgress).toBe(false);

      const signAndSendPromise = result.current.signAndSend({ args: ['test'] });

      await waitForNextUpdate();

      // Check that states are set to true during transaction
      expect(result.current.inProgress).toBe(true);
      expect(result.current.inBestBlockProgress).toBe(true);

      await waitForNextUpdate(async () => {
        await signAndSendPromise;
      });

      // Check that states are reset to false after completion
      expect(result.current.inProgress).toBe(false);
      expect(result.current.inBestBlockProgress).toBe(false);
    });

    it('should set inBestBlockProgress to false on BestChainBlockIncluded', async () => {
      mockSignAndSend.mockImplementation((caller, callback) => {
        return new Promise<void>((resolve) => {
          // Immediately call BestChainBlockIncluded
          setTimeout(() => {
            callback({ status: { type: 'BestChainBlockIncluded' } });
          }, 10);

          // Then finalize the transaction
          setTimeout(() => {
            callback({ status: { type: 'Finalized' } });
            // Add delay before resolving to allow React to process state updates
            setTimeout(() => {
              resolve();
            }, 5);
          }, 20);
        });
      });

      const { result } = renderHook(() => useTx(mockClient, 'system', 'remark'));

      const signAndSendPromise = result.current.signAndSend({ args: ['test'] });

      await waitForNextUpdate();

      // Initial state - both should be true
      expect(result.current.inProgress).toBe(true);
      expect(result.current.inBestBlockProgress).toBe(true);

      // Wait for BestChainBlockIncluded status
      await sleep(15);
      await waitForNextUpdate();

      // After BestChainBlockIncluded - inProgress stays true, inBestBlockProgress becomes false
      expect(result.current.inProgress).toBe(true);
      expect(result.current.inBestBlockProgress).toBe(false);

      // Complete the transaction and wait for final state
      await waitForNextUpdate(async () => {
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

      mockSignAndSend.mockImplementation((_, callback) => {
        return new Promise<void>((resolve) => {
          callback(mockResult);
          resolve();
        });
      });

      const { result } = renderHook(() => useTx(mockClient, 'system', 'remark'));

      // Add safety check
      expect(result.current).not.toBeNull();
      expect(result.current.signAndSend).toBeDefined();

      await waitForNextUpdate(async () => {
        await result.current.signAndSend({
          args: ['test'],
          callback: mockCallback,
        });
      });

      expect(mockCallback).toHaveBeenCalledWith(mockResult);
    });

    it('should handle callback and state updates together', async () => {
      const mockCallback = vi.fn();

      mockSignAndSend.mockImplementation((_, callback) => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            callback({ status: { type: 'BestChainBlockIncluded' } });
            setTimeout(() => {
              callback({ status: { type: 'Finalized' } });
              resolve();
            }, 10);
          }, 10);
        });
      });

      const { result } = renderHook(() => useTx(mockClient, 'system', 'remark'));

      // Add safety check
      expect(result.current).not.toBeNull();
      expect(result.current.signAndSend).toBeDefined();

      await waitForNextUpdate(async () => {
        await result.current.signAndSend({
          args: ['test'],
          callback: mockCallback,
        });
      });

      expect(mockCallback).toHaveBeenCalledTimes(2);
      expect(mockCallback).toHaveBeenNthCalledWith(1, { status: { type: 'BestChainBlockIncluded' } });
      expect(mockCallback).toHaveBeenNthCalledWith(2, { status: { type: 'Finalized' } });
    });

    it('should work without callback', async () => {
      mockSignAndSend.mockImplementation((_, callback) => {
        return new Promise<void>((resolve) => {
          callback({ status: { type: 'Finalized' } });
          resolve();
        });
      });

      const { result } = renderHook(() => useTx(mockClient, 'system', 'remark'));

      // Add safety check
      expect(result.current).not.toBeNull();
      expect(result.current.signAndSend).toBeDefined();

      await waitForNextUpdate(async () => {
        await result.current.signAndSend({ args: ['test'] });
      });

      expect(mockSignAndSend).toHaveBeenCalledWith('mock-address', expect.any(Function));
    });
  });

  describe('Dependencies and Memoization', () => {
    it('should update when client changes', () => {
      const { result, rerender } = renderHook(({ client }) => useTx(client, 'system', 'remark'), {
        initialProps: { client: mockClient },
      });

      const initialSignAndSend = result.current.signAndSend;

      const newMockClient = {
        tx: {
          system: {
            remark: vi.fn().mockReturnValue({ signAndSend: vi.fn() }),
          },
        },
      };

      rerender({ client: newMockClient });

      expect(result.current.signAndSend).not.toBe(initialSignAndSend);
    });

    it('should update when connected account changes', () => {
      const { result, rerender } = renderHook(() => useTx(mockClient, 'system', 'remark'));

      const initialSignAndSend = result.current.signAndSend;

      (useTypink as any).mockReturnValue({
        connectedAccount: { address: 'new-address' },
      });

      rerender();

      expect(result.current.signAndSend).not.toBe(initialSignAndSend);
    });

    it('should be stable when dependencies dont change', () => {
      const { result, rerender } = renderHook(() => useTx(mockClient, 'system', 'remark'));

      const initialSignAndSend = result.current.signAndSend;

      // Rerender with same props should keep same function reference
      rerender();

      expect(result.current.signAndSend).toBe(initialSignAndSend);
    });
  });
});

describe('generalTx', () => {
  let mockClient: any;
  let mockSignAndSend: ReturnType<typeof vi.fn>;
  let mockTxMethod: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSignAndSend = vi.fn();
    mockTxMethod = vi.fn().mockReturnValue({ signAndSend: mockSignAndSend });

    mockClient = {
      tx: {
        system: {
          remark: mockTxMethod,
        },
      },
    };

    (checkBalanceSufficiency as any).mockImplementation(() => Promise.resolve());
    (withReadableErrorMessage as any).mockImplementation((client: any, error: any) => error);
  });

  describe('Successful Execution', () => {
    it('should execute transaction with correct parameters', async () => {
      mockSignAndSend.mockImplementation((caller, callback) => {
        return new Promise<void>((resolve) => {
          callback({ status: { type: 'Finalized' } });
          resolve();
        });
      });

      await generalTx({
        client: mockClient,
        pallet: 'system',
        method: 'remark',
        caller: 'test-address',
        args: ['test message'],
        txOptions: { tip: 1000n },
      });

      expect(checkBalanceSufficiency).toHaveBeenCalledWith(mockClient, 'test-address');
      expect(mockClient.tx.system.remark).toHaveBeenCalledWith('test message', { tip: 1000n });
      expect(mockSignAndSend).toHaveBeenCalledWith('test-address', expect.any(Function));
    });

    it('should handle transaction status callbacks', async () => {
      const mockCallback = vi.fn();

      mockSignAndSend.mockImplementation((caller, callback) => {
        return new Promise<void>((resolve) => {
          callback({ status: { type: 'BestChainBlockIncluded' } });
          callback({ status: { type: 'Finalized' } });
          resolve();
        });
      });

      await generalTx({
        client: mockClient,
        pallet: 'system',
        method: 'remark',
        caller: 'test-address',
        args: ['test'],
        callback: mockCallback,
      });

      expect(mockCallback).toHaveBeenCalledTimes(2);
      expect(mockCallback).toHaveBeenNthCalledWith(1, { status: { type: 'BestChainBlockIncluded' } });
      expect(mockCallback).toHaveBeenNthCalledWith(2, { status: { type: 'Finalized' } });
    });

    it('should resolve on Finalized status', async () => {
      mockSignAndSend.mockImplementation((caller, callback) => {
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            callback({ status: { type: 'Finalized' } });
            resolve();
          }, 10);
        });
      });

      const promise = generalTx({
        client: mockClient,
        pallet: 'system',
        method: 'remark',
        caller: 'test-address',
        args: ['test'],
      });

      await expect(promise).resolves.toBeUndefined();
    });

    it('should resolve on Invalid status', async () => {
      mockSignAndSend.mockImplementation((caller, callback) => {
        return new Promise<void>((resolve) => {
          callback({ status: { type: 'Invalid' } });
          resolve();
        });
      });

      const promise = generalTx({
        client: mockClient,
        pallet: 'system',
        method: 'remark',
        caller: 'test-address',
        args: ['test'],
      });

      await expect(promise).resolves.toBeUndefined();
    });

    it('should resolve on Drop status', async () => {
      mockSignAndSend.mockImplementation((caller, callback) => {
        return new Promise<void>((resolve) => {
          callback({ status: { type: 'Drop' } });
          resolve();
        });
      });

      const promise = generalTx({
        client: mockClient,
        pallet: 'system',
        method: 'remark',
        caller: 'test-address',
        args: ['test'],
      });

      await expect(promise).resolves.toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should throw on balance check failure', async () => {
      const balanceError = new Error('Insufficient balance');
      vi.mocked(checkBalanceSufficiency).mockRejectedValue(balanceError);

      const promise = generalTx({
        client: mockClient,
        pallet: 'system',
        method: 'remark',
        caller: 'test-address',
        args: ['test'],
      });

      await expect(promise).rejects.toThrow('Insufficient balance');
      expect(mockTxMethod).not.toHaveBeenCalled();
    });

    it('should throw on transaction error', async () => {
      const txError = new Error('Transaction error');
      mockSignAndSend.mockRejectedValue(txError);

      const promise = generalTx({
        client: mockClient,
        pallet: 'system',
        method: 'remark',
        caller: 'test-address',
        args: ['test'],
      });

      await expect(promise).rejects.toThrow('Transaction error');
      expect(withReadableErrorMessage).toHaveBeenCalledWith(mockClient, txError);
    });
  });

  describe('Parameter Handling', () => {
    it('should use empty array as default args', async () => {
      mockSignAndSend.mockImplementation((caller, callback) => {
        return new Promise<void>((resolve) => {
          callback({ status: { type: 'Finalized' } });
          resolve();
        });
      });

      await generalTx({
        client: mockClient,
        pallet: 'system',
        method: 'remark',
        caller: 'test-address',
      });

      expect(mockClient.tx.system.remark).toHaveBeenCalledWith({});
    });

    it('should use empty object as default txOptions', async () => {
      mockSignAndSend.mockImplementation((caller, callback) => {
        return new Promise<void>((resolve) => {
          callback({ status: { type: 'Finalized' } });
          resolve();
        });
      });

      await generalTx({
        client: mockClient,
        pallet: 'system',
        method: 'remark',
        caller: 'test-address',
        args: ['test'],
      });

      expect(mockClient.tx.system.remark).toHaveBeenCalledWith('test', {});
    });
  });
});
