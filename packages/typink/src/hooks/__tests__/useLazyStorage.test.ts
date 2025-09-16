import { renderHook, waitFor } from '@testing-library/react';
import { Contract, GenericContractApi } from 'dedot/contracts';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useLazyStorage } from '../useLazyStorage.js';

// Mock the internal dependencies
vi.mock('../internal/index.js', () => ({
  useDeepDeps: vi.fn((deps) => deps),
}));

// Mock contract interface for testing
interface MockContractApi extends GenericContractApi {
  types: {
    LazyStorage: {
      data: {
        balances: { get: (key: string) => Promise<bigint | undefined> };
        totalSupply: bigint;
      };
      items: {
        len: () => Promise<number>;
        get: (index: number) => Promise<string | undefined>;
      };
    };
    RootStorage: any;
    LangError: any;
    ChainApi: any;
  };
}

// Create mock contract
const createMockContract = (lazyStorageData: any): Contract<MockContractApi> => {
  const mockContract = {
    address: '0x1234567890123456789012345678901234567890',
    client: {
      query: {
        system: {
          number: vi.fn().mockResolvedValue(() => Promise.resolve(() => {})),
        },
      },
    },
    storage: {
      lazy: vi.fn().mockReturnValue(lazyStorageData),
    },
    _instanceId: 'test-instance-id',
  } as any;

  return mockContract;
};

