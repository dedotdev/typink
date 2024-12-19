import { beforeAll, describe, expect, it } from 'vitest';
import { ALICE, BOB, deployPsp22Contract, devPairs, mintPSP22Balance, psp22Metadata, wrapper } from '../utils';
import { numberToHex } from 'dedot/utils';
import { Contract } from 'dedot/contracts';
import { Psp22ContractApi } from '../contracts/psp22';
import { renderHook, waitFor } from '@testing-library/react';
import { usePSP22Balance } from 'typink';

describe('useContract2', () => {
  let contractAddress: string, contract: Contract<Psp22ContractApi>;
  beforeAll(async () => {
    const randomSalt = numberToHex(Date.now());
    contractAddress = await deployPsp22Contract(randomSalt);
    console.log('Deployed contract address', contractAddress);
    contract = new Contract<Psp22ContractApi>(client, psp22Metadata, contractAddress, { defaultCaller: ALICE });
  });

  it('get total supply', async () => {
    const { data: state } = await contract.query.psp22TotalSupply();

    console.log(`Total supply`, state);
    expect(state).toBe(BigInt(1e20));
  });

  it('get alice balance', async () => {
    const { data: state } = await contract.query.psp22BalanceOf(ALICE);

    console.log(`alice balance`, state);
    expect(state).toBe(BigInt(1e20));
  });

  it('should load balance properly', async () => {
    const { result } = renderHook(
      () => usePSP22Balance({ contractAddress, address: ALICE }), // prettier-end-here
      { wrapper },
    );

    expect(result.current.data).toBeUndefined();

    await waitFor(() => {
      expect(result.current.data).toBe(BigInt(1e20));
    });
  });

  it('should update balance when address changes', async () => {
    const { result, rerender } = renderHook(({ address }) => usePSP22Balance({ contractAddress, address }), {
      wrapper,
      initialProps: {
        address: ALICE,
      },
    });

    expect(result.current.isLoading).toBe(true);

    // Wait for ALICE's balance to be fetched
    await waitFor(() => {
      expect(result.current.data).toBeDefined();
      expect(result.current.isLoading).toBe(false);
    });

    const aliceBalance = result.current.data;

    rerender({ address: BOB });

    // Wait for BOB's balance to be fetched
    await waitFor(() => {
      expect(result.current.data).toBe(0n);
    });

    // BOB's balance should be different from ALICE's
    expect(result.current.data).not.toEqual(aliceBalance);
  });

  it('should return undefined for invalid address', async () => {
    const { result } = renderHook(() => usePSP22Balance({ contractAddress, address: 'invalid_address' }), { wrapper });

    // The balance should remain undefined
    await waitFor(() => {
      expect(result.current.data).toBeUndefined();
    });
  });

  // it('should automatically update balance when watch is enabled', async () => {
  //   const { result } = renderHook(() => usePSP22Balance({ contractAddress, address: ALICE, watch: true }), { wrapper });
  //
  //   // Wait for ALICE's balance to be fetched
  //   await waitFor(() => {
  //     expect(result.current.data).toBeDefined();
  //   });
  //
  //   const aliceBalance = result.current.data!;
  //
  //   // Simulate a transfer event
  //   const { alice } = devPairs();
  //   await mintPSP22Balance(contractAddress, alice, BigInt(1e12));
  //
  //   // Wait for the balance to be updated
  //   await waitFor(() => {
  //     expect(result.current.data).toBe(aliceBalance + BigInt(1e12));
  //     expect(result.current.data).not.toEqual(aliceBalance);
  //   });
  // });
});
