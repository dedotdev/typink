import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBalance } from 'typink';
import { ALICE, wrapper } from '../utils';

describe('useBalance', () => {
  it('should load balance properly', () => {
    const { result } = renderHook(() => useBalance(ALICE), { wrapper });
    console.log('useBalance ALICE balance', result.current);
    expect(result.current?.free).toBeGreaterThan(0n);
  });
});
