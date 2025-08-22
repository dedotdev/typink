import { act, renderHook } from '@testing-library/react';
import { useRootStorage } from '../useRootStorage.js';
import { useTypink } from '../useTypink.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { waitForNextUpdate } from './test-utils.js';

vi.mock('../useTypink', () => ({
  useTypink: vi.fn(),
}));

describe('useRootStorage', () => {
  let mockClient: any;
  let mockRootStorage: any;
  let mockContract: any;

  beforeEach(() => {
    mockClient = {
      query: {
        system: {
          number: vi.fn(),
        },
      },
    };

    mockRootStorage = {
      value: true,
      data: {
        totalSupply: 1000000n,
        balances: {
          get: vi.fn().mockResolvedValue(50000n),
        },
      },
    };

    mockContract = {
      _instanceId: 'test-instance-123',
      client: mockClient,
      storage: {
        root: vi.fn().mockResolvedValue(mockRootStorage),
      },
    };

    vi.mocked(useTypink).mockReturnValue({
      client: mockClient,
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Basic functionality', () => {
    it('should return initial loading state', () => {
      const { result } = renderHook(() => useRootStorage({ contract: mockContract }));

      expect(result.current.isLoading).toBe(true);
      expect(result.current.storage).toBeUndefined();
      expect(result.current.error).toBeUndefined();
      expect(result.current.isRefreshing).toBe(false);
    });

    it('should fetch root storage successfully', async () => {
      const { result } = renderHook(() => useRootStorage({ contract: mockContract }));

      await waitForNextUpdate();

      expect(result.current.isLoading).toBe(false);
      expect(result.current.storage).toEqual(mockRootStorage);
      expect(result.current.error).toBeUndefined();
      expect(mockContract.storage.root).toHaveBeenCalledTimes(1);
    });

    it('should handle undefined contract', async () => {
      const { result } = renderHook(() => useRootStorage({ contract: undefined }));

      await waitForNextUpdate();

      expect(result.current.isLoading).toBe(true);
      expect(result.current.storage).toBeUndefined();
      expect(result.current.error).toBeUndefined();
    });

    it('should handle false parameters', async () => {
      const { result } = renderHook(() => useRootStorage(false));

      await waitForNextUpdate();

      expect(result.current.isLoading).toBe(true);
      expect(result.current.storage).toBeUndefined();
      expect(result.current.error).toBeUndefined();
    });
  });

  describe('Error handling', () => {
    it('should handle storage fetch errors', async () => {
      const errorMessage = 'Failed to fetch storage';
      const errorContract = {
        _instanceId: 'error-instance',
        client: mockClient,
        storage: {
          root: vi.fn().mockRejectedValue(new Error(errorMessage)),
        },
      } as any;

      const { result } = renderHook(() => useRootStorage({ contract: errorContract }));

      await waitForNextUpdate();

      expect(result.current.isLoading).toBe(false);
      expect(result.current.storage).toBeUndefined();
      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toBe(errorMessage);
    });

    it('should handle contract without storage property', async () => {
      const invalidContract = {
        _instanceId: 'invalid-instance',
        client: mockClient,
        // No storage property
      } as any;

      const { result } = renderHook(() => useRootStorage({ contract: invalidContract }));

      await waitForNextUpdate();

      expect(result.current.isLoading).toBe(false);
      expect(result.current.storage).toBeUndefined();
      expect(result.current.error).toBeDefined();
      expect(result.current.error?.message).toContain('Contract does not have storage property');
    });
  });

  describe('Refresh functionality', () => {
    it('should refresh storage manually', async () => {
      const { result } = renderHook(() => useRootStorage({ contract: mockContract }));

      await waitForNextUpdate();

      expect(mockContract.storage.root).toHaveBeenCalledTimes(1);
      expect(result.current.storage).toEqual(mockRootStorage);

      // Update mock to return different data
      const newStorage = { value: false, counter: 42 };
      mockContract.storage.root.mockResolvedValue(newStorage);

      // Trigger refresh
      await act(async () => {
        await result.current.refresh();
      });

      expect(mockContract.storage.root).toHaveBeenCalledTimes(2);
      expect(result.current.storage).toEqual(newStorage);
      expect(result.current.isRefreshing).toBe(false);
    });

    it('should handle refresh errors', async () => {
      const { result } = renderHook(() => useRootStorage({ contract: mockContract }));

      await waitForNextUpdate();

      const errorMessage = 'Refresh failed';
      mockContract.storage.root.mockRejectedValue(new Error(errorMessage));

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.error?.message).toBe(errorMessage);
      expect(result.current.storage).toBeUndefined();
      expect(result.current.isRefreshing).toBe(false);
    });

    it('should not refresh when contract is undefined', async () => {
      const { result } = renderHook(() => useRootStorage({ contract: undefined }));

      await waitForNextUpdate();

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.storage).toBeUndefined();
      expect(result.current.error).toBeUndefined();
    });
  });

  describe('Watch mode', () => {
    it('should subscribe to block changes when watch is true', async () => {
      const unsubscribe = vi.fn();
      mockClient.query.system.number.mockResolvedValue(unsubscribe);

      const { unmount } = renderHook(() => useRootStorage({ contract: mockContract, watch: true }));

      await waitForNextUpdate();

      expect(mockClient.query.system.number).toHaveBeenCalled();

      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });

    it('should not subscribe when watch is false', async () => {
      renderHook(() => useRootStorage({ contract: mockContract, watch: false }));

      await waitForNextUpdate();

      expect(mockClient.query.system.number).not.toHaveBeenCalled();
    });

    it('should not subscribe when client is undefined', async () => {
      const contractWithoutClient = {
        _instanceId: 'no-client-instance',
        client: undefined,
        storage: {
          root: vi.fn().mockResolvedValue(mockRootStorage),
        },
      };

      renderHook(() => useRootStorage({ contract: contractWithoutClient, watch: true }));

      await waitForNextUpdate();

      expect(mockClient.query.system.number).not.toHaveBeenCalled();
    });

    it('should refresh storage on block updates', async () => {
      let blockCallback: any;
      const unsubscribe = vi.fn();

      // @ts-ignore
      mockClient.query.system.number.mockImplementation((callback) => {
        blockCallback = callback;
        return Promise.resolve(unsubscribe);
      });

      const { result } = renderHook(() => useRootStorage({ contract: mockContract, watch: true }));

      await waitForNextUpdate();

      expect(mockContract.storage.root).toHaveBeenCalledTimes(1);

      // Simulate block update
      const newStorage = { value: false, newData: 'updated' };
      mockContract.storage.root.mockResolvedValue(newStorage);

      await act(async () => {
        blockCallback();
        // Wait for refresh to complete
        await new Promise((resolve) => setTimeout(resolve, 10));
      });

      expect(mockContract.storage.root).toHaveBeenCalledTimes(2);
      expect(result.current.storage).toEqual(newStorage);
    });
  });

  describe('Contract instance changes', () => {
    it('should refetch storage when contract instance changes', async () => {
      const { result, rerender } = renderHook(({ contract }) => useRootStorage({ contract }), {
        initialProps: { contract: mockContract },
      });

      await waitForNextUpdate();

      expect(mockContract.storage.root).toHaveBeenCalledTimes(1);
      expect(result.current.storage).toEqual(mockRootStorage);

      // Create new contract instance
      const newStorage = { value: false, newField: 'test' };
      const newContract = {
        _instanceId: 'new-instance-456',
        client: mockClient,
        storage: {
          root: vi.fn().mockResolvedValue(newStorage),
        },
      } as any;

      rerender({ contract: newContract });

      await waitForNextUpdate();

      expect(newContract.storage.root).toHaveBeenCalledTimes(1);
      expect(result.current.storage).toEqual(newStorage);
    });

    it('should clear storage when contract becomes undefined', async () => {
      const { result, rerender } = renderHook(({ contract }) => useRootStorage({ contract }), {
        initialProps: { contract: mockContract },
      });

      await waitForNextUpdate();

      expect(result.current.storage).toEqual(mockRootStorage);

      rerender({ contract: undefined });

      await waitForNextUpdate();

      expect(result.current.storage).toBeUndefined();
      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('Type inference', () => {
    it('should properly type storage based on ContractApi', async () => {
      // This test mainly validates TypeScript compilation
      type TestContractApi = {
        query: {};
        tx: {};
        message: {};
        event: {};
        storage: {
          value: boolean;
          counter: number;
          data: {
            totalSupply: bigint;
            balances: Map<string, bigint>;
          };
        };
      };

      const typedContract = {
        _instanceId: 'typed-instance',
        client: mockClient,
        storage: {
          root: vi.fn().mockResolvedValue({
            value: true,
            counter: 10,
            data: {
              totalSupply: 1000000n,
              balances: new Map([['alice', 500n]]),
            },
          }),
        },
      } as any;

      // @ts-ignore
      const { result } = renderHook(() => useRootStorage<TestContractApi>({ contract: typedContract }));

      await waitForNextUpdate();

      // These assertions verify type inference is working
      if (result.current.storage) {
        // @ts-ignore
        expect(result.current.storage.value).toBe(true);
        // @ts-ignore
        expect(result.current.storage.counter).toBe(10);
        // @ts-ignore
        expect(result.current.storage.data.totalSupply).toBe(1000000n);

        // TypeScript should know these are the correct types
        // @ts-ignore
        const _valueCheck: boolean = result.current.storage.value;
        // @ts-ignore
        const _counterCheck: number = result.current.storage.counter;
        // @ts-ignore
        const _supplyCheck: bigint = result.current.storage.data.totalSupply;
      }
    });
  });
});
