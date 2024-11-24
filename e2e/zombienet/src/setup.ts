import { afterAll, beforeAll } from 'vitest';
import { DedotClient, WsProvider } from 'dedot';
import { Keyring } from '@polkadot/keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { BOB } from './utils';

const CONTRACTS_NODE_ENDPOINT = 'ws://127.0.0.1:9944';

beforeAll(async () => {
  console.log(`Connect to ${CONTRACTS_NODE_ENDPOINT}`);
  const client = await DedotClient.new(new WsProvider(CONTRACTS_NODE_ENDPOINT));

  await cryptoWaitReady();

  const aliceKeypair = new Keyring({ type: 'sr25519' }).addFromUri('//Alice');

  // just to make sure ALICE & BOB balances are different!
  await new Promise<void>((resolve, reject) => {
    client.tx.balances
      .transferKeepAlive('5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', 1_000_000_000_000n)
      .signAndSend(aliceKeypair, ({ status }) => {
        if (status.type === 'BestChainBlockIncluded' || status.type === 'Finalized') {
          resolve();
        }
      })
      .catch(reject);
  });

  global.client = client;
});

afterAll(async () => {
  await global.client.disconnect();
  console.log(`Disconnected from ${CONTRACTS_NODE_ENDPOINT}`);
});
