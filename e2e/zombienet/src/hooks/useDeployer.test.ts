import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDeployer } from 'typink';
import { ALICE, flipperV5Metadata, wrapper } from '../utils';

describe('useDeployer', () => {
  it('should load deployer properly', async () => {
    const { result } = renderHook(() => useDeployer(flipperV5Metadata, flipperV5Metadata.source.hash), { wrapper });

    // Initially, the deployer should be undefined
    expect(result.current).toBeUndefined();

    // Wait for the deployer to be fetched
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    // After fetching, the deployer should be a valid deployer
    expect(result.current?.deployer).toBeDefined();
  });

  it('should update deployer when defaultCaller changes', async () => {
    const { result, rerender } = renderHook(
      ({ address }) => useDeployer(flipperV5Metadata, flipperV5Metadata.source.hash, { defaultCaller: address }),
      {
        wrapper,
        initialProps: { address: ALICE },
      },
    );

    // Wait for ALICE's deployer to be fetched
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    const aliceDeployer = result.current;

    const address = '5DFdEZVVJyT7Bz1XMznaXxPeRUTfNn2mhbKmzMnKdMfFpECD';
    rerender({ address });

    // Initially, the deployer should be undefined again
    expect(result.current).toBeUndefined();

    // Wait for BOB's deployer to be fetched
    await waitFor(() => {
      expect(result.current).toBeDefined();
    });

    // BOB's deployer should be different from ALICE's
    expect(result.current?.deployer).toBeDefined();
    expect(result.current).not.toEqual(aliceDeployer);
  });
});
