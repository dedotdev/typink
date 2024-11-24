import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBalance } from 'typink';
import { ALICE, wrapper } from '../utils';

describe('useBalance', () => {
  it('should load balance properly', async () => {
    const { result } = renderHook(() => useBalance(ALICE), { wrapper });

    // Initially, the balance should be undefined
    expect(result.current).toBeUndefined();

    // Wait for the balance to be fetched
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    // After fetching, the free balance should be a positive bigint
    expect(result.current?.free).toBeGreaterThan(0n);
  });

  it('should update balance when address changes', async () => {
    const { result, rerender } = renderHook(({ address }) => useBalance(address), {
      wrapper,
      initialProps: { address: ALICE },
    });

    // Wait for ALICE's balance to be fetched
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    const aliceBalance = result.current;

    const address = '5DFdEZVVJyT7Bz1XMznaXxPeRUTfNn2mhbKmzMnKdMfFpECD';
    rerender({ address });

    // Initially, the balance should be undefined again
    expect(result.current).toBeUndefined();

    // Wait for BOB's balance to be fetched
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    // BOB's balance should be different from ALICE's
    expect(result.current?.free).toEqual(0n);
    expect(result.current).not.toEqual(aliceBalance);
  });

  it('should return undefined for invalid address', async () => {
    const { result } = renderHook(() => useBalance('invalid_address'), { wrapper });

    // The balance should remain undefined
    await waitFor(
      () => {
        expect(result.current).toBeUndefined();
      },
      { timeout: 5000 },
    );
  });

  it('should return correct balance properties', async () => {
    const { result } = renderHook(() => useBalance(ALICE), { wrapper });

    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    expect(result.current).toHaveProperty('free');
    expect(result.current).toHaveProperty('reserved');
    expect(result.current).toHaveProperty('frozen');

    expect(typeof result.current?.free).toBe('bigint');
    expect(typeof result.current?.reserved).toBe('bigint');
    expect(typeof result.current?.frozen).toBe('bigint');
  });
});
