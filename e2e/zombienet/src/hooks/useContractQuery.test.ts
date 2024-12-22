import { beforeAll, describe, expect, it } from 'vitest';
import { ALICE, BOB, deployPsp22Contract, devPairs, mintPSP22Balance, psp22Metadata, wrapper } from '../utils';
import { numberToHex } from 'dedot/utils';
import { renderHook, waitFor } from '@testing-library/react';
import { useContractQuery, usePSP22Balance } from 'typink';
import { Contract } from 'dedot/contracts';
import { Psp22ContractApi } from 'contracts/psp22';

describe('useContractQuery', () => {
  let contractAddress: string, contract: Contract<Psp22ContractApi>;
  beforeAll(async () => {
    const randomSalt = numberToHex(Date.now());
    contractAddress = await deployPsp22Contract(randomSalt);
    console.log('Deployed contract address', contractAddress);
    contract = new Contract<Psp22ContractApi>(client, psp22Metadata, contractAddress, { defaultCaller: ALICE });
  });

  it('should load total supply', async () => {
    const { result } = renderHook(() => useContractQuery({ contract, fn: 'psp22TotalSupply' }), {
      wrapper,
    });

    expect(result.current.data).toBeUndefined();

    await waitFor(() => {
      expect(result.current.data).toBe(BigInt(1e20));
    });
  });

  it('should dry run successfully', async () => {
    const { result } = renderHook(
      () => useContractQuery({ contract, fn: 'psp22Transfer', args: [BOB, BigInt(1e12), '0x'] }),
      {
        wrapper,
      },
    );

    expect(result.current.data).toBeUndefined();

    await waitFor(() => {
      expect(result.current.data?.isOk).toBe(true);
    });
  });
});
