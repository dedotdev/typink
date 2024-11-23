import { describe, expectTypeOf, it } from 'vitest';
import { DedotClient, WsProvider } from 'dedot';

const client = await DedotClient.new(new WsProvider('ws://127.0.0.1:9944'));

describe('Contracts', () => {
  it('should get current block number', async () => {
    const blockNumber = await client.query.system.number();
    console.log('Current block number:', blockNumber);
    expectTypeOf(blockNumber).toBeNumber();
  });
});
