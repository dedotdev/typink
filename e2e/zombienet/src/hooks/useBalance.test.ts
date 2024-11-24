import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useBalance } from 'typink';
import { ALICE, wrapper } from '../utils';

describe('useBalance', () => {
  it('should load balance properly', async () => {
    const { result } = renderHook(() => useBalance(ALICE), { wrapper });
    console.log('useBalance ALICE balance', result.current);
    // Initially, the balance should be undefined
    expect(result.current).toBeUndefined();

    // Wait for the balance to be fetched
    await waitFor(() => {
      expect(result.current).not.toBeUndefined();
    });

    // After fetching, the free balance should be a positive bigint
    expect(result.current?.free).toBeGreaterThan(0n);
    console.log('useBalance ALICE balance', result.current);
  });
});
