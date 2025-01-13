import { beforeAll, describe, expect, it } from 'vitest';
import { BOB, deployPsp22Contract, flipperMetadata, psp22Metadata, wrapper } from '../utils';
import { numberToHex } from 'dedot/utils';
import { renderHook, waitFor } from '@testing-library/react';
import { useContractTx, useRawContract } from 'typink';
import { Psp22ContractApi } from 'contracts/psp22';
import { FlipperContractApi } from '../contracts/flipper';

describe('useContractTx', () => {
  let contractAddress: string;
  beforeAll(async () => {
    const randomSalt = numberToHex(Date.now());
    contractAddress = await deployPsp22Contract(randomSalt);
    console.log('Deployed contract address', contractAddress);
  });

  it('should transfer balance successfully', async () => {
    const { result: rawContract } = renderHook(() => useRawContract<Psp22ContractApi>(psp22Metadata, contractAddress), {
      wrapper,
    });

    await waitFor(() => {
      expect(rawContract.current.contract).toBeDefined();
      expect(rawContract.current.contract?.client.options.signer).toBeDefined();
    });

    const contract = rawContract.current.contract;

    const { result } = renderHook(() => useContractTx(contract, 'psp22Transfer'), {
      wrapper,
    });

    expect(result.current.signAndSend).toBeDefined();
    expect(result.current.inProgress).toEqual(false);
    expect(result.current.inBestBlockProgress).toEqual(false);

    // Wait for the contract to be deployed
    await new Promise<void>((resolve) => {
      result.current.signAndSend({
        args: [BOB, BigInt(1e12), '0x'],
        callback: ({ status }) => {
          if (status.type === 'BestChainBlockIncluded') {
            expect(result.current.inProgress).toEqual(true);
            expect(result.current.inBestBlockProgress).toEqual(true);
          }

          if (status.type === 'Finalized') {
            expect(result.current.inProgress).toEqual(true);
            expect(result.current.inBestBlockProgress).toEqual(false);

            resolve();
          }
        },
      });
    });

    await waitFor(() => {
      expect(result.current.inProgress).toEqual(false);
      expect(result.current.inBestBlockProgress).toEqual(false);
    });
  });

  it('should throw error on balance insufficient', async () => {
    const { result: rawContract } = renderHook(() => useRawContract<Psp22ContractApi>(psp22Metadata, contractAddress), {
      wrapper,
    });

    await waitFor(() => {
      expect(rawContract.current.contract).toBeDefined();
      expect(rawContract.current.contract?.client.options.signer).toBeDefined();
    });

    const contract = rawContract.current.contract;

    const { result } = renderHook(() => useContractTx(contract, 'psp22Transfer'), {
      wrapper,
    });

    expect(result.current.signAndSend).toBeDefined();

    expect(
      result.current.signAndSend({
        args: [BOB, BigInt(1e30), '0x'],
      }),
    ).rejects.toThrowError('Contract Message Error: InsufficientBalance');
  });

  it('should throw a lang error for invalid input', async () => {
    const { result: rawContract } = renderHook(
      () => useRawContract<FlipperContractApi>(flipperMetadata, contractAddress),
      {
        wrapper,
      },
    );

    await waitFor(() => {
      expect(rawContract.current.contract).toBeDefined();
      expect(rawContract.current.contract?.client.options.signer).toBeDefined();
    });

    const contract = rawContract.current.contract;

    const { result } = renderHook(() => useContractTx(contract, 'flip'), {
      wrapper,
    });

    expect(result.current.signAndSend).toBeDefined();

    expect(result.current.signAndSend({})).rejects.toThrowError(
      'Contract Language Error: Invalid message input or unavailable contract message.',
    );
  });
});
