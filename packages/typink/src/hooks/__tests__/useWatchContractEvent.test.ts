import { renderHook } from '@testing-library/react-hooks';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWatchContractEvent } from '../useWatchContractEvent.js';
import { useTypink } from '../useTypink.js';
import { Contract } from 'dedot/contracts';
import { Psp22ContractApi } from '../psp22/contracts/psp22';
import { waitForNextUpdate } from './test-utils.js';

vi.mock('../useTypink', () => ({
  useTypink: vi.fn(),
}));

describe('useWatchContractEvent', () => {
  const client = {
    query: {
      system: {
        events: vi.fn(),
      },
    },
  };

  const contract: Contract<Psp22ContractApi> = {
    events: {
      Transfer: {
        filter: vi.fn(),
      },
    },
  } as unknown as Contract<any>;

  const mockUseTypink = {
    client,
  };

  beforeEach(() => {
    vi.mocked(useTypink).mockReturnValue(mockUseTypink as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should not call system.events if client is not defined', () => {
    vi.mocked(useTypink).mockReturnValue({ client: undefined } as any);

    renderHook(() => useWatchContractEvent(contract, 'Transfer', vi.fn()));

    expect(client.query.system.events).not.toHaveBeenCalled();
  });

  it('should not call system.events if contract is not defined', () => {
    renderHook(() =>
      // @ts-ignore
      useWatchContractEvent(undefined, 'Transfer', vi.fn()),
    );

    expect(client.query.system.events).not.toHaveBeenCalled();
  });

  it('should not call system.events if enabled is false', () => {
    renderHook(() => useWatchContractEvent(contract, 'Transfer', vi.fn(), false));

    expect(client.query.system.events).not.toHaveBeenCalled();
  });

  it('should call system.events if all conditions are met', async () => {
    const onNewEvent = vi.fn();
    const events = [{ data: { from: 'address1', to: 'address2' } }];

    // @ts-ignore
    vi.mocked(contract.events.Transfer.filter).mockReturnValue(events);
    vi.mocked(client.query.system.events).mockImplementation((callback) => {
      callback(events);
    });

    renderHook(() => useWatchContractEvent(contract, 'Transfer', onNewEvent));

    expect(client.query.system.events).toHaveBeenCalled();
    expect(contract.events.Transfer.filter).toHaveBeenCalledWith(events);
    expect(onNewEvent).toHaveBeenCalledWith(events);
  });

  it('should unsubscribe when component unmounts', async () => {
    const unsub = vi.fn();

    vi.mocked(client.query.system.events).mockResolvedValue(unsub);
    const { unmount } = renderHook(() => useWatchContractEvent(contract, 'Transfer', vi.fn()));

    // Wait for unsub to be set
    await waitForNextUpdate();

    unmount();

    expect(unsub).toHaveBeenCalled();
  });
});
