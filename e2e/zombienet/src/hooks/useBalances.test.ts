import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBalances } from 'typink';
import { ALICE, BOB, CHARLIE, wrapper } from '../utils';

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

  // it('should update balances when addresses change', async () => {
  //   const { result, rerender } = renderHook(({ addresses }) => useBalances(addresses), {
  //     wrapper,
  //     initialProps: { addresses: [ALICE, BOB] },
  //   });
  //
  //   // Wait for initial balances to be fetched
  //   await waitFor(() => {
  //     expect(Object.keys(result.current).length).toBe(2);
  //   });
  //
  //   const initialBalances = result.current;
  //
  //   // Change addresses
  //   rerender({ addresses: [BOB, CHARLIE] });
  //
  //   // Initially, the balances should reset to an empty object
  //   expect(result.current).toEqual({});
  //
  //   // Wait for new balances to be fetched
  //   await waitFor(() => {
  //     expect(Object.keys(result.current).length).toBe(2);
  //   });
  //
  //   // New balances should be different from initial balances
  //   expect(result.current).not.toEqual(initialBalances);
  //   expect(result.current[CHARLIE]).toBeDefined();
  //   expect(result.current[ALICE]).toBeUndefined();
  // });
  //
  // it('should handle invalid addresses', async () => {
  //   const addresses = [ALICE, 'invalid_address'];
  //   const { result } = renderHook(() => useBalances(addresses), { wrapper });
  //
  //   // Wait for balances to be fetched
  //   await waitFor(
  //     () => {
  //       expect(Object.keys(result.current).length).toBe(1);
  //     },
  //     { timeout: 5000 },
  //   );
  //
  //   // Only valid address should have a balance
  //   expect(result.current[ALICE]).toBeDefined();
  //   expect(result.current['invalid_address']).toBeUndefined();
  // });
  //
  // it('should return correct balance properties for multiple addresses', async () => {
  //   const addresses = [ALICE, BOB, CHARLIE];
  //   const { result } = renderHook(() => useBalances(addresses), { wrapper });
  //
  //   await waitFor(() => {
  //     expect(Object.keys(result.current).length).toBe(3);
  //   });
  //
  //   for (const address of addresses) {
  //     expect(result.current[address]).toHaveProperty('free');
  //     expect(result.current[address]).toHaveProperty('reserved');
  //     expect(result.current[address]).toHaveProperty('frozen');
  //
  //     expect(typeof result.current[address].free).toBe('bigint');
  //     expect(typeof result.current[address].reserved).toBe('bigint');
  //     expect(typeof result.current[address].frozen).toBe('bigint');
  //   }
  // });
  //
  // it('should handle empty address array', async () => {
  //   const { result } = renderHook(() => useBalances([]), { wrapper });
  //
  //   // Should immediately return an empty object
  //   expect(result.current).toEqual({});
  //
  //   // Should still be empty after a delay
  //   await new Promise(resolve => setTimeout(resolve, 1000));
  //   expect(result.current).toEqual({});
  // });
});
