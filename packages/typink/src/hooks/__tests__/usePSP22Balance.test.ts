import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePSP22Balance } from '../psp22/index.js';
import { useTypink } from '../useTypink.js';
import { useRawContract } from '../useRawContract.js';
import { useContractQuery } from '../useContractQuery.js';
import { useWatchContractEvent } from '../useWatchContractEvent.js';
import { renderHook, waitFor } from '@testing-library/react';
import { waitForNextUpdate } from './test-utils.js';

vi.mock('../useTypink');
vi.mock('../useWatchContractEvent');
vi.mock('../useContractQuery');
vi.mock('../useRawContract');

describe('usePSP22Balance', () => {
  const mockClient = {
    query: {
      system: {
        events: vi.fn(),
      },
    },
  };

  const mockDeployment = {
    id: 'test-contract',
    network: 'test-network',
    metadata: {},
    address: 'test-address',
  };

  const mockConnectedAccount = { address: 'connected-account-address' };
  const mockDefaultCaller = 'default-caller-address';

  const mockUseTypink = {
    deployments: [mockDeployment],
    client: mockClient,
    networkId: 'test-network',
    connectedAccount: mockConnectedAccount,
    defaultCaller: mockDefaultCaller,
  };

  const mockContract = {
    contract: {
      query: {
        psp22BalanceOf: vi.fn().mockResolvedValue({ data: 100n }),
      },
    },
  };

  beforeEach(() => {
    vi.mocked(useTypink).mockReturnValue(mockUseTypink as any);
    vi.mocked(useRawContract).mockImplementation((metadata, address) => {
      if (metadata && address) {
        return mockContract as any;
      } else {
        return { contract: undefined };
      }
    });
    vi.mocked(useContractQuery).mockImplementation(({ contract }) => {
      if (contract) {
        return { data: 100n, refresh: vi.fn() } as any;
      } else {
        return { data: undefined, refresh: vi.fn() } as any;
      }
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch balance correctly when given a valid address', async () => {
    const { result } = renderHook(() =>
      usePSP22Balance({ contractAddress: mockDeployment.address, address: 'valid-address' }),
    );

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(result.current.data).toBe(100n);
    expect(useContractQuery).toHaveBeenCalledWith({
      contract: mockContract.contract,
      fn: 'psp22BalanceOf',
      args: ['valid-address'],
    });
  });

  it('should not run query when no address is provided', async () => {
    const { result } = renderHook(() => usePSP22Balance({ contractAddress: mockDeployment.address }));

    await waitForNextUpdate();
    expect(result.current.data).toBeUndefined();
    expect(useContractQuery).toHaveBeenCalledWith({ contact: undefined, fn: 'psp22BalanceOf', args: [''] });
  });

  it('should watch for Transfer events when watch is true', async () => {
    renderHook(() =>
      usePSP22Balance({ contractAddress: mockDeployment.address, address: 'valid-address', watch: true }),
    );

    await waitForNextUpdate();
    expect(useWatchContractEvent).toHaveBeenCalledWith(mockContract.contract, 'Transfer', expect.any(Function), true);
  });

  it('should not watch for Transfer events when watch is false', async () => {
    renderHook(() =>
      usePSP22Balance({ contractAddress: mockDeployment.address, address: 'valid-address', watch: false }),
    );

    await waitForNextUpdate();
    expect(useWatchContractEvent).toHaveBeenCalledWith(mockContract.contract, 'Transfer', expect.any(Function), false);
    expect(mockClient.query.system.events).not.toHaveBeenCalled();
  });

  it('should update balance when refresh is called', async () => {
    const mockRefresh = vi.fn();
    vi.mocked(useContractQuery).mockReturnValue({ data: 100n, refresh: mockRefresh } as any);

    const { result } = renderHook(() =>
      usePSP22Balance({ contractAddress: mockDeployment.address, address: 'valid-address' }),
    );

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    result.current.refresh();
    expect(mockRefresh).toHaveBeenCalled();
  });
});
