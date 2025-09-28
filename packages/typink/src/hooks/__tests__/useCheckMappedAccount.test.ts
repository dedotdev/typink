import { act, renderHook, waitFor } from '@testing-library/react';
import { useCheckMappedAccount } from '../useCheckMappedAccount.js';
import { useTypink } from '../useTypink.js';
import { usePolkadotClient } from '../usePolkadotClient.js';
import { toEvmAddress } from 'dedot/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { waitForNextUpdate } from './test-utils.js';
import { ClientConnectionStatus } from '../../types.js';

// Mock external dependencies
vi.mock('../useTypink', () => ({
  useTypink: vi.fn(),
}));

vi.mock('../usePolkadotClient', () => ({
  usePolkadotClient: vi.fn(),
}));

vi.mock('dedot/contracts', () => ({
  toEvmAddress: vi.fn(),
}));

describe('useCheckMappedAccount', () => {
  const mockClient = {
    query: {
      revive: {
        originalAccount: vi.fn(),
      },
    },
  };

  const connectedAccount = { address: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY' };
  const evmAddress = '0x1234567890123456789012345678901234567890';
  const testAddress = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';

  const defaultMockTypink = {
    client: mockClient,
    connectedAccount,
  };

  beforeEach(() => {
    // Mock console methods to suppress expected error messages
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    vi.mocked(useTypink).mockReturnValue(defaultMockTypink as any);
    vi.mocked(usePolkadotClient).mockReturnValue({
      client: mockClient,
      network: { id: 'test-network' },
      status: ClientConnectionStatus.Connected,
    } as any);
    vi.mocked(toEvmAddress).mockReturnValue(evmAddress);
    mockClient.query.revive.originalAccount.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should return undefined values when client is not available', async () => {
      vi.mocked(useTypink).mockReturnValue({
        client: null,
        connectedAccount,
      } as any);

      vi.mocked(usePolkadotClient).mockReturnValue({
        client: null,
        network: { id: 'test-network' },
        status: ClientConnectionStatus.NotConnected,
      } as any);

      const { result } = renderHook(() => useCheckMappedAccount());

      expect(result.current.isMapped).toBeUndefined();
      expect(result.current.evmAddress).toBeUndefined();
      expect(result.current.error).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should return undefined values when account is not available', async () => {
      vi.mocked(useTypink).mockReturnValue({
        client: mockClient,
        connectedAccount: null,
      } as any);

      const { result } = renderHook(() => useCheckMappedAccount());

      expect(result.current.isMapped).toBeUndefined();
      expect(result.current.evmAddress).toBeUndefined();
      expect(result.current.error).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('should use provided address over connected account', async () => {
      const { result } = renderHook(() => useCheckMappedAccount(testAddress));

      await waitForNextUpdate();

      expect(toEvmAddress).toHaveBeenCalledWith(testAddress);
    });

    it('should use connected account when no address provided', async () => {
      const { result } = renderHook(() => useCheckMappedAccount());

      await waitForNextUpdate();

      expect(toEvmAddress).toHaveBeenCalledWith(connectedAccount.address);
    });
  });

  describe('Revive Availability', () => {
    it('should return undefined when revive pallet is not available (no function)', async () => {
      const clientWithoutRevive = {
        query: {
          revive: {
            originalAccount: undefined,
          },
        },
      };

      vi.mocked(usePolkadotClient).mockReturnValue({
        client: clientWithoutRevive,
        network: { id: 'test-network' },
        status: ClientConnectionStatus.Connected,
      } as any);

      const { result } = renderHook(() => useCheckMappedAccount());

      await waitForNextUpdate();

      expect(result.current.isMapped).toBeUndefined();
      expect(result.current.evmAddress).toBeUndefined();
    });

    it('should return undefined when accessing revive throws an error', async () => {
      const clientThatThrows = {
        get query() {
          throw new Error('Revive pallet not available');
        },
      };

      vi.mocked(usePolkadotClient).mockReturnValue({
        client: clientThatThrows,
        network: { id: 'test-network' },
        status: ClientConnectionStatus.Connected,
      } as any);

      const { result } = renderHook(() => useCheckMappedAccount());

      await waitForNextUpdate();

      expect(result.current.isMapped).toBeUndefined();
      expect(result.current.evmAddress).toBeUndefined();
    });
  });

  describe('Mapping Check', () => {
    it('should return isMapped: true when account is mapped', async () => {
      mockClient.query.revive.originalAccount.mockResolvedValue(true);

      const { result } = renderHook(() => useCheckMappedAccount());

      await waitForNextUpdate();

      expect(result.current.isMapped).toBe(true);
      expect(result.current.evmAddress).toBe(evmAddress);
      expect(result.current.error).toBeUndefined();
    });

    it('should return isMapped: false when account is not mapped', async () => {
      mockClient.query.revive.originalAccount.mockResolvedValue(false);

      const { result } = renderHook(() => useCheckMappedAccount());

      await waitForNextUpdate();

      expect(result.current.isMapped).toBe(false);
      expect(result.current.evmAddress).toBe(evmAddress);
      expect(result.current.error).toBeUndefined();
    });

    it('should handle null/undefined response as not mapped', async () => {
      mockClient.query.revive.originalAccount.mockResolvedValue(null);

      const { result } = renderHook(() => useCheckMappedAccount());

      await waitForNextUpdate();

      expect(result.current.isMapped).toBe(false);
    });

    it('should handle query errors gracefully', async () => {
      const queryError = new Error('Query failed');
      mockClient.query.revive.originalAccount.mockRejectedValue(queryError);

      const { result } = renderHook(() => useCheckMappedAccount());

      await waitForNextUpdate();

      expect(result.current.isMapped).toBeUndefined();
      expect(result.current.error).toBe(queryError);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Loading States', () => {
    it('should show loading state during query', async () => {
      let resolveQuery: (value: any) => void;
      const queryPromise = new Promise((resolve) => {
        resolveQuery = resolve;
      });

      mockClient.query.revive.originalAccount.mockReturnValue(queryPromise);

      const { result } = renderHook(() => useCheckMappedAccount());

      // Check initial loading state
      await act(async () => {
        await waitFor(() => {
          expect(result.current.isLoading).toBe(true);
        });
      });

      // Resolve the query
      act(() => {
        resolveQuery!(true);
      });

      // Check loading state cleared
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('should clear loading state after error', async () => {
      mockClient.query.revive.originalAccount.mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() => useCheckMappedAccount());

      await waitForNextUpdate();

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Refresh Functionality', () => {
    it('should provide a refresh function', () => {
      const { result } = renderHook(() => useCheckMappedAccount());

      expect(typeof result.current.refresh).toBe('function');
    });

    it('should trigger new query when refresh is called', async () => {
      mockClient.query.revive.originalAccount.mockResolvedValue(true);

      const { result } = renderHook(() => useCheckMappedAccount());

      await waitForNextUpdate();

      // Clear previous calls
      mockClient.query.revive.originalAccount.mockClear();

      // Change the mock response
      mockClient.query.revive.originalAccount.mockResolvedValue(false);

      // Call refresh
      await act(async () => {
        await result.current.refresh();
      });

      expect(mockClient.query.revive.originalAccount).toHaveBeenCalledTimes(1);
      expect(result.current.isMapped).toBe(false);
    });

    it('should handle errors in refresh', async () => {
      const { result } = renderHook(() => useCheckMappedAccount());

      await waitForNextUpdate();

      // Mock error for refresh
      const refreshError = new Error('Refresh failed');
      mockClient.query.revive.originalAccount.mockRejectedValue(refreshError);

      await act(async () => {
        await result.current.refresh();
      });

      expect(result.current.error).toBe(refreshError);
      expect(result.current.isMapped).toBeUndefined();
    });
  });

  describe('EVM Address Conversion', () => {
    it('should correctly convert Substrate address to EVM address', async () => {
      const { result } = renderHook(() => useCheckMappedAccount(testAddress));

      await waitForNextUpdate();

      expect(toEvmAddress).toHaveBeenCalledWith(testAddress);
      expect(result.current.evmAddress).toBe(evmAddress);
    });

    it('should set evmAddress even when query fails', async () => {
      mockClient.query.revive.originalAccount.mockRejectedValue(new Error('Query failed'));

      const { result } = renderHook(() => useCheckMappedAccount());

      await waitForNextUpdate();

      expect(result.current.evmAddress).toBe(evmAddress);
    });
  });
});
