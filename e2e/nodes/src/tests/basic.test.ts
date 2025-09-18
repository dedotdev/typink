import { describe, expect, expectTypeOf, it } from 'vitest';
import { devPairs } from '../utils.js';

describe('basic client operations', () => {
  it('should get current block number', async () => {
    const blockNumber = await contractsClient.query.system.number();
    console.log('Current block number:', blockNumber);
    expectTypeOf(blockNumber).toBeNumber();
  });

  it('should fetch account balance', async () => {
    const { alice } = devPairs();
    const account = await contractsClient.query.system.account(alice.address);

    console.log('Account balance:', account);

    expect(account.data.free).toBeGreaterThan(0n);
  });
});
