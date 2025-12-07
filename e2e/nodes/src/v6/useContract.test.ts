import { beforeAll, describe, expect, it } from 'vitest';
import { ContractId, deployFlipperContract, flipperMetadata, newDeployment, wrapperFn } from './utils.js';
import { ALICE, BOB } from '../shared';
import { Contract } from 'dedot/contracts';
import { Flipperv6ContractApi } from './contracts/flipperv6';
import { renderHook, waitFor } from '@testing-library/react';
import { useContract } from 'typink';

describe('useContract', () => {
  let contractAddress: string, contract: Contract<Flipperv6ContractApi>;
  beforeAll(async () => {
    contractAddress = await deployFlipperContract();
    console.log('Deployed contract address', contractAddress);
    contract = new Contract(reviveClient, flipperMetadata, contractAddress, { defaultCaller: ALICE });
  });

  it('get flipper value', async () => {
    const { data: state } = await contract.query.get();

    console.log(`Initial value:`, state);
    expect(state).toBe(true);
  });

  it('should initialize contract instance successfully', async () => {
    const { result } = renderHook(() => useContract<Flipperv6ContractApi>(ContractId.FLIPPER), {
      wrapper: wrapperFn([newDeployment(ContractId.FLIPPER, contractAddress)]),
    });

    await waitFor(() => {
      console.log(result.current.contract);
      expect(result.current.contract).toBeDefined();
      expect(result.current.contract?.address).toEqual(contractAddress);
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
