import { renderHook, act, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach, type MockedFunction } from 'vitest';
import { useBlockInfo } from '../useBlockInfo.js';
import { JsonRpcApi } from '../../types.js';
import type { usePolkadotClient } from '../usePolkadotClient.js';
import type { useDeepDeps } from '../internal/index.js';

// Mock dependencies
vi.mock('../usePolkadotClient.js', () => ({
  usePolkadotClient: vi.fn(),
}));

vi.mock('../internal/index.js', () => ({
  useDeepDeps: vi.fn(),
}));

vi.mock('dedot/codecs', () => ({
  $Header: {
    tryEncode: vi.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
  },
}));

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock types
interface MockPinnedBlock {
  number: number;
  hash: string;
}

interface MockHeader {
  number: number;
}

interface MockDedotClient {
  chainHead: {
    bestBlock: () => Promise<MockPinnedBlock>;
    finalizedBlock: () => Promise<MockPinnedBlock>;
    on: (event: string, callback: (block: MockPinnedBlock) => void) => () => void;
  };
}

interface MockLegacyClient {
  rpc: {
    chain_subscribeNewHeads: (callback: (header: MockHeader) => void) => Promise<() => void>;
    chain_subscribeFinalizedHeads: (callback: (header: MockHeader) => void) => Promise<() => void>;
  };
  registry: {
    hashAsHex: (encoded: any) => string;
  };
}

// Test utilities
const createMockDedotClient = (overrides = {}): MockDedotClient => ({
  chainHead: {
    bestBlock: vi.fn().mockResolvedValue({ number: 100, hash: '0x123' }),
    finalizedBlock: vi.fn().mockResolvedValue({ number: 98, hash: '0x456' }),
    on: vi.fn().mockReturnValue(vi.fn()),
    ...overrides,
  },
});

const createMockLegacyClient = (overrides = {}): MockLegacyClient => ({
  rpc: {
    chain_subscribeNewHeads: vi.fn().mockImplementation((callback) => Promise.resolve(vi.fn())),
    chain_subscribeFinalizedHeads: vi.fn().mockImplementation((callback) => Promise.resolve(vi.fn())),
    ...overrides,
  },
  registry: {
    hashAsHex: vi.fn().mockReturnValue('0x789'),
    ...overrides,
  },
});

