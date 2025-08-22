import { renderHook, waitFor } from '@testing-library/react';
import { useWatchContractEvent } from '../useWatchContractEvent.js';
import { useTypink } from '../useTypink.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ContractEvent } from 'dedot/contracts';
import { Contract } from 'dedot/contracts';
// @ts-ignore - JSON import in test environment
import { Psp22ContractApi } from '../psp22/contracts/psp22';
import { useClient, useTypinkEvents } from '../../providers/index.js';
import { typinkEventsWrapper, waitForNextUpdate } from './test-utils.js';

vi.mock('../useTypink', () => ({
  useTypink: vi.fn(),
}));

vi.mock('../../providers/ClientProvider.js', () => ({
  useClient: vi.fn(),
}));

describe('useWatchContractEvent', () => {
  const mockClient = {
    query: {
      system: {
        events: vi.fn(),
      },
    },
  };

  const mockSub = vi.fn();

  const mockContract = {
    events: {
      Transfer: {
        filter: (events: ContractEvent[]) => events.filter((event) => event.name === 'Transfer'),
      },
    },
  } as any as Contract<Psp22ContractApi>;

  beforeEach(() => {
    vi.mocked(useClient).mockReturnValue({
      client: mockClient,
    } as any);

    vi.mocked(useTypink).mockReturnValue({
      client: mockClient,
      subscribeToEvent: mockSub,
    } as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should successfully subscribe to the system events when all parameters are valid', async () => {
    const { rerender } = renderHook(
      // @ts-ignore - Event name type issues in test
      ({ enabled }) => useWatchContractEvent(mockContract, 'Transfer', vi.fn(), enabled),
      { initialProps: { enabled: true } },
    );

    expect(mockSub).toHaveBeenCalledTimes(1);

    rerender({ enabled: false });
    expect(mockSub).toHaveBeenCalledTimes(1);

    rerender({ enabled: true });
    expect(mockSub).toHaveBeenCalledTimes(2);
  });

  it('should call the callback function when new events are detected', async () => {
    const mockApprovalEvent = {
      name: 'Approval',
      data: {},
    };

    const mockTransferEvent = {
      name: 'Transfer',
      data: {},
    };

    mockClient.query.system.events.mockImplementation((callback) => {
      return new Promise((resolve) => {
        setTimeout(() => {
          callback([mockTransferEvent]);
          setTimeout(() => {
            callback([mockTransferEvent]);
            callback([mockApprovalEvent]);
          }, 50);
        }, 100);

        resolve(() => {});
      });
    });

    const { result } = renderHook(() => useTypinkEvents(), { wrapper: typinkEventsWrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    mockSub.mockImplementation(result.current.subscribeToEvent);

    const mockCallback = vi.fn();
    // @ts-ignore - Event name type issues in test
    renderHook(() => useWatchContractEvent(mockContract, 'Transfer', mockCallback));

    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(mockCallback).toHaveBeenCalledTimes(2);
    });
  });

  it('should unsubscribe when component unmounts', async () => {
    const mockUnsub = vi.fn();

    mockSub.mockReturnValue(mockUnsub);

    // @ts-ignore - Event name type issues in test
    const { unmount } = renderHook(() => useWatchContractEvent(mockContract, 'Transfer', vi.fn()));

    // Wait for unsub to be set
    await waitForNextUpdate();

    unmount();

    expect(mockUnsub).toHaveBeenCalled();
  });
});
