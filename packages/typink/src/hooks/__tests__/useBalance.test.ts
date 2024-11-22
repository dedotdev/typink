import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBalance } from '../useBalance.js';
import * as useBalancesModule from '../useBalances.js';

// Mock the useBalances hook
vi.mock('../useBalances', async () => {
  const actual = await vi.importActual('../useBalances');
  return {
    ...actual,
    useBalances: vi.fn(),
  };
});

describe('useBalance', () => {
  const mockAddress = 'mockAddress123';
  const mockBalance = { free: 100n, reserved: 10n, frozen: 5n };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return undefined when no address is provided', () => {
    const { result } = renderHook(() => useBalance());
    expect(result.current).toBeUndefined();
  });

  it('should return the balance for a given address', () => {
    vi.mocked(useBalancesModule.useBalances).mockReturnValue({ [mockAddress]: mockBalance });

    const { result } = renderHook(() => useBalance(mockAddress));
    expect(result.current).toEqual(mockBalance);
  });

  it('should return undefined when the balance is not available', () => {
    vi.mocked(useBalancesModule.useBalances).mockReturnValue({});

    const { result } = renderHook(() => useBalance(mockAddress));
    expect(result.current).toBeUndefined();
  });

  it('should call useBalances with the correct address', () => {
    renderHook(() => useBalance(mockAddress));
    expect(useBalancesModule.useBalances).toHaveBeenCalledWith([mockAddress]);
  });

  it('should memoize the addresses array', () => {
    const { rerender } = renderHook(({ address }) => useBalance(address), {
      initialProps: { address: mockAddress },
    });

    const firstCall = vi.mocked(useBalancesModule.useBalances).mock.calls[0][0];
    
    rerender({ address: mockAddress });
    const secondCall = vi.mocked(useBalancesModule.useBalances).mock.calls[1][0];

    expect(firstCall).toBe(secondCall);
  });

  it('should update when the address changes', () => {
    const newAddress = 'newAddress456';
    const newBalance = { free: 200n, reserved: 20n, frozen: 10n };

    vi.mocked(useBalancesModule.useBalances)
      .mockReturnValueOnce({ [mockAddress]: mockBalance })
      .mockReturnValueOnce({ [newAddress]: newBalance });

    const { result, rerender } = renderHook(({ address }) => useBalance(address), {
      initialProps: { address: mockAddress },
    });

    expect(result.current).toEqual(mockBalance);

    rerender({ address: newAddress });

    expect(result.current).toEqual(newBalance);
  });
});