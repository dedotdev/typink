import { beforeAll, describe, expect, it } from 'vitest';
import { ALICE, BOB, ContractId, deployFlipperContract, flipperMetadata, newDeployment, wrapperFn } from '../utils';
import { numberToHex } from 'dedot/utils';
import { Contract } from 'dedot/contracts';
import { FlipperContractApi } from '../contracts/flipper';
import { renderHook, waitFor } from '@testing-library/react';
import { useContract } from 'typink';

describe('useContract', () => {
  let contractAddress: string, contract: Contract<FlipperContractApi>;
  beforeAll(async () => {
    const randomSalt = numberToHex(Date.now());
    contractAddress = await deployFlipperContract(randomSalt);
    console.log('Deployed contract address', contractAddress);
    contract = new Contract(client, flipperMetadata, contractAddress, { defaultCaller: ALICE });
  });

  it('get flipper value', async () => {
    const { data: state } = await contract.query.get();

    console.log(`Initial value:`, state);
    expect(state).toBe(true);
  });

  it('should initialize contract instance successfully', async () => {
    const { result } = renderHook(() => useContract<FlipperContractApi>(ContractId.FLIPPER), {
      wrapper: wrapperFn([newDeployment(ContractId.FLIPPER, contractAddress)]),
    });

    await waitFor(() => {
      console.log(result.current.contract);
      expect(result.current.contract).toBeDefined();
      expect(result.current.contract?.address.address()).toEqual(contractAddress);
    });
  });

  it('should update contract instance when defaultCaller changes', async () => {
    const { result, rerender } = renderHook(({ defaultCaller }) => useContract(ContractId.FLIPPER, { defaultCaller }), {
      wrapper: wrapperFn([newDeployment(ContractId.FLIPPER, contractAddress)]),
      initialProps: { defaultCaller: ALICE },
    });

    await waitFor(() => {
      expect(result.current.contract).toBeDefined();
    });

    const initialContract = result.current.contract;

    rerender({ defaultCaller: BOB });

    await waitFor(() => {
      expect(result.current.contract).toBeDefined();
      expect(initialContract?.options?.defaultCaller).not.toEqual(result.current.contract?.options?.defaultCaller);
    });
  });
});
