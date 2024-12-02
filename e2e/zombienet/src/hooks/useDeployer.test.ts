import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDeployer } from 'typink';
import { ALICE, BOB, flipperMetadata, wrapper } from '../utils';
import { FlipperContractApi } from 'contracts/flipper';

describe('useDeployer', () => {
  it('should load deployer properly', async () => {
    const { result } = renderHook(() => useDeployer<FlipperContractApi>(flipperMetadata, flipperMetadata.source.wasm!), { wrapper });

    await waitFor(() => {
      expect(result.current.deployer).toBeDefined();
    });

    // Try run to dry-run
    const salt = '0xdeadbeef';
    const dryRunResult = await result.current.deployer!.query.new(false, { salt });

    expect(dryRunResult.address).toBeDefined();
    expect(dryRunResult.raw.gasRequired).toBeDefined(); 
  });

  it('should update deployer when defaultCaller changes', async () => {
    const { result, rerender } = renderHook(
      ({ address }) => useDeployer(flipperMetadata, flipperMetadata.source.hash, { defaultCaller: address }),
      {
        wrapper,
        initialProps: { address: ALICE },
      },
    );

    await waitFor(() => {
      expect(result.current.deployer).toBeDefined();
    });

    const aliceDeployer = result.current.deployer;

    rerender({ address: BOB });

    await waitFor(() => {
      expect(result.current.deployer).toBeDefined();
    });

    // Check if the deployer has been updated
    expect(result.current.deployer?.options?.defaultCaller).not.toEqual(aliceDeployer?.options?.defaultCaller);
  });
});
