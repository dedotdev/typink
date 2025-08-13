import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBalance, useBalances } from 'typink';
import { ALICE, BOB, CHARLIE, wrapper } from '../utils.js';

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

describe('useBalances', () => {
  it('should load balances properly', async () => {
    const addresses = [ALICE, BOB];
    const { result } = renderHook(() => useBalances(addresses), { wrapper });

    // Initially, the balances should be an empty object
    expect(result.current).toEqual({});

    // Wait for the balances to be fetched
    await waitFor(() => {
      expect(Object.keys(result.current).length).toBe(2);
    });

    // After fetching, both addresses should have positive free balances
    expect(result.current[ALICE].free).toBeGreaterThan(0n);
    expect(result.current[BOB].free).toBeGreaterThan(0n);
  });

  it('should update balances when addresses change', async () => {
    const { result, rerender } = renderHook(({ addresses }) => useBalances(addresses), {
      wrapper,
      initialProps: { addresses: [ALICE, BOB] },
    });

    // Wait for initial balances to be fetched
    await waitFor(() => {
      expect(Object.keys(result.current).length).toBe(2);
    });

    // Change addresses
    rerender({ addresses: [ALICE, BOB, CHARLIE] });

    // Wait for new balances to be fetched
    await waitFor(() => {
      expect(Object.keys(result.current).length).toBe(3);
    });

    expect(result.current[ALICE]).toBeDefined();
    expect(result.current[BOB]).toBeDefined();
    expect(result.current[CHARLIE]).toBeDefined();
  });

  it('should return correct balance properties for multiple addresses', async () => {
    const addresses = [ALICE, BOB, CHARLIE];
    const { result } = renderHook(() => useBalances(addresses), { wrapper });

    await waitFor(() => {
      expect(Object.keys(result.current).length).toBe(3);
    });

    for (const address of addresses) {
      expect(result.current[address]).toHaveProperty('free');
      expect(result.current[address]).toHaveProperty('reserved');
      expect(result.current[address]).toHaveProperty('frozen');

      expect(typeof result.current[address].free).toBe('bigint');
      expect(typeof result.current[address].reserved).toBe('bigint');
      expect(typeof result.current[address].frozen).toBe('bigint');
    }
  });
});
