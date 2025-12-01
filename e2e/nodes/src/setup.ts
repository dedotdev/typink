import { DedotClient, WsProvider } from 'dedot';
import { afterAll, beforeAll } from 'vitest';
import { devPairs } from './shared';
import { mapAccount } from './v6/utils';

export const CONTRACTS_NODE_ENDPOINT = 'ws://127.0.0.1:9944';
export const INK_NODE_ENDPOINT = 'ws://127.0.0.1:9955';

beforeAll(async () => {
  console.log(`Connect to ${CONTRACTS_NODE_ENDPOINT}`);
  global.contractsClient = await DedotClient.legacy(new WsProvider(CONTRACTS_NODE_ENDPOINT));

  console.log(`Connect to ${INK_NODE_ENDPOINT}`);
  global.reviveClient = await DedotClient.new(new WsProvider(INK_NODE_ENDPOINT));

  const { alice, bob, charlie } = devPairs();

  await mapAccount(alice);
  await mapAccount(bob);
  await mapAccount(charlie);
}, 120_000);

afterAll(async () => {
  await global.contractsClient.disconnect();
  console.log(`Disconnected from ${CONTRACTS_NODE_ENDPOINT}`);

  await global.reviveClient.disconnect();
  console.log(`Disconnected from ${INK_NODE_ENDPOINT}`);
});
