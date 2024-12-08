import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePSP22Balance } from '../psp22/index.js';
import { useTypink } from '../useTypink.js';
import { useRawContract } from '../useRawContract.js';
import { useContractQuery } from '../useContractQuery.js';
import { useWatchContractEvent } from '../useWatchContractEvent.js';
import { renderHook, waitFor } from '@testing-library/react';
import { waitForNextUpdate } from './test-utils.js';

vi.mock('../useTypink', () => ({
  useTypink: vi.fn(),
}));

vi.mock('../useWatchContractEvent', () => ({
  useWatchContractEvent: vi.fn(),
}));

vi.mock('../useContractQuery', () => ({
  useContractQuery: vi.fn(),
}));

vi.mock('../useRawContract', () => ({
  useRawContract: vi.fn(),
}));

describe('usePSP22Balance', () => {
  const client = {
    query: {
      system: {
        events: vi.fn(),
      },
    },
  };
  const dummyDeployment = {
    id: 'test-contract',
    network: 'test-network',
    metadata: {},
    address: 'test-address',
  };
  const connectedAccount = { address: 'selected-account-address' };
  const defaultCaller = 'default-caller-address';

  const mockedUseTypink = {
    deployments: [dummyDeployment],
    client,
    // @ts-ignore
    networkId: 'test-network',
    connectedAccount,
    defaultCaller,
  };

  const mockedContract = {
    contract: {
      query: {
        psp22BalanceOf: vi.fn().mockResolvedValue({ data: 100n }),
      },
    },
  };

  beforeEach(() => {
    vi.mocked(useTypink).mockReturnValue(mockedUseTypink as any);
    vi.mocked(useRawContract).mockReturnValue(mockedContract as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should run properly', async () => {
    const { result, rerender } = renderHook(
      ({ watch }) => usePSP22Balance({ contractAddress: dummyDeployment.address, address: 'valid-address', watch }),
      {
        initialProps: { watch: false },
      },
    );

    // @ts-ignore
    vi.mocked(useContractQuery).mockImplementation(({ contract }) => {
      if (contract) {
        return { data: 100n };
      }
    });

    // Wait for psp22Metadata to be loaded
    await waitFor(
      () => {
        expect(result.current.data).toBeDefined();
      },
      { timeout: 5000 },
    );

    expect(useRawContract).toHaveBeenCalledWith(expect.any(Object), dummyDeployment.address);

    expect(useContractQuery).toHaveBeenCalledWith({
      contract: mockedContract.contract,
      fn: 'psp22BalanceOf',
      args: ['valid-address'],
    });

    expect(useWatchContractEvent).toHaveBeenCalledWith(
      mockedContract.contract,
      'Transfer',
      expect.any(Function),
      false,
    );

    rerender({ watch: true });
    waitForNextUpdate();

    expect(useWatchContractEvent).toHaveBeenCalledWith(mockedContract.contract, 'Transfer', expect.any(Function), true);
  });

  it('should use the connected account address if address not defined', async () => {
    const { result } = renderHook(() => usePSP22Balance({ contractAddress: dummyDeployment.address }));

    // @ts-ignore
    vi.mocked(useContractQuery).mockImplementation(({ contract }) => {
      if (contract) {
        return { data: 100n };
      }
    });

    // Wait for psp22Metadata to be loaded
    await waitFor(
      () => {
        expect(result.current.data).toBeDefined();
      },
      { timeout: 5000 },
    );

    expect(useRawContract).toHaveBeenCalledWith(expect.any(Object), dummyDeployment.address);

    expect(useContractQuery).toHaveBeenCalledWith({
      contract: mockedContract.contract,
      fn: 'psp22BalanceOf',
      args: [connectedAccount.address],
    });

    expect(useWatchContractEvent).toHaveBeenCalledWith(
      mockedContract.contract,
      'Transfer',
      expect.any(Function),
      false,
    );
  });

  it('should run system.events() when watch is true', async () => {
    const useWatchContractEvent = await import('../useWatchContractEvent.js');
    useWatchContractEvent.useWatchContractEvent = (await vi.importActual('../useWatchContractEvent'))
      .useWatchContractEvent as any;

    const useContractQuery = await import('../useContractQuery.js');
    useContractQuery.useContractQuery = (await vi.importActual('../useContractQuery')).useContractQuery as any;

    const { result } = renderHook(() => usePSP22Balance({ contractAddress: dummyDeployment.address, watch: true }));

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    expect(result.current.data).toEqual(100n);
    expect(client.query.system.events).toHaveBeenCalled();
  });

  it('should not call system.events() when watch is false', async () => {
    const useWatchContractEvent = await import('../useWatchContractEvent.js');
    useWatchContractEvent.useWatchContractEvent = (await vi.importActual('../useWatchContractEvent'))
      .useWatchContractEvent as any;

    const useContractQuery = await import('../useContractQuery.js');
    useContractQuery.useContractQuery = (await vi.importActual('../useContractQuery')).useContractQuery as any;

    const { result } = renderHook(() => usePSP22Balance({ contractAddress: dummyDeployment.address, watch: false }));

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    expect(result.current.data).toEqual(100n);
    expect(client.query.system.events).not.toHaveBeenCalled();
  });
});
