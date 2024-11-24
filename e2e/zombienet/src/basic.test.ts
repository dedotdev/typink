import { afterAll, beforeAll, describe, expect, expectTypeOf, it } from 'vitest';
import { DedotClient, WsProvider } from 'dedot';

let client: DedotClient;
beforeAll(async () => {
  client = await DedotClient.new(new WsProvider('ws://127.0.0.1:9944'));
});

describe('Contracts', () => {
  it('should get current block number', async () => {
    const blockNumber = await client.query.system.number();
    console.log('Current block number:', blockNumber);
    expectTypeOf(blockNumber).toBeNumber();
  });

  it('should fetch account balance', async () => {
    const account = await client.query.system.account('5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY');

    console.log('Account balance:', account);

    expect(account.data.free).toEqual(10000000000000000n);
  });
});

afterAll(async () => {
  await client.disconnect();
});
