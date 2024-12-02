import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDeployer, useDeployerTx } from 'typink';
import { flipperV5Metadata, wrapper } from '../utils';
import { FlipperContractApi } from 'contracts/flipper';
import { numberToHex } from 'dedot/utils';

describe('useDeployerTx', () => {
  it('should load deployerTx properly', async () => {
    const { result: resultDeployer } = renderHook(
      () => useDeployer<FlipperContractApi>(flipperV5Metadata, flipperV5Metadata.source.hash),
      { wrapper },
    );

    await waitFor(() => {
      expect(resultDeployer.current.deployer).toBeDefined();
    });

    const { deployer } = resultDeployer.current;

    const { result: resultDeployerTx } = renderHook(() => useDeployerTx(deployer, 'new'), { wrapper });

    await waitFor(() => {
      expect(resultDeployerTx.current.signAndSend).toBeDefined();
    });

    expect(resultDeployerTx.current.inProgress).toEqual(false);
    expect(resultDeployerTx.current.inBestBlockProgress).toEqual(false);
  });

  it('should sign and send tx', async () => {
    const { result: resultDeployer } = renderHook(
      () => useDeployer<FlipperContractApi>(flipperV5Metadata, flipperV5Metadata.source.hash),
      { wrapper },
    );

    await waitFor(() => {
      expect(resultDeployer.current.deployer).toBeDefined();
    });

    const { deployer } = resultDeployer.current;

    const { result: resultDeployerTx } = renderHook(() => useDeployerTx(deployer, 'new'), { wrapper });

    await waitFor(() => {
      expect(resultDeployerTx.current.signAndSend).toBeDefined();
    });

    expect(resultDeployerTx.current.signAndSend).toBeDefined();
    expect(resultDeployerTx.current.inProgress).toEqual(false);
    expect(resultDeployerTx.current.inBestBlockProgress).toEqual(false);

    const salt = numberToHex(Date.now());

    // Wait for the contract to be deployed
    const contractAddress: string = await new Promise(resolve => {
      resultDeployerTx.current.signAndSend({
        args: [true],
        // @ts-ignore
        txOptions: { salt },
        callback: ({ status }, contractAddress) => {
          if (status.type === 'BestChainBlockIncluded') {
            console.log('Best chain block included');
          }

          if (contractAddress) {
            resolve(contractAddress);
          }
        },
      });

      expect(resultDeployerTx.current.inProgress).toEqual(true);
      expect(resultDeployerTx.current.inBestBlockProgress).toEqual(true);
    });

    expect(contractAddress).toBeDefined();
    console.log('Contract is deployed at address', contractAddress);
  });
});
