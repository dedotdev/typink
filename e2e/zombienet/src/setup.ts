import { afterAll, beforeAll } from 'vitest';
import { DedotClient, WsProvider } from 'dedot';

const CONTRACTS_NODE_ENDPOINT = 'ws://127.0.0.1:9944';

beforeAll(async () => {
  console.log(`Connect to ${CONTRACTS_NODE_ENDPOINT}`);
  global.client = await DedotClient.new(new WsProvider(CONTRACTS_NODE_ENDPOINT));
});

afterAll(async () => {
  await global.client.disconnect();
  console.log(`Disconnected from ${CONTRACTS_NODE_ENDPOINT}`);
});
