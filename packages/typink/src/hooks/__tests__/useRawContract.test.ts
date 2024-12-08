import { renderHook } from '@testing-library/react';
import { useRawContract } from '../useRawContract.js';
import { useTypink } from '../useTypink.js';
import { Contract } from 'dedot/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock dependencies
vi.mock('../useTypink', () => ({
  useTypink: vi.fn(),
}));

vi.mock('dedot/contracts', () => ({
  Contract: vi.fn(),
}));

vi.mock('react-use', () => ({
  useAsync: vi.fn((callback) => {
    callback();
  }),
}));

describe('useRawContract', () => {
  const mockClient = {};
  const mockDefaultCaller = 'defaultCallerAddress';
  const mockConnectedAccount = { address: 'connectedAccountAddress' };
  const mockMetadata = {} as any;
  const mockAddress = 'mockContractAddress';
  const mockOptions = {};

  beforeEach(() => {
    vi.mocked(useTypink).mockReturnValue({
      client: mockClient,
      defaultCaller: mockDefaultCaller,
      connectedAccount: mockConnectedAccount,
    } as any);

    vi.mocked(Contract).mockImplementation(() => ({}) as any);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return undefined contract when client, metadata, or address is missing', () => {
    const { result } = renderHook(() => useRawContract());
    expect(result.current.contract).toBeUndefined();
  });

  it('should create a new contract instance when all required parameters are provided', () => {
    const { result } = renderHook(() => useRawContract(mockMetadata, mockAddress, mockOptions));

    expect(Contract).toHaveBeenCalledWith(mockClient, mockMetadata, mockAddress, {
      defaultCaller: mockConnectedAccount.address,
      ...mockOptions,
    });
    expect(result.current.contract).toBeDefined();
  });

  it('should use defaultCaller when connectedAccount is not available', () => {
    vi.mocked(useTypink).mockReturnValue({
      client: mockClient,
      defaultCaller: mockDefaultCaller,
      connectedAccount: undefined,
    } as any);

    renderHook(() => useRawContract(mockMetadata, mockAddress, mockOptions));

    expect(Contract).toHaveBeenCalledWith(mockClient, mockMetadata, mockAddress, {
      defaultCaller: mockDefaultCaller,
      ...mockOptions,
    });
  });

  it('should update contract when dependencies change', () => {
    const { rerender } = renderHook(({ metadata, address }) => useRawContract(metadata, address), {
      initialProps: { metadata: mockMetadata, address: mockAddress },
    });

    expect(Contract).toHaveBeenCalledTimes(1);

    // Change metadata
    rerender({ metadata: 'newMetadata', address: mockAddress });
    expect(Contract).toHaveBeenCalledTimes(2);

    // Change address
    rerender({ metadata: 'newMetadata', address: 'newAddress' });
    expect(Contract).toHaveBeenCalledTimes(3);
  });

  it('should set contract to undefined when client becomes unavailable', () => {
    const { result, rerender } = renderHook(() => useRawContract(mockMetadata, mockAddress));

    expect(result.current.contract).toBeDefined();

    vi.mocked(useTypink).mockReturnValue({
      client: undefined,
      defaultCaller: mockDefaultCaller,
      connectedAccount: mockConnectedAccount,
    } as any);

    rerender();

    expect(result.current.contract).toBeUndefined();
  });
});
