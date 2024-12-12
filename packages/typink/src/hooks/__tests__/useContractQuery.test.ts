import { act, renderHook, waitFor } from '@testing-library/react';
import { useContractQuery } from '../useContractQuery.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { Contract } from 'dedot/contracts';
import { waitForNextUpdate } from './test-utils.js';
import { useTypink } from '../useTypink.js';

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

describe('useContractQuery', () => {
  let contract: Contract<any>;

  // Mock the client
  const mockClient = {
    query: {
      system: {
        number: vi.fn().mockResolvedValue(0),
      },
    },
  };

  beforeEach(() => {
    contract = {
      query: {
        message: vi.fn().mockResolvedValue({ data: 'initial result' }),
        testFunction: vi.fn(),
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
      useContractQuery({
        contract,
        // @ts-ignore
        fn: 'testFunction',
      }),
    );

    expect(result.current.isLoading).toBe(true);
  });

  it('should call the contract query function with correct arguments', async () => {
    contract.query.testFunction.mockResolvedValue({ data: 'test result' });

    await act(async () => {
      renderHook(() =>
        useContractQuery({
          contract,
          // @ts-ignore
          fn: 'testFunction',
          args: ['arg1', 'arg2'],
          options: { gasLimit: { refTime: 1000000n, proofSize: 1000000n } },
        }),
      );
    });

    expect(contract.query.testFunction).toHaveBeenCalledWith('arg1', 'arg2', {
      gasLimit: { refTime: 1000000n, proofSize: 1000000n },
    });
  });

  it('should update the result and loading state after query resolves', async () => {
    contract.query.testFunction.mockResolvedValue({ data: 'test result' });

    const { result } = renderHook(() =>
      useContractQuery({
        contract,
        // @ts-ignore
        fn: 'testFunction',
      }),
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBe('test result');
  });

  it('should not call query function if contract is undefined', async () => {
    const { result } = renderHook(() =>
      useContractQuery({
        contract: undefined,
        // @ts-ignore
        fn: 'testFunction',
      }),
    );

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(true);
    expect(contract.query.testFunction).not.toHaveBeenCalled();
  });

  it('should refresh when refresh function is called', async () => {
    contract.query.testFunction.mockResolvedValue({ data: 'test result' });

    const { result } = renderHook(() =>
      useContractQuery({
        contract,
        // @ts-ignore
        fn: 'testFunction',
      }),
    );

    await waitForNextUpdate(async () => {
      result.current.refresh();
    });

    await waitForNextUpdate(async () => {
      result.current.refresh();
    });

    expect(contract.query.testFunction).toHaveBeenCalledTimes(3);
  });

  it('should handle errors from the contract query', async () => {
    const testError = new Error('Test error');
    contract.query.testFunction.mockRejectedValue(testError);

    const { result } = renderHook(() =>
      useContractQuery({
        contract,
        // @ts-ignore
        fn: 'testFunction',
      }),
    );

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(testError);
    expect(result.current.data).toBeUndefined();
  });

  it('should reset error state on successful query after an error', async () => {
    const testError = new Error('Test error');
    contract.query.testFunction // prettier-end-here
      .mockRejectedValueOnce(testError)
      .mockResolvedValueOnce({ data: 'success after error' });

    const { result } = renderHook(() =>
      useContractQuery({
        contract,
        // @ts-ignore
        fn: 'testFunction',
      }),
    );

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(testError);
    expect(result.current.data).toBeUndefined();

    await waitForNextUpdate(async () => {
      result.current.refresh();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.data).toEqual('success after error');
  });

  it('should maintain states if contract is undefined', async () => {
    const { result } = renderHook(() =>
      useContractQuery({
        contract: undefined,
        // @ts-ignore
        fn: 'testFunction',
      }),
    );

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeUndefined();
    expect(result.current.data).toBeUndefined();
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
      useContractQuery({
        contract,
        // @ts-ignore
        fn: 'message',
        watch: true,
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
