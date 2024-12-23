import { beforeAll, describe, expect, it } from 'vitest';
import { deployPsp22Contract, psp22Metadata, wrapper } from '../utils';
import { numberToHex } from 'dedot/utils';
import { renderHook, waitFor } from '@testing-library/react';
import { useRawContract } from 'typink';
import { Psp22ContractApi } from 'contracts/psp22';

describe('useRawContract', () => {
  let contractAddress: string;
  beforeAll(async () => {
    const randomSalt = numberToHex(Date.now());
    contractAddress = await deployPsp22Contract(randomSalt);
    console.log('Deployed contract address', contractAddress);
  });

  it('should initialize contract instance successfully', async () => {
    const { result: rawContract } = renderHook(() => useRawContract<Psp22ContractApi>(psp22Metadata, contractAddress), {
      wrapper,
    });

    await waitFor(() => {
      expect(rawContract.current.contract).toBeDefined();
      expect(rawContract.current.contract?.client.options.signer).toBeDefined();
    });
  });

  it('should return undefined contract when address is missing', () => {
    const { result } = renderHook(() => useRawContract<Psp22ContractApi>(psp22Metadata, undefined), {
      wrapper,
    });

    expect(result.current.contract).toBeUndefined();
  });

  it('should return undefined contract when metadata is missing', () => {
    const { result } = renderHook(() => useRawContract<Psp22ContractApi>(undefined, contractAddress), {
      wrapper,
    });

    expect(result.current.contract).toBeUndefined();
  });

  it('should update contract instance when address changes', async () => {
    const { result, rerender } = renderHook(({ address }) => useRawContract<Psp22ContractApi>(psp22Metadata, address), {
      wrapper,
      initialProps: { address: contractAddress },
    });

    await waitFor(() => {
      expect(result.current.contract).toBeDefined();
      expect(result.current.contract?.address.address()).toEqual(contractAddress);
    });

    const newAddress = '5C4hrfjw9DjXZTzV3MwzrrAr9P1MJhSrvWGWqi1eSuyUpnhM';
    rerender({ address: newAddress });

    await waitFor(() => {
      expect(result.current.contract).toBeDefined();
      expect(result.current.contract?.address.address()).toBe(newAddress);
    });
  });
});
