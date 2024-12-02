import { afterAll, beforeAll } from 'vitest';
import { DedotClient, ExtraSignedExtension, PinnedBlock, WsProvider } from 'dedot';
import { blake2AsU8a, HexString, hexToU8a, u8aToHex } from 'dedot/utils';
import { IKeyringPair, Signer, SignerPayloadJSON } from '@polkadot/types/types';
import { ALICE, KEYRING } from './utils';

const CONTRACTS_NODE_ENDPOINT = 'ws://127.0.0.1:9944';

export function signRaw(signerPair: IKeyringPair, raw: HexString): Uint8Array {
  const u8a = hexToU8a(raw);
  // Ref: https://github.com/paritytech/polkadot-sdk/blob/943697fa693a4da6ef481ef93df522accb7d0583/substrate/primitives/runtime/src/generic/unchecked_extrinsic.rs#L234-L238
  const toSignRaw = u8a.length > 256 ? blake2AsU8a(u8a, 256) : u8a;

  return signerPair.sign(toSignRaw, { withType: true });
}

beforeAll(async () => {
  console.log(`Connect to ${CONTRACTS_NODE_ENDPOINT}`);
  global.client = await DedotClient.new(new WsProvider(CONTRACTS_NODE_ENDPOINT));

  const extra = new ExtraSignedExtension(global.client, {
    signerAddress: ALICE,
    payloadOptions: {},
  });

  const mockSigner = {
    signPayload: async (_payload: SignerPayloadJSON) => {

      return {
        signature: u8aToHex(signRaw(KEYRING.getPair(ALICE), extra.toRawPayload().data as HexString)),
      };
    },
  } as Signer;

  global.client.setSigner(mockSigner);

  return new Promise((resolve) => {
    global.client.chainHead.on('finalizedBlock', (x: PinnedBlock) => {
      console.log('Current finalized block number:', x.number);

      if (x.number > 0) {
        resolve(x);
      }
    });
  });
}, 120_000);

afterAll(async () => {
  await global.client.disconnect();
  console.log(`Disconnected from ${CONTRACTS_NODE_ENDPOINT}`);
});
