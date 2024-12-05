import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useContractTx } from '../useContractTx.js';
import { useTypink } from '../useTypink.js';
import { Contract } from 'dedot/contracts';
import { waitForNextUpdate } from './test-utils.js';

// Mock the useTypink hook
vi.mock('../useTypink', () => ({
  useTypink: vi.fn(),
}));

describe('useContractTx', () => {
  const randomGasLimit = { refTime: 1000n, proofSize: 1000n };
  let mockContract: Contract<any>;
  let mockConnectedAccount: { address: string };

  beforeEach(() => {
    mockContract = {
      tx: {
        message: vi.fn(),
      },
      query: {
        message: vi.fn(),
      },
    } as any;

    mockConnectedAccount = { address: 'mock-address' };

    (useTypink as any).mockReturnValue({
      connectedAccount: mockConnectedAccount,
    });
  });

  it('should return the correct structure', () => {
    const { result } = renderHook(() =>
      useContractTx(
        mockContract,
        // @ts-ignore
        'message',
      ),
    );

    expect(result.current).toHaveProperty('signAndSend');
    expect(typeof result.current.signAndSend).toBe('function');
    expect(result.current.inProgress).toBe(false);
    expect(result.current.inBestBlockProgress).toBe(false);
  });

  it('should throw an error if contract is undefined', async () => {
    const { result } = renderHook(() =>
      useContractTx(
        undefined,
        // @ts-ignore
        'message',
      ),
    );

    await expect(result.current.signAndSend({} as any)).rejects.toThrow('Contract Not Found');
  });

  it('should throw an error if connectedAccount is undefined', async () => {
    (useTypink as any).mockReturnValue({
      connectedAccount: undefined,
    });

    const { result } = renderHook(() =>
      useContractTx(
        mockContract,
        // @ts-ignore
        'message',
      ),
    );

    await expect(result.current.signAndSend({} as any)).rejects.toThrow('Connected Account Not Found');
  });

  it('should call the contract method with correct parameters', async () => {
    const mockSignAndSend = vi.fn().mockImplementationOnce((caller, callback) => {
      return new Promise<void>((resolve) => {
        callback({ status: { type: 'Finalized' } });
        resolve();
      });
    });
    mockContract.tx.message.mockReturnValue({ signAndSend: mockSignAndSend });
    mockContract.query.message.mockResolvedValue({
      data: { isOk: true },
      raw: { gasRequired: randomGasLimit },
    });

    const { result } = renderHook(() =>
      useContractTx(
        mockContract,
        // @ts-ignore
        'message',
      ),
    );

    await waitForNextUpdate(async () => {
      await result.current.signAndSend({ args: ['arg1', 'arg2'], txOptions: { value: 100n } });
    });

    expect(mockContract.query.message).toHaveBeenCalledWith('arg1', 'arg2', { caller: 'mock-address' });
    expect(mockContract.tx.message).toHaveBeenCalledWith('arg1', 'arg2', { gasLimit: randomGasLimit, value: 100n });
    expect(mockSignAndSend).toHaveBeenCalledWith('mock-address', expect.any(Function));
  });

  it('should update inProgress and inBestBlockProgress states', async () => {
    const mockSignAndSend = vi.fn().mockImplementation((_, callback) => {
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
    mockContract.tx.message.mockReturnValue({ signAndSend: mockSignAndSend });
    mockContract.query.message.mockResolvedValue({
      data: { isOk: true },
      raw: { gasRequired: randomGasLimit },
    });

    const { result } = renderHook(() =>
      useContractTx(
        mockContract,
        // @ts-ignore
        'message',
      ),
    );

    expect(result.current.inProgress).toBe(false);
    expect(result.current.inBestBlockProgress).toBe(false);

    const signAndSend = result.current.signAndSend({ args: [] });

    await waitForNextUpdate();

    // Check that states are set to true immediately after calling signAndSend
    expect(result.current.inProgress).toBe(true);
    expect(result.current.inBestBlockProgress).toBe(true);

    await waitForNextUpdate(async () => {
      await signAndSend;
    });

    // Check that states are set back to false after transaction is complete
    expect(result.current.inProgress).toBe(false);
    expect(result.current.inBestBlockProgress).toBe(false);
  });

  it('should throw error on dry run with errors', async () => {
    mockContract.query.message.mockResolvedValue({
      data: { isErr: true, err: 'Contract error' },
      raw: { gasRequired: randomGasLimit },
    });

    const { result } = renderHook(() =>
      useContractTx(
        mockContract,
        // @ts-ignore
        'message',
      ),
    );

    await expect(result.current.signAndSend({ args: [] })).rejects.toThrow('Contract error');
  });
});
