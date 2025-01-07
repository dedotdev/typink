import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTypink } from '../useTypink.js';
import { ContractDeployer } from 'dedot/contracts';
import { waitForNextUpdate } from './test-utils.js';
import { useDeployerTx } from '../useDeployerTx.js';
import { checkBalanceSufficiency } from '../../helpers/index.js';
import { BalanceInsufficientError } from '../../utils/index.js';

// Mock the useTypink hook
vi.mock('../useTypink', () => ({
  useTypink: vi.fn(),
}));

vi.mock('../../helpers', () => ({
  checkBalanceSufficiency: vi.fn(),
}));

describe('useDeployerTx', () => {
  const randomGasLimit = { refTime: 1000n, proofSize: 1000n };
  let mockContractDeployer: ContractDeployer<any>;
  let mockConnectedAccount: { address: string };

  beforeEach(() => {
    mockContractDeployer = {
      client: vi.fn(),
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

    (checkBalanceSufficiency as any).mockImplementation(() => Promise.resolve(true));
  });

  it('should return the correct structure', () => {
    const { result } = renderHook(() =>
      useDeployerTx(
        mockContractDeployer,
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
      useDeployerTx(
        undefined,
        // @ts-ignore
        'message',
      ),
    );

    await expect(result.current.signAndSend({} as any)).rejects.toThrow('ContractDeployer not found');
  });

  it('should throw an error if connectedAccount is undefined', async () => {
    (useTypink as any).mockReturnValue({
      connectedAccount: undefined,
    });

    const { result } = renderHook(() =>
      useDeployerTx(
        mockContractDeployer,
        // @ts-ignore
        'message',
      ),
    );

    await expect(result.current.signAndSend({} as any)).rejects.toThrow(
      'No connected account. Please connect your wallet.',
    );
  });

  it('should call the contract method with correct parameters', async () => {
    const mockSignAndSend = vi.fn().mockImplementationOnce((_, callback) => {
      return new Promise<void>((resolve) => {
        callback({ status: { type: 'Finalized' } });
        resolve();
      });
    });

    mockContractDeployer.tx.message.mockReturnValue({ signAndSend: mockSignAndSend });
    mockContractDeployer.query.message.mockResolvedValue({
      data: { isOk: true },
      raw: { gasRequired: randomGasLimit },
    });

    const { result } = renderHook(() =>
      useDeployerTx(
        mockContractDeployer,
        // @ts-ignore
        'message',
      ),
    );

    await waitForNextUpdate(async () => {
      // @ts-ignore
      await result.current.signAndSend({ args: ['arg1', 'arg2'], txOptions: { salt: '0xdeadbeef' } });
    });

    expect(mockContractDeployer.query.message).toHaveBeenCalledWith('arg1', 'arg2', { caller: 'mock-address' });
    expect(mockContractDeployer.tx.message).toHaveBeenCalledWith('arg1', 'arg2', {
      gasLimit: randomGasLimit,
      salt: '0xdeadbeef',
    });
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

    mockContractDeployer.tx.message.mockReturnValue({ signAndSend: mockSignAndSend });
    mockContractDeployer.query.message.mockResolvedValue({
      data: { isOk: true },
      raw: { gasRequired: randomGasLimit },
    });

    const { result } = renderHook(() =>
      useDeployerTx(
        mockContractDeployer,
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
    mockContractDeployer.query.message.mockResolvedValue({
      data: { isErr: true, err: 'Contract error' },
      raw: { gasRequired: randomGasLimit },
    });

    const { result } = renderHook(() =>
      useDeployerTx(
        mockContractDeployer,
        // @ts-ignore
        'message',
      ),
    );

    await expect(result.current.signAndSend({ args: [] })).rejects.toThrow('Contract Message Error: Contract error');
  });

  it('should throw an error when balance is insufficient', async () => {
    vi.mocked(checkBalanceSufficiency).mockRejectedValue(new BalanceInsufficientError(mockConnectedAccount.address));

    const { result } = renderHook(() =>
      useDeployerTx(
        mockContractDeployer,
        // @ts-ignore
        'message',
      ),
    );

    await expect(result.current.signAndSend({ args: [] })).rejects.toThrow(
      new BalanceInsufficientError(mockConnectedAccount.address),
    );

    expect(checkBalanceSufficiency).toHaveBeenCalledWith(expect.anything(), 'mock-address');
    expect(mockContractDeployer.query.message).not.toHaveBeenCalled();
    expect(mockContractDeployer.tx.message).not.toHaveBeenCalled();
  });
});
