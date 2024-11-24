import { describe, expect, expectTypeOf, it } from 'vitest';

describe('basic client operations', () => {
  it('should get current block number', async () => {
    const blockNumber = await client.query.system.number();
    console.log('Current block number:', blockNumber);
    expectTypeOf(blockNumber).toBeNumber();
  });

  it('should fetch account balance', async () => {
    const account = await client.query.system.account('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');

    console.log('Account balance:', account);

    expect(account.data.free).toBeGreaterThan(0n);
  });
});
