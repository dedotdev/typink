import { cryptoWaitReady } from '@polkadot/util-crypto';
import Keyring from '@polkadot/keyring';
import { InjectedSigner, SignerPayloadJSON } from 'typink';
import { TypeRegistry } from '@polkadot/types';

await cryptoWaitReady();
export const KEYRING = new Keyring({ type: 'sr25519' });


export const ALICE = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
export const BOB = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';
export const CHARLIE = '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y';

export const devPairs = () => {
  const alice = KEYRING.addFromUri('//Alice');
  const bob = KEYRING.addFromUri('//Bob');
  return { alice, bob };
};


export const mockSigner = {
  signPayload: async (payloadJSON: SignerPayloadJSON) => {
    const { alice } = devPairs();

    const registry = new TypeRegistry();
    registry.setSignedExtensions(payloadJSON.signedExtensions);

    // https://github.com/polkadot-js/extension/blob/master/packages/extension-base/src/background/RequestExtrinsicSign.ts#L18-L22
    const payload = registry.createType('ExtrinsicPayload', payloadJSON, { version: payloadJSON.version });
    const result = payload.sign(alice);

    return {
      id: Date.now(),
      ...result,
    };
  },
} as InjectedSigner;