import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDeployer } from 'typink';
import { ALICE, BOB, flipperMetadata, wrapper } from '../utils';

describe('useDeployer', () => {
  it('should load deployer properly', async () => {
    const { result } = renderHook(() => useDeployer(flipperMetadata, flipperMetadata.source.hash), { wrapper });

    // The deployer should be undefined
    expect(result.current.deployer).toBeUndefined();

    await waitFor(() => {
      expect(result.current.deployer).toBeDefined();
    });

    expect(result.current.deployer).toBeDefined();
  });

  it('should update deployer when defaultCaller changes', async () => {
    const { result, rerender } = renderHook(
      ({ address }) => useDeployer(flipperMetadata, flipperMetadata.source.hash, { defaultCaller: address }),
      {
        wrapper,
        initialProps: { address: ALICE },
      },
    );

    // Wait for deployer to be fetched
    await waitFor(() => {
      expect(result.current.deployer).toBeDefined();
    });

    const aliceDeployer = result.current.deployer;

    rerender({ address: BOB });

    // await waitFor(() => {
    //   expect(result.current.deployer).toBeUndefined();
    // });

    await waitFor(() => {
      expect(result.current.deployer).toBeDefined();
    });

    expect(result.current.deployer).not.toEqual(aliceDeployer);
  });
});
