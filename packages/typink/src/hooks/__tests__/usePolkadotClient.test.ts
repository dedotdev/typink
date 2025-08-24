import { renderHook } from '@testing-library/react';
import { usePolkadotClient } from '../usePolkadotClient.js';
import { useTypink } from '../useTypink.js';
import { ClientConnectionStatus } from '../../types.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../useTypink', () => ({
  useTypink: vi.fn(),
}));

describe('usePolkadotClient', () => {
  const mockClient = {} as any;
  const mockNetworks = [
    { id: 'polkadot', name: 'Polkadot' },
    { id: 'kusama', name: 'Kusama' },
    { id: 'westend', name: 'Westend' },
  ];
  const mockConnectionStatus = new Map([
    ['polkadot', ClientConnectionStatus.Connected],
    ['kusama', ClientConnectionStatus.Connecting],
    ['westend', ClientConnectionStatus.Error],
  ]);
  const mockGetClient = vi.fn();

  const defaultMockTypink = {
    getClient: mockGetClient,
    networks: mockNetworks,
    connectionStatus: mockConnectionStatus,
  };

  beforeEach(() => {
    vi.mocked(useTypink).mockReturnValue(defaultMockTypink as any);
    mockGetClient.mockReturnValue(mockClient);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Primary client (no networkId provided)', () => {
    it('should return first network when no networkId is specified', () => {
      // Set up the connection status for the first network (empty string key for primary client)
      const mockConnectionStatusForPrimary = new Map([
        ['', ClientConnectionStatus.Connected], // Empty string key for primary client
        ['polkadot', ClientConnectionStatus.Connected],
        ['kusama', ClientConnectionStatus.Connecting],
        ['westend', ClientConnectionStatus.Error],
      ]);
      
      vi.mocked(useTypink).mockReturnValue({
        ...defaultMockTypink,
        connectionStatus: mockConnectionStatusForPrimary,
      } as any);

      const { result } = renderHook(() => usePolkadotClient());

      expect(result.current.network).toEqual(mockNetworks[0]);
      expect(result.current.client).toBe(mockClient);
      expect(result.current.status).toBe(ClientConnectionStatus.Connected);
      expect(mockGetClient).toHaveBeenCalledWith(undefined);
    });

    it('should return NotConnected status for primary client when not in connection map', () => {
      const mockConnectionStatusEmpty = new Map();
      vi.mocked(useTypink).mockReturnValue({
        ...defaultMockTypink,
        connectionStatus: mockConnectionStatusEmpty,
      } as any);

      const { result } = renderHook(() => usePolkadotClient());

      expect(result.current.status).toBe(ClientConnectionStatus.NotConnected);
    });
  });

  describe('Specific network client', () => {
    it('should return correct client and network for specified networkId', () => {
      const { result } = renderHook(() => usePolkadotClient('kusama'));

      expect(result.current.network).toEqual(mockNetworks[1]);
      expect(result.current.client).toBe(mockClient);
      expect(result.current.status).toBe(ClientConnectionStatus.Connecting);
      expect(mockGetClient).toHaveBeenCalledWith('kusama');
    });

    it('should return Error status for network with error', () => {
      const { result } = renderHook(() => usePolkadotClient('westend'));

      expect(result.current.network).toEqual(mockNetworks[2]);
      expect(result.current.status).toBe(ClientConnectionStatus.Error);
    });

    it('should use empty string as fallback key for connection status', () => {
      // Test that when a networkId exists but has no connection status, it falls back to NotConnected
      const mockConnectionStatusPartial = new Map([
        ['polkadot', ClientConnectionStatus.Connected],
        // kusama is missing from the map
      ]);
      
      vi.mocked(useTypink).mockReturnValue({
        ...defaultMockTypink,
        connectionStatus: mockConnectionStatusPartial,
      } as any);

      const { result } = renderHook(() => usePolkadotClient('kusama'));

      expect(result.current.network).toEqual(mockNetworks[1]);
      expect(result.current.status).toBe(ClientConnectionStatus.NotConnected);
    });
  });

  describe('Client availability', () => {
    it('should handle undefined client', () => {
      mockGetClient.mockReturnValue(undefined);

      const { result } = renderHook(() => usePolkadotClient('polkadot'));

      expect(result.current.client).toBeUndefined();
      expect(result.current.network).toEqual(mockNetworks[0]);
      expect(result.current.status).toBe(ClientConnectionStatus.Connected);
    });
  });

  describe('Network not found', () => {
    it('should throw assertion error when network is not found', () => {
      expect(() => {
        renderHook(() => usePolkadotClient('non-existent-network'));
      }).toThrow('Network not found with id non-existent-network');
    });
  });

  describe('Reactive updates', () => {
    it('should update when networks change', () => {
      const { result, rerender } = renderHook((props) => usePolkadotClient(props.networkId), {
        initialProps: { networkId: 'polkadot' },
      });

      expect(result.current.network).toEqual(mockNetworks[0]);

      const newNetworks = [
        { id: 'polkadot', name: 'Polkadot Updated' },
        { id: 'kusama', name: 'Kusama' },
      ];

      vi.mocked(useTypink).mockReturnValue({
        ...defaultMockTypink,
        networks: newNetworks,
      } as any);

      rerender({ networkId: 'polkadot' });

      expect(result.current.network).toEqual(newNetworks[0]);
    });

    it('should update when connection status changes', () => {
      const { result, rerender } = renderHook(() => usePolkadotClient('polkadot'));

      expect(result.current.status).toBe(ClientConnectionStatus.Connected);

      const updatedConnectionStatus = new Map([
        ['polkadot', ClientConnectionStatus.Error],
        ['kusama', ClientConnectionStatus.Connected],
      ]);

      vi.mocked(useTypink).mockReturnValue({
        ...defaultMockTypink,
        connectionStatus: updatedConnectionStatus,
      } as any);

      rerender();

      expect(result.current.status).toBe(ClientConnectionStatus.Error);
    });

    it('should update when networkId changes', () => {
      const { result, rerender } = renderHook((props) => usePolkadotClient(props.networkId), {
        initialProps: { networkId: 'polkadot' },
      });

      expect(result.current.network).toEqual(mockNetworks[0]);
      expect(result.current.status).toBe(ClientConnectionStatus.Connected);

      rerender({ networkId: 'kusama' });

      expect(result.current.network).toEqual(mockNetworks[1]);
      expect(result.current.status).toBe(ClientConnectionStatus.Connecting);
      expect(mockGetClient).toHaveBeenLastCalledWith('kusama');
    });
  });

  describe('useMemo optimization', () => {
    it('should memoize client result', () => {
      const { rerender } = renderHook(() => usePolkadotClient('polkadot'));

      const callCount = mockGetClient.mock.calls.length;

      // Rerender without changing dependencies
      rerender();

      // getClient should not be called again due to memoization
      expect(mockGetClient.mock.calls.length).toBe(callCount);
    });

    it('should recalculate when getClient reference changes', () => {
      const { rerender } = renderHook(() => usePolkadotClient('polkadot'));

      const initialCallCount = mockGetClient.mock.calls.length;

      const newGetClient = vi.fn().mockReturnValue(mockClient);
      vi.mocked(useTypink).mockReturnValue({
        ...defaultMockTypink,
        getClient: newGetClient,
      } as any);

      rerender();

      expect(newGetClient).toHaveBeenCalledWith('polkadot');
    });
  });

  describe('Empty network list', () => {
    it('should handle empty networks array for primary client', () => {
      vi.mocked(useTypink).mockReturnValue({
        ...defaultMockTypink,
        networks: [],
      } as any);

      expect(() => {
        renderHook(() => usePolkadotClient());
      }).toThrow('Network not found with id undefined');
    });
  });
});