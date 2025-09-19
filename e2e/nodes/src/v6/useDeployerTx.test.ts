import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useDeployer, useDeployerTx } from 'typink';
import { flipperMetadata, wrapper } from './utils.js';
import { FlipperContractApi } from './contracts/flipper';
import { generateRandomHex, numberToHex } from 'dedot/utils';

describe('useDeployerTx', () => {
  it('should load deployerTx properly', async () => {
    const { result: resultDeployer } = renderHook(
      () => useDeployer<FlipperContractApi>(flipperMetadata, flipperMetadata.source.contract_binary!),
      { wrapper },
    );

    await waitFor(() => {
      expect(resultDeployer.current.deployer).toBeDefined();
    });

    const { result: resultDeployerTx } = renderHook(() => useDeployerTx(resultDeployer.current.deployer, 'new'), {
      wrapper,
    });

    await waitFor(() => {
      expect(resultDeployerTx.current.signAndSend).toBeDefined();
    });

    expect(resultDeployerTx.current.inProgress).toEqual(false);
    expect(resultDeployerTx.current.inBestBlockProgress).toEqual(false);
  });

  it('should sign and send tx', async () => {
    const { result: resultDeployer } = renderHook(
      () => useDeployer<FlipperContractApi>(flipperMetadata, flipperMetadata.source.contract_binary!),
      { wrapper },
    );

    await waitFor(() => {
      expect(resultDeployer.current.deployer).toBeDefined();
    });

    const { result: resultDeployerTx } = renderHook(() => useDeployerTx(resultDeployer.current.deployer, 'new'), {
      wrapper,
    });

    await waitFor(() => {
      expect(resultDeployerTx.current.signAndSend).toBeDefined();
    });

    const salt = generateRandomHex();

    // Wait for the contract to be deployed
    const contractAddress: string = await new Promise((resolve) => {
      resultDeployerTx.current.signAndSend({
        args: [true],
        txOptions: { salt },
        callback: ({ status }, contractAddress) => {
          console.log(status.type);

          if (contractAddress) {
            resolve(contractAddress);
          }
        },
      });
    });

    expect(contractAddress).toBeDefined();
    console.log('Contract is deployed at address', contractAddress);
  });
});
