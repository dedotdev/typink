import { beforeAll, describe, expect, it } from 'vitest';
import { deployPsp22Contract, psp22Metadata, wrapper } from './utils.js';
import { ALICE, BOB, CHARLIE } from '../shared';
import { numberToHex } from 'dedot/utils';
import { renderHook, waitFor } from '@testing-library/react';
import { useContractQuery, useContractTx, useRawContract } from 'typink';
import { Contract, toEvmAddress } from 'dedot/contracts';
import { Psp22ContractApi } from './contracts/psp22';

describe('useContractQuery', () => {
  let contractAddress: string, contract: Contract<Psp22ContractApi>;
  beforeAll(async () => {
    contractAddress = await deployPsp22Contract();
    console.log('Deployed contract address', contractAddress);
    contract = new Contract<Psp22ContractApi>(reviveClient, psp22Metadata, contractAddress, {
      defaultCaller: ALICE,
    });
  });

  it('should work probably', async () => {
    const { result: totalSupply } = renderHook(() => useContractQuery({ contract, fn: 'psp22TotalSupply' }), {
      wrapper,
    });

    expect(totalSupply.current.data).toBeUndefined();
    expect(totalSupply.current.isLoading).toEqual(true);
    expect(totalSupply.current.isRefreshing).toEqual(false);

    await waitFor(() => {
      expect(totalSupply.current.data).toEqual(BigInt(1e20));
      expect(totalSupply.current.isLoading).toEqual(false);
    });
  });

  it('should dry run successfully', async () => {
    const { result } = renderHook(() => useContractQuery({ contract, fn: 'psp22MintableMint', args: [BigInt(1e12)] }), {
      wrapper,
    });

    expect(result.current.data).toBeUndefined();

    await waitFor(() => {
      expect(result.current.data?.isOk).toBe(true);
    });
  });

  it('should automatically call refresh on new block when watch is enabled', async () => {
    const { result: rawContract } = renderHook(() => useRawContract<Psp22ContractApi>(psp22Metadata, contractAddress), {
      wrapper,
    });

    await waitFor(() => {
      expect(rawContract.current.contract).toBeDefined();
      expect(rawContract.current.contract?.client.options.signer).toBeDefined();
    });

    const contract = rawContract.current.contract;

    const { result: balanceOf } = renderHook(
      () => useContractQuery({ contract, fn: 'psp22BalanceOf', args: [toEvmAddress(ALICE)], watch: true }),
      {
        wrapper,
      },
    );

    await waitFor(() => {
      expect(balanceOf.current.data).toBeDefined();
    });

    const beforeTranfer = balanceOf.current.data!;
    console.log('Before transfer:', beforeTranfer);

    const { result: transfer } = renderHook(
      () => useContractTx(contract, 'psp22Transfer'), // prettier-end-here
      {
        wrapper,
      },
    );

    await new Promise<void>((resolve) => {
      transfer.current.signAndSend({
        args: [toEvmAddress(BOB), BigInt(1e12), '0x'],
        callback: ({ status }) => {
          if (status.type === 'Finalized') {
            resolve();
          }
        },
      });
    });
    console.log('Transfer completed!');

    await waitFor(
      () => {
        expect(balanceOf.current.data).toBeDefined();
        expect(balanceOf.current.data).toEqual(beforeTranfer - BigInt(1e12));
      },
      { timeout: 12000 },
    );

    console.log('After transfer:', balanceOf.current.data);
  });

  it('should fail dry-run', async () => {
    const { result } = renderHook(
      () =>
        useContractQuery({
          contract,
          fn: 'psp22Transfer',
          args: [toEvmAddress(BOB), BigInt(1e12), '0x'],
          options: { caller: CHARLIE },
        }),
      {
        wrapper,
      },
    );

    expect(result.current.data).toBeUndefined();

    await waitFor(() => {
      expect(result.current.data?.isErr).toBe(true);
      // @ts-ignore
      expect(result.current.data?.err).toEqual({ type: 'InsufficientBalance' });
    });
  });

  it('should define error when errors occured', async () => {
    const { result: balanceOf } = renderHook(
      // @ts-ignore
      () => useContractQuery({ contract, args: ['0x__FAKE'], fn: 'unknownMessage' }),
      { wrapper },
    );

    await waitFor(() => {
      expect(balanceOf.current).toBeDefined();
    });

    console.log('Error:', balanceOf.current.error);
  });
});