describe('useLazyStorage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should fetch lazy mapping data correctly', async () => {
    const mockBalance = 1000n;
    const mockLazyStorage = {
      data: {
        balances: {
          get: vi.fn().mockResolvedValue(mockBalance),
        },
      },
    };

    const contract = createMockContract(mockLazyStorage);
    const testAddress = '0xabcd';

    const { result } = renderHook(() =>
      useLazyStorage({
        contract,
        fn: (lazy) => lazy.data.balances.get(testAddress)
      }),
    );

    // Initial state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();

    // Wait for data to load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBe(mockBalance);
    expect(result.current.error).toBeUndefined();
    expect(mockLazyStorage.data.balances.get).toHaveBeenCalledWith(testAddress);
  });

  it('should fetch lazy object data correctly', async () => {
    const mockTotalSupply = 5000n;
    const mockLazyStorage = {
      data: {
        totalSupply: mockTotalSupply,
      },
    };

    const contract = createMockContract(mockLazyStorage);

    const { result } = renderHook(() => useLazyStorage({
      contract,
      fn: (lazy) => lazy.data.totalSupply
    }));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBe(mockTotalSupply);
    expect(result.current.error).toBeUndefined();
  });

  it('should fetch lazy storage vector data correctly', async () => {
    const mockLength = 10;
    const mockItem = 'test-item';
    const mockLazyStorage = {
      items: {
        len: vi.fn().mockResolvedValue(mockLength),
        get: vi.fn().mockResolvedValue(mockItem),
      },
    };

    const contract = createMockContract(mockLazyStorage);

    // Test vector length
    const { result: lengthResult } = renderHook(() => useLazyStorage({
      contract,
      fn: (lazy) => lazy.items.len()
    }));

    await waitFor(() => {
      expect(lengthResult.current.isLoading).toBe(false);
    });

    expect(lengthResult.current.data).toBe(mockLength);

    // Test vector item access
    const { result: itemResult } = renderHook(() => useLazyStorage({
      contract,
      fn: (lazy) => lazy.items.get(5)
    }));

    await waitFor(() => {
      expect(itemResult.current.isLoading).toBe(false);
    });

    expect(itemResult.current.data).toBe(mockItem);
    expect(mockLazyStorage.items.get).toHaveBeenCalledWith(5);
  });

  it('should handle undefined parameters gracefully', async () => {
    const { result } = renderHook(() => useLazyStorage(undefined));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeUndefined();
  });

  it('should handle errors during data fetching', async () => {
    const mockError = new Error('Network error');
    const mockLazyStorage = {
      data: {
        balances: {
          get: vi.fn().mockRejectedValue(mockError),
        },
      },
    };

    const contract = createMockContract(mockLazyStorage);

    const { result } = renderHook(() =>
      useLazyStorage({
        contract,
        fn: (lazy) => lazy.data.balances.get('test-address')
      }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBe(mockError);
  });

  it('should provide a refresh function that refetches data', async () => {
    let callCount = 0;
    const mockLazyStorage = {
      data: {
        balances: {
          get: vi.fn().mockImplementation(() => {
            callCount++;
            return Promise.resolve(BigInt(callCount * 100));
          }),
        },
      },
    };

    const contract = createMockContract(mockLazyStorage);

    const { result } = renderHook(() =>
      useLazyStorage({
        contract,
        fn: (lazy) => lazy.data.balances.get('test-address')
      }),
    );

    // Wait for initial load
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBe(100n);
    expect(callCount).toBe(1);

    // Trigger refresh
    result.current.refresh();

    await waitFor(() => {
      expect(result.current.isRefreshing).toBe(false);
    });

    expect(result.current.data).toBe(200n);
    expect(callCount).toBe(2);
  });


  it('should handle contract without storage property', async () => {
    const contractWithoutStorage = {
      address: '0x1234567890123456789012345678901234567890',
      _instanceId: 'test-instance-id',
    } as any;

    const { result } = renderHook(() =>
      useLazyStorage({
        contract: contractWithoutStorage,
        fn: (lazy) => lazy.data.totalSupply
      }),
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(TypeError);
    expect(result.current.error?.message).toContain('Contract does not have storage property');
  });

  it('should re-fetch when fn changes', async () => {
    const mockLazyStorage = {
      data: {
        balances: {
          get: vi.fn()
            .mockResolvedValueOnce(1000n)  // First call for address1
            .mockResolvedValueOnce(2000n), // Second call for address2
        },
        totalSupply: 5000n,
      },
    };

    const contract = createMockContract(mockLazyStorage);

    const { result, rerender } = renderHook(
      ({ fn }) => useLazyStorage({
        contract,
        fn
      }),
      {
        initialProps: {
          fn: (lazy: any) => lazy.data.balances.get('address1'),
        },
      },
    );

    // Wait for initial fetch
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBe(1000n);
    expect(mockLazyStorage.data.balances.get).toHaveBeenCalledWith('address1');
    expect(mockLazyStorage.data.balances.get).toHaveBeenCalledTimes(1);

    // Change fn to fetch different address
    rerender({
      fn: (lazy: any) => lazy.data.balances.get('address2'),
    });

    // Wait for re-fetch with new fn
    await waitFor(() => {
      expect(result.current.data).toBe(2000n);
    });

    expect(mockLazyStorage.data.balances.get).toHaveBeenCalledWith('address2');
    expect(mockLazyStorage.data.balances.get).toHaveBeenCalledTimes(2);
    expect(result.current.error).toBeUndefined();
    
    // Now change to a completely different fn (non-promise)
    rerender({
      fn: (lazy: any) => lazy.data.totalSupply,
    });

    await waitFor(() => {
      expect(result.current.data).toBe(5000n);
    });
    
    // Should not have called balances.get again
    expect(mockLazyStorage.data.balances.get).toHaveBeenCalledTimes(2);
  });

  it('should handle conditional execution with false parameter', async () => {
    const mockBalance = 1000n;
    const mockLazyStorage = {
      data: {
        balances: {
          get: vi.fn().mockResolvedValue(mockBalance),
        },
      },
    };

    const contract = createMockContract(mockLazyStorage);

    const { result, rerender } = renderHook(
      ({ shouldExecute }) => useLazyStorage(
        shouldExecute ? {
          contract,
          fn: (lazy) => lazy.data.balances.get('test-address')
        } : false
      ),
      {
        initialProps: { shouldExecute: false },
      },
    );

    // Should not execute when false
    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(mockLazyStorage.data.balances.get).not.toHaveBeenCalled();

    // Now enable execution
    rerender({ shouldExecute: true });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBe(mockBalance);
    expect(mockLazyStorage.data.balances.get).toHaveBeenCalledWith('test-address');
  });
});