import { renderHook } from '@testing-library/react';
import { useContract } from '../useContract.js';
import { useTypink } from '../useTypink.js';
import { Contract } from 'dedot/contracts';
import { TypinkError } from '../../utils/index.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { waitForNextUpdate } from './test-utils.js';

vi.mock('../useTypink', () => ({
  useTypink: vi.fn(),
}));

vi.mock('dedot/contracts', () => ({
  Contract: vi.fn(),
}));

describe('useContract', () => {
  const client = {} as any;
  const dummyDeployment = {
    id: 'test-contract',
    network: 'test-network',
    metadata: {},
    address: 'test-address',
  };
  const connectedAccount = { address: 'selected-account-address' };
  const defaultCaller = 'default-caller-address';

  const mockedUseTypink = {
    deployments: [dummyDeployment],
    client,
    // @ts-ignore
    networkId: 'test-network',
    connectedAccount,
    defaultCaller,
  };

  beforeEach(() => {
    vi.mocked(useTypink).mockReturnValue(mockedUseTypink as any);
    vi.mocked(Contract).mockImplementation(() => ({}) as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize contract when all required parameters are present', async () => {
    const { result } = renderHook(() => useContract('test-contract'));

    await waitForNextUpdate();

    expect(result.current.contract).toBeDefined();
    expect(Contract).toHaveBeenCalledTimes(1);
    expect(Contract).toHaveBeenCalledWith(
      client,
      {},
      'test-address',
      expect.objectContaining({
        defaultCaller: 'selected-account-address',
      }),
    );
  });

  it('should not initialize contract when client is missing', () => {
    vi.mocked(useTypink).mockReturnValue({
      ...mockedUseTypink,
      client: undefined,
    } as any);

    const { result } = renderHook(() => useContract('test-contract'));

    expect(result.current.contract).toBeUndefined();
    expect(Contract).not.toHaveBeenCalled();
  });

  it('should not initialize contract when networkId is missing', () => {
    vi.mocked(useTypink).mockReturnValue({
      ...mockedUseTypink,
      networkId: undefined,
    } as any);

    const { result } = renderHook(() => useContract('test-contract'));

    expect(result.current.contract).toBeUndefined();
    expect(Contract).not.toHaveBeenCalled();
  });

  it('should throw TypinkError when contract deployment is not found', async () => {
    expect(() => {
      renderHook(() => useContract('non-existent-contract'));
    }).toThrow(TypinkError);

    expect(Contract).not.toHaveBeenCalled();
  });

  it('should reinitialize contract when connectedAccount changes', async () => {
    const { result, rerender } = renderHook(() => useContract('test-contract'));

    await waitForNextUpdate();

    expect(result.current.contract).toBeDefined();
    expect(Contract).toHaveBeenCalledTimes(1);

    const newSelectedAccount = { address: 'new-selected-account-address' };
    vi.mocked(useTypink).mockReturnValue({
      ...vi.mocked(useTypink).mock.results[0].value,
      connectedAccount: newSelectedAccount,
    });

    await waitForNextUpdate(async () => {
      rerender();
    });

    expect(Contract).toHaveBeenCalledTimes(2);
    expect(Contract).toHaveBeenLastCalledWith(
      client,
      {},
      'test-address',
      expect.objectContaining({
        defaultCaller: 'new-selected-account-address',
      }),
    );
  });

  it('should use defaultCaller when connectedAccount is not available', async () => {
    vi.mocked(useTypink).mockReturnValue({
      ...mockedUseTypink,
      connectedAccount: undefined,
    } as any);

    const { result } = renderHook(() => useContract('test-contract'));

    await waitForNextUpdate();

    expect(result.current.contract).toBeDefined();
    expect(Contract).toHaveBeenCalledTimes(1);
    expect(Contract).toHaveBeenCalledWith(
      client,
      {},
      'test-address',
      expect.objectContaining({
        defaultCaller: 'default-caller-address',
      }),
    );
  });
});