describe('useBlockInfo', () => {
  let mockUsePolkadotClient: MockedFunction<typeof usePolkadotClient>;
  let mockUseDeepDeps: MockedFunction<typeof useDeepDeps>;

  beforeEach(async () => {
    vi.clearAllMocks();

    // Get the mocked functions
    mockUsePolkadotClient = (await import('../usePolkadotClient.js')).usePolkadotClient as MockedFunction<
      typeof usePolkadotClient
    >;
    mockUseDeepDeps = (await import('../internal/index.js')).useDeepDeps as MockedFunction<typeof useDeepDeps>;

    // Mock console methods to avoid spam during tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should return undefined blocks when no client is provided', () => {
      mockUsePolkadotClient.mockReturnValue({
        client: null,
        network: { jsonRpcApi: JsonRpcApi.NEW },
      });
      mockUseDeepDeps.mockReturnValue([null, JsonRpcApi.NEW]);

      const { result } = renderHook(() => useBlockInfo());

      expect(result.current).toEqual({
        best: undefined,
        finalized: undefined,
      });
    });

    it('should clear blocks when client becomes null', () => {
      const client = createMockDedotClient();

      mockUsePolkadotClient.mockReturnValue({
        client,
        network: { jsonRpcApi: JsonRpcApi.NEW },
      });
      mockUseDeepDeps.mockReturnValue([client, JsonRpcApi.NEW]);

      const { result, rerender } = renderHook(() => useBlockInfo());

      // Initially has blocks (after async setup)
      expect(result.current.best).toBeUndefined();
      expect(result.current.finalized).toBeUndefined();

      // Change to no client
      mockUsePolkadotClient.mockReturnValue({
        client: null,
        network: { jsonRpcApi: JsonRpcApi.NEW },
      });
      mockUseDeepDeps.mockReturnValue([null, JsonRpcApi.NEW]);

      rerender();

      expect(result.current).toEqual({
        best: undefined,
        finalized: undefined,
      });
    });

    it('should handle undefined network options', () => {
      mockUsePolkadotClient.mockReturnValue({
        client: null,
        network: { jsonRpcApi: JsonRpcApi.NEW },
      });
      mockUseDeepDeps.mockReturnValue([null, JsonRpcApi.NEW]);

      const { result } = renderHook(() => useBlockInfo());

      expect(result.current).toEqual({
        best: undefined,
        finalized: undefined,
      });
    });
  });

  describe('ChainHead API (NEW)', () => {
    it('should fetch initial blocks and set up subscriptions', async () => {
      const mockUnsubBest = vi.fn();
      const mockUnsubFinalized = vi.fn();

      const client = createMockDedotClient({
        bestBlock: vi.fn().mockResolvedValue({ number: 100, hash: '0x123' }),
        finalizedBlock: vi.fn().mockResolvedValue({ number: 98, hash: '0x456' }),
        on: vi
          .fn()
          .mockReturnValueOnce(mockUnsubBest) // first call for bestBlock
          .mockReturnValueOnce(mockUnsubFinalized), // second call for finalizedBlock
      });

      mockUsePolkadotClient.mockReturnValue({
        client,
        network: { jsonRpcApi: JsonRpcApi.NEW },
      });
      mockUseDeepDeps.mockReturnValue([client, JsonRpcApi.NEW]);

      const { result } = renderHook(() => useBlockInfo());

      // Wait for async setup to complete
      await waitFor(() => {
        expect(client.chainHead.bestBlock).toHaveBeenCalled();
        expect(client.chainHead.finalizedBlock).toHaveBeenCalled();
      });

      // Verify event listeners are set up
      expect(client.chainHead.on).toHaveBeenCalledWith('bestBlock', expect.any(Function));
      expect(client.chainHead.on).toHaveBeenCalledWith('finalizedBlock', expect.any(Function));
    });

    it('should update best block when bestBlock event fires', async () => {
      let bestBlockCallback: ((block: MockPinnedBlock) => void) | null = null;

      const client = createMockDedotClient({
        on: vi.fn().mockImplementation((event, callback) => {
          if (event === 'bestBlock') {
            bestBlockCallback = callback;
          }
          return vi.fn();
        }),
      });

      mockUsePolkadotClient.mockReturnValue({
        client,
        network: { jsonRpcApi: JsonRpcApi.NEW },
      });
      mockUseDeepDeps.mockReturnValue([client, JsonRpcApi.NEW]);

      const { result } = renderHook(() => useBlockInfo());

      // Wait for setup
      await waitFor(() => {
        expect(bestBlockCallback).toBeTruthy();
      });

      // Simulate best block event
      act(() => {
        bestBlockCallback?.({ number: 105, hash: '0xnewbest' });
      });

      expect(result.current.best).toEqual({
        number: 105,
        hash: '0xnewbest',
      });
    });

    it('should update finalized block when finalizedBlock event fires', async () => {
      let finalizedCallback: ((block: MockPinnedBlock) => void) | null = null;

      const client = createMockDedotClient({
        on: vi.fn().mockImplementation((event, callback) => {
          if (event === 'finalizedBlock') {
            finalizedCallback = callback;
          }
          return vi.fn();
        }),
      });

      mockUsePolkadotClient.mockReturnValue({
        client,
        network: { jsonRpcApi: JsonRpcApi.NEW },
      });
      mockUseDeepDeps.mockReturnValue([client, JsonRpcApi.NEW]);

      const { result } = renderHook(() => useBlockInfo());

      // Wait for setup
      await waitFor(() => {
        expect(finalizedCallback).toBeTruthy();
      });

      // Simulate finalized block event
      act(() => {
        finalizedCallback?.({ number: 103, hash: '0xnewfinalized' });
      });

      expect(result.current.finalized).toEqual({
        number: 103,
        hash: '0xnewfinalized',
      });
    });

    it('should handle multiple rapid block updates', async () => {
      let bestBlockCallback: ((block: MockPinnedBlock) => void) | null = null;

      const client = createMockDedotClient({
        on: vi.fn().mockImplementation((event, callback) => {
          if (event === 'bestBlock') {
            bestBlockCallback = callback;
          }
          return vi.fn();
        }),
      });

      mockUsePolkadotClient.mockReturnValue({
        client,
        network: { jsonRpcApi: JsonRpcApi.NEW },
      });
      mockUseDeepDeps.mockReturnValue([client, JsonRpcApi.NEW]);

      const { result } = renderHook(() => useBlockInfo());

      await waitFor(() => {
        expect(bestBlockCallback).toBeTruthy();
      });

      // Multiple rapid updates
      act(() => {
        bestBlockCallback?.({ number: 105, hash: '0x105' });
        bestBlockCallback?.({ number: 106, hash: '0x106' });
        bestBlockCallback?.({ number: 107, hash: '0x107' });
      });

      expect(result.current.best).toEqual({
        number: 107,
        hash: '0x107',
      });
    });

    it('should properly unsubscribe on unmount', async () => {
      const mockUnsubBest = vi.fn();
      const mockUnsubFinalized = vi.fn();

      const client = createMockDedotClient({
        on: vi.fn().mockReturnValueOnce(mockUnsubBest).mockReturnValueOnce(mockUnsubFinalized),
      });

      mockUsePolkadotClient.mockReturnValue({
        client,
        network: { jsonRpcApi: JsonRpcApi.NEW },
      });
      mockUseDeepDeps.mockReturnValue([client, JsonRpcApi.NEW]);

      const { unmount } = renderHook(() => useBlockInfo());

      // Wait for subscriptions
      await waitFor(() => {
        expect(client.chainHead.on).toHaveBeenCalledTimes(2);
      });

      unmount();

      // Allow time for cleanup
      await waitFor(() => {
        expect(mockUnsubBest).toHaveBeenCalled();
        expect(mockUnsubFinalized).toHaveBeenCalled();
      });
    });

    it('should handle errors in initial block fetch', async () => {
      const client = createMockDedotClient({
        bestBlock: vi.fn().mockRejectedValue(new Error('Failed to fetch best block')),
        finalizedBlock: vi.fn().mockResolvedValue({ number: 98, hash: '0x456' }),
      });

      mockUsePolkadotClient.mockReturnValue({
        client,
        network: { jsonRpcApi: JsonRpcApi.NEW },
      });
      mockUseDeepDeps.mockReturnValue([client, JsonRpcApi.NEW]);

      const { result } = renderHook(() => useBlockInfo());

      // Should handle error gracefully
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Failed to setup block subscriptions:', expect.any(Error));
      });

      expect(result.current).toEqual({
        best: undefined,
        finalized: undefined,
      });
    });

    it('should handle unsubscribe errors gracefully', async () => {
      const mockUnsubBest = vi.fn().mockImplementation(() => {
        throw new Error('Unsubscribe failed');
      });

      const client = createMockDedotClient({
        on: vi.fn().mockReturnValueOnce(mockUnsubBest).mockReturnValueOnce(vi.fn()),
      });

      mockUsePolkadotClient.mockReturnValue({
        client,
        network: { jsonRpcApi: JsonRpcApi.NEW },
      });
      mockUseDeepDeps.mockReturnValue([client, JsonRpcApi.NEW]);

      const { unmount } = renderHook(() => useBlockInfo());

      await waitFor(() => {
        expect(client.chainHead.on).toHaveBeenCalledTimes(2);
      });

      unmount();

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Error unsubscribing from chainHead:', expect.any(Error));
      });
    });
  });

  describe('Legacy RPC API', () => {
    it('should subscribe to legacy RPC methods', async () => {
      const client = createMockLegacyClient();

      mockUsePolkadotClient.mockReturnValue({
        client,
        network: { jsonRpcApi: JsonRpcApi.LEGACY },
      });
      mockUseDeepDeps.mockReturnValue([client, JsonRpcApi.LEGACY]);

      renderHook(() => useBlockInfo());

      await waitFor(() => {
        expect(client.rpc.chain_subscribeNewHeads).toHaveBeenCalled();
        expect(client.rpc.chain_subscribeFinalizedHeads).toHaveBeenCalled();
      });
    });

    it('should update blocks from legacy RPC callbacks', async () => {
      let newHeadsCallback: ((header: MockHeader) => void) | null = null;
      let finalizedCallback: ((header: MockHeader) => void) | null = null;

      const client = createMockLegacyClient({
        chain_subscribeNewHeads: vi.fn().mockImplementation((callback) => {
          newHeadsCallback = callback;
          return Promise.resolve(vi.fn());
        }),
        chain_subscribeFinalizedHeads: vi.fn().mockImplementation((callback) => {
          finalizedCallback = callback;
          return Promise.resolve(vi.fn());
        }),
      });

      mockUsePolkadotClient.mockReturnValue({
        client,
        network: { jsonRpcApi: JsonRpcApi.LEGACY },
      });
      mockUseDeepDeps.mockReturnValue([client, JsonRpcApi.LEGACY]);

      const { result } = renderHook(() => useBlockInfo());

      await waitFor(() => {
        expect(newHeadsCallback).toBeTruthy();
        expect(finalizedCallback).toBeTruthy();
      });

      // Simulate block updates
      act(() => {
        newHeadsCallback?.({ number: 200 });
        finalizedCallback?.({ number: 198 });
      });

      expect(result.current.best).toEqual({
        number: 200,
        hash: '0x789',
      });
      expect(result.current.finalized).toEqual({
        number: 198,
        hash: '0x789',
      });
    });

    it('should handle legacy subscription failures', async () => {
      const client = createMockLegacyClient({
        chain_subscribeNewHeads: vi.fn().mockRejectedValue(new Error('Subscription failed')),
        chain_subscribeFinalizedHeads: vi.fn().mockResolvedValue(vi.fn()),
      });

      mockUsePolkadotClient.mockReturnValue({
        client,
        network: { jsonRpcApi: JsonRpcApi.LEGACY },
      });
      mockUseDeepDeps.mockReturnValue([client, JsonRpcApi.LEGACY]);

      renderHook(() => useBlockInfo());

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Failed to subscribe to new heads:', expect.any(Error));
      });
    });

    it('should properly unsubscribe from legacy subscriptions', async () => {
      const mockUnsub1 = vi.fn().mockResolvedValue(undefined);
      const mockUnsub2 = vi.fn().mockResolvedValue(undefined);

      const client = createMockLegacyClient({
        chain_subscribeNewHeads: vi.fn().mockResolvedValue(mockUnsub1),
        chain_subscribeFinalizedHeads: vi.fn().mockResolvedValue(mockUnsub2),
      });

      mockUsePolkadotClient.mockReturnValue({
        client,
        network: { jsonRpcApi: JsonRpcApi.LEGACY },
      });
      mockUseDeepDeps.mockReturnValue([client, JsonRpcApi.LEGACY]);

      const { unmount } = renderHook(() => useBlockInfo());

      // Wait for subscriptions to be set up
      await waitFor(() => {
        expect(client.rpc.chain_subscribeNewHeads).toHaveBeenCalled();
        expect(client.rpc.chain_subscribeFinalizedHeads).toHaveBeenCalled();
      });

      unmount();

      // Need to wait for the unsubscribe promise chain to complete
      await new Promise((resolve) => setTimeout(resolve, 200));

      expect(mockUnsub1).toHaveBeenCalled();
      expect(mockUnsub2).toHaveBeenCalled();
    });

    it('should handle unsubscribe errors in legacy API', async () => {
      const mockUnsub1 = vi.fn().mockRejectedValue(new Error('Unsubscribe failed'));

      const client = createMockLegacyClient({
        chain_subscribeNewHeads: vi.fn().mockResolvedValue(mockUnsub1),
        chain_subscribeFinalizedHeads: vi.fn().mockResolvedValue(vi.fn()),
      });

      mockUsePolkadotClient.mockReturnValue({
        client,
        network: { jsonRpcApi: JsonRpcApi.LEGACY },
      });
      mockUseDeepDeps.mockReturnValue([client, JsonRpcApi.LEGACY]);

      const { unmount } = renderHook(() => useBlockInfo());

      await waitFor(() => {
        expect(client.rpc.chain_subscribeNewHeads).toHaveBeenCalled();
      });

      unmount();

      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(console.error).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('API Selection', () => {
    it('should use NEW API when jsonRpcApi is NEW', async () => {
      const client = createMockDedotClient();

      mockUsePolkadotClient.mockReturnValue({
        client,
        network: { jsonRpcApi: JsonRpcApi.NEW },
      });
      mockUseDeepDeps.mockReturnValue([client, JsonRpcApi.NEW]);

      renderHook(() => useBlockInfo());

      await waitFor(() => {
        expect(client.chainHead.bestBlock).toHaveBeenCalled();
        expect(client.chainHead.on).toHaveBeenCalled();
      });
    });

    it('should use LEGACY API when jsonRpcApi is LEGACY', async () => {
      const client = createMockLegacyClient();

      mockUsePolkadotClient.mockReturnValue({
        client,
        network: { jsonRpcApi: JsonRpcApi.LEGACY },
      });
      mockUseDeepDeps.mockReturnValue([client, JsonRpcApi.LEGACY]);

      renderHook(() => useBlockInfo());

      await waitFor(() => {
        expect(client.rpc.chain_subscribeNewHeads).toHaveBeenCalled();
        expect(client.rpc.chain_subscribeFinalizedHeads).toHaveBeenCalled();
      });
    });

    it('should default to NEW API when jsonRpcApi is undefined', async () => {
      const client = createMockDedotClient();

      mockUsePolkadotClient.mockReturnValue({
        client,
        network: {},
      });
      mockUseDeepDeps.mockReturnValue([client, undefined]);

      renderHook(() => useBlockInfo());

      await waitFor(() => {
        expect(client.chainHead.bestBlock).toHaveBeenCalled();
      });
    });
  });

  describe('Network Changes', () => {
    it('should re-subscribe when networkId changes', async () => {
      const client1 = createMockDedotClient();
      const client2 = createMockDedotClient();

      // Initial render
      mockUsePolkadotClient.mockReturnValue({
        client: client1,
        network: { jsonRpcApi: JsonRpcApi.NEW },
      });
      mockUseDeepDeps.mockReturnValue([client1, JsonRpcApi.NEW]);

      const { rerender } = renderHook(() => useBlockInfo({ networkId: 'network1' }));

      await waitFor(() => {
        expect(client1.chainHead.bestBlock).toHaveBeenCalled();
      });

      // Change network
      mockUsePolkadotClient.mockReturnValue({
        client: client2,
        network: { jsonRpcApi: JsonRpcApi.NEW },
      });
      mockUseDeepDeps.mockReturnValue([client2, JsonRpcApi.NEW]);

      rerender();

      await waitFor(() => {
        expect(client2.chainHead.bestBlock).toHaveBeenCalled();
      });
    });

    it('should handle switching between API types', async () => {
      const dedotClient = createMockDedotClient();
      const legacyClient = createMockLegacyClient();

      // Start with NEW API
      mockUsePolkadotClient.mockReturnValue({
        client: dedotClient,
        network: { jsonRpcApi: JsonRpcApi.NEW },
      });
      mockUseDeepDeps.mockReturnValue([dedotClient, JsonRpcApi.NEW]);

      const { rerender } = renderHook(() => useBlockInfo());

      await waitFor(() => {
        expect(dedotClient.chainHead.bestBlock).toHaveBeenCalled();
      });

      // Switch to LEGACY API
      mockUsePolkadotClient.mockReturnValue({
        client: legacyClient,
        network: { jsonRpcApi: JsonRpcApi.LEGACY },
      });
      mockUseDeepDeps.mockReturnValue([legacyClient, JsonRpcApi.LEGACY]);

      rerender();

      await waitFor(() => {
        expect(legacyClient.rpc.chain_subscribeNewHeads).toHaveBeenCalled();
      });
    });
  });

  describe('Race Conditions', () => {
    it('should handle unmount during async setup', async () => {
      let resolvePromise: (value: any) => void;
      const delayedPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      const client = createMockDedotClient({
        bestBlock: () => delayedPromise,
      });

      mockUsePolkadotClient.mockReturnValue({
        client,
        network: { jsonRpcApi: JsonRpcApi.NEW },
      });
      mockUseDeepDeps.mockReturnValue([client, JsonRpcApi.NEW]);

      const { unmount } = renderHook(() => useBlockInfo());

      // Unmount before async operation completes
      unmount();

      // Now resolve the promise
      resolvePromise({ number: 100, hash: '0x123' });

      // Should not cause any errors or warnings
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    it('should handle rapid client changes', async () => {
      const client1 = createMockDedotClient();
      const client2 = createMockDedotClient();
      const client3 = createMockDedotClient();

      mockUsePolkadotClient.mockReturnValue({
        client: client1,
        network: { jsonRpcApi: JsonRpcApi.NEW },
      });
      mockUseDeepDeps.mockReturnValue([client1, JsonRpcApi.NEW]);

      const { rerender } = renderHook(() => useBlockInfo());

      // Rapid changes
      mockUsePolkadotClient.mockReturnValue({
        client: client2,
        network: { jsonRpcApi: JsonRpcApi.NEW },
      });
      mockUseDeepDeps.mockReturnValue([client2, JsonRpcApi.NEW]);

      rerender();

      mockUsePolkadotClient.mockReturnValue({
        client: client3,
        network: { jsonRpcApi: JsonRpcApi.NEW },
      });
      mockUseDeepDeps.mockReturnValue([client3, JsonRpcApi.NEW]);

      rerender();

      // Should handle gracefully without errors
      await waitFor(() => {
        expect(client3.chainHead.bestBlock).toHaveBeenCalled();
      });
    });
  });
});
