import { renderHook, waitFor } from '@testing-library/react';
import { useWatchContractQuery } from '../useContractQuery';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Contract } from 'dedot/contracts';
import { waitForNextUpdate } from './test-utils';
import { useTypink } from '../useTypink';

// Mock the external dependencies
vi.mock('react-use', () => ({
  useBoolean: vi.fn(() => [false, { setTrue: vi.fn(), setFalse: vi.fn() }]),
  useDeepCompareEffect: vi.fn((effect) => effect()),
}));

vi.mock('./internal/index.js', () => ({
  useRefresher: vi.fn(() => ({ refresh: vi.fn(), counter: 0 })),
}));

vi.mock('../useTypink', () => ({
  useTypink: vi.fn(),
}));

describe('useWatchContractQuery', () => {
  // Mock the client
  const mockClient = {
    query: {
      system: {
        number: vi.fn().mockResolvedValue(0),
      },
    },
  };

  let contract: Contract<any>;

  beforeEach(() => {
    contract = {
      query: {
        message: vi.fn().mockResolvedValue({ data: 'initial result' }),
      },
      client: mockClient,
    } as any;

    vi.mocked(useTypink).mockReturnValue({ client: mockClient } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return loading state initially', () => {
    const { result } = renderHook(() =>
      useWatchContractQuery({
        contract,
        // @ts-ignore
        fn: 'message',
      }),
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();
  });

  it('should call the contract query function', async () => {
    const { result } = renderHook(() =>
      useWatchContractQuery({
        contract,
        // @ts-ignore
        fn: 'message',
        args: ['arg1', 'arg2'],
      }),
    );

    await waitForNextUpdate();

    expect(contract.query.message).toHaveBeenCalledWith('arg1', 'arg2', undefined);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toEqual('initial result');
  });

  it('should handle errors from the contract query', async () => {
    const testError = new Error('Test error');
    contract.query.message.mockRejectedValue(testError);

    const { result } = renderHook(() =>
      useWatchContractQuery({
        contract,
        // @ts-ignore
        fn: 'message',
      }),
    );

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(testError);
    expect(result.current.data).toBeUndefined();
  });

  it('should reset error state on successful query after an error', async () => {
    const testError = new Error('Test error');
    contract.query.message
      .mockRejectedValueOnce(testError) // prettier-end-here
      .mockResolvedValueOnce({ data: 'success after error' });

    const { result } = renderHook(() =>
      useWatchContractQuery({
        contract,
        // @ts-ignore
        fn: 'message',
      }),
    );

    await waitForNextUpdate();

    expect(result.current.error).toBe(testError);

    await waitForNextUpdate(async () => {
      result.current.refresh();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.data).toEqual('success after error');
  });

  it('should maintain loading state if contract is undefined', async () => {
    const { result } = renderHook(() =>
      useWatchContractQuery({
        contract: undefined,
        // @ts-ignore
        fn: 'message',
      }),
    );

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeUndefined();
    expect(result.current.data).toBeUndefined();
  });

  it('should not call query if contract is undefined', async () => {
    renderHook(() =>
      useWatchContractQuery({
        contract: undefined,
        // @ts-ignore
        fn: 'message',
      }),
    );

    await waitForNextUpdate();

    expect(contract.query.message).not.toHaveBeenCalled();
  });

  it('should update isLoading state correctly', async () => {
    const { result } = renderHook(() =>
      useWatchContractQuery({
        contract,
        // @ts-ignore
        fn: 'message',
      }),
    );

    expect(result.current.isLoading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(false);
  });

  it('should refresh when client.query.system.number changes', async () => {
    // Simulate a block number change
    mockClient.query.system.number.mockImplementation((callback) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          callback(2);
          setTimeout(() => {
            callback(3);
          }, 50);
        }, 100);

        resolve(() => {});
      });
    });

    const { result } = renderHook(() =>
      useWatchContractQuery({
        contract,
        // @ts-ignore
        fn: 'message',
      }),
    );

    await waitForNextUpdate();

    expect(result.current.data).toEqual('initial result');

    contract.query.message.mockResolvedValue({ data: 'updated result' });

    await waitFor(() => {
      expect(contract.query.message).toHaveBeenCalledTimes(3);
      expect(result.current.data).toEqual('updated result');
    });
  });
});
