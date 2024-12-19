import { beforeAll, describe, expect, it } from 'vitest';
import { ALICE, deployFlipperContract, flipperMetadata } from '../utils';
import { numberToHex } from 'dedot/utils';
import { Contract } from 'dedot/contracts';
import { FlipperContractApi } from '../contracts/flipper';

describe('useContract', () => {
  let contract: Contract<FlipperContractApi>;
  beforeAll(async () => {
    const randomSalt = numberToHex(Date.now());
    const address = await deployFlipperContract(randomSalt);
    console.log('Deployed contract address', address);
    contract = new Contract(client, flipperMetadata, address, { defaultCaller: ALICE });
  });

  it('get flipper value', async () => {
    const { data: state } = await contract.query.get();

    console.log(`Initial value:`, state);
    expect(state).toBe(true);
  });
});
