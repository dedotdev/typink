import { renderHook } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useDeepDeps } from '../useDeepDeps.js';

describe('useDeepDeps', () => {
  it('should return the same reference for identical primitive dependencies', () => {
    const { result, rerender } = renderHook((deps) => useDeepDeps(deps), { initialProps: [1, 'string', true] });

    const initialDeps = result.current;

    rerender([1, 'string', true]);

    expect(result.current).toBe(initialDeps);
  });

  it('should return a new reference for different primitive dependencies', () => {
    const { result, rerender } = renderHook((deps) => useDeepDeps(deps), { initialProps: [1, 'string', true] });

    const initialDeps = result.current;

    rerender([2, 'string', true]);

    expect(result.current).not.toBe(initialDeps);
  });

  it('should return the same reference for identical object dependencies', () => {
    const obj = { a: 1, b: 'string' };
    const arr = [1, 2, 3];

    const { result, rerender } = renderHook((deps) => useDeepDeps(deps), { initialProps: [obj, arr] });

    const initialDeps = result.current;

    rerender([{ ...obj }, [...arr]]);

    expect(result.current).toBe(initialDeps);
  });

  it('should return a new reference for different object dependencies', () => {
    const obj = { a: 1, b: 'string' } as any;
    const arr = [1, 2, 3];

    const { result, rerender } = renderHook((deps) => useDeepDeps(deps), { initialProps: [obj, arr] });

    const initialDeps = result.current;

    rerender([{ ...obj, c: 2 }, arr]);

    expect(result.current).not.toBe(initialDeps);
  });

  it('should handle nested objects and arrays correctly', () => {
    const nestedObj = { a: { b: { c: 1 } }, d: [1, 2, { e: 3 }] };

    const { result, rerender } = renderHook((deps) => useDeepDeps(deps), { initialProps: [nestedObj] });

    const initialDeps = result.current;

    // Same structure, should return the same reference
    rerender([{ a: { b: { c: 1 } }, d: [1, 2, { e: 3 }] }]);
    expect(result.current).toBe(initialDeps);

    // Different structure, should return a new reference
    rerender([{ a: { b: { c: 2 } }, d: [1, 2, { e: 3 }] }]);
    expect(result.current).not.toBe(initialDeps);
  });

  it('should handle empty dependencies array', () => {
    const { result, rerender } = renderHook((deps) => useDeepDeps(deps), { initialProps: [] });

    const initialDeps = result.current;

    rerender([]);

    expect(result.current).toBe(initialDeps);
  });

  it('should handle functions in dependencies', () => {
    const fn1 = () => {};
    const fn2 = () => {};

    const { result, rerender } = renderHook((deps) => useDeepDeps(deps), { initialProps: [fn1] });

    const initialDeps = result.current;

    // Same function, should return the same reference
    rerender([fn1]);
    expect(result.current).toBe(initialDeps);

    // Different function, should return a new reference
    rerender([fn2]);
    expect(result.current).not.toBe(initialDeps);
  });
});
