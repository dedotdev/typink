import { ContractDeployment, development, InjectedSigner, Props, SignerPayloadJSON, TypinkProvider } from 'typink';
import Keyring from '@polkadot/keyring';
import { FlipperContractApi } from './contracts/flipper';
import { Psp22ContractApi } from './contracts/psp22';
// @ts-ignore
import * as flipper from './contracts/flipper_v5.json';
// @ts-ignore
import * as psp22 from './contracts/psp22.json';
import { Contract, ContractDeployer, parseRawMetadata } from 'dedot/contracts';
import { assert, deferred } from 'dedot/utils';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { KeyringPair } from '@polkadot/keyring/types';
import { TypeRegistry } from '@polkadot/types';

await cryptoWaitReady();
export const KEYRING = new Keyring({ type: 'sr25519' });
export const ALICE = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
export const BOB = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';
export const CHARLIE = '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y';

export const flipperMetadata = parseRawMetadata(JSON.stringify(flipper));
export const psp22Metadata = parseRawMetadata(JSON.stringify(psp22));

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

export const Wrapper = ({ children, deployments = [] }: Props) => (
  <TypinkProvider
    supportedNetworks={[development]}
    defaultNetworkId={development.id}
    deployments={deployments}
    defaultCaller={ALICE}
    signer={mockSigner}
    connectedAccount={{ address: ALICE }}
    appName='Typink Test App'>
    {children}
  </TypinkProvider>
);

export const wrapper = Wrapper;

export enum ContractId {
  FLIPPER = 'FLIPPER',
  PSP22 = 'PSP22',
}

export const newDeployment = (id: string, address: string): ContractDeployment => {
  if (id === ContractId.PSP22) {
    return {
      id,
      address,
      network: development.id,
      metadata: psp22Metadata,
    };
  } else if (id === ContractId.FLIPPER) {
    return {
      id,
      address,
      network: development.id,
      metadata: flipperMetadata,
    };
  }

  throw new Error(`Invalid contract ID: ${id}`);
};

export const wrapperFn = (deployments: ContractDeployment[]) => {
  return ({ children }: Props) => <Wrapper deployments={deployments}>{children}</Wrapper>;
};

export const transferNativeBalance = async (from: KeyringPair, to: string, value: bigint): Promise<void> => {
  const defer = deferred<void>();

  await client.tx.balances
    .transferKeepAlive(to, value) // prettier-end-here
    .signAndSend(from, async ({ status }) => {
      console.log(`Transaction status:`, status.type);

      if (status.type === 'BestChainBlockIncluded' || status.type === 'Finalized') {
        defer.resolve();
      }
    });

  return defer.promise;
};

export const deployFlipperContract = async (salt?: string): Promise<string> => {
  console.log('[deployFlipperContract]');
  const { alice } = devPairs();

  const caller = alice.address;

  const wasm = flipper.source.wasm!;
  const deployer = new ContractDeployer<FlipperContractApi>(client, flipperMetadata, wasm);

  // Dry-run to estimate gas fee
  const {
    raw: { gasRequired },
  } = await deployer.query.new(true, {
    caller,
    salt,
  });

  console.log('Estimated gas required: ', gasRequired);

  const defer = deferred<string>();

  await deployer.tx
    .new(true, { gasLimit: gasRequired, salt }) // prettier-end-here;
    .signAndSend(alice, async ({ status, events }) => {
      console.log('Transaction status:', status.type);

      if (status.type === 'BestChainBlockIncluded' || status.type === 'Finalized') {
        const instantiatedEvent = client.events.contracts.Instantiated.find(events);

        assert(instantiatedEvent, 'Event Contracts.Instantiated should be available');

        const contractAddress = instantiatedEvent.palletEvent.data.contract.address();
        defer.resolve(contractAddress);
      }
    });

  return defer.promise;
};

export const deployPsp22Contract = async (salt?: string): Promise<string> => {
  console.log('[deployPsp22Contract]');
  const { alice } = devPairs();

  const caller = alice.address;

  const wasm = psp22Metadata.source.wasm!;
  const deployer = new ContractDeployer<Psp22ContractApi>(client, psp22Metadata, wasm);

  // Dry-run to estimate gas fee
  const {
    raw: { gasRequired },
  } = await deployer.query.new(BigInt(1e20), 'PSP Token Name', 'PSPT', 10, {
    caller,
    salt,
  });

  console.log('Estimated gas required: ', gasRequired);

  const defer = deferred<string>();

  await deployer.tx
    .new(BigInt(1e20), 'PSP Token Name', 'PSPT', 10, { gasLimit: gasRequired, salt }) // prettier-end-here;
    .signAndSend(alice, async ({ status, events }) => {
      console.log('Transaction status:', status.type);

      if (status.type === 'BestChainBlockIncluded' || status.type === 'Finalized') {
        const instantiatedEvent = client.events.contracts.Instantiated.find(events);

        assert(instantiatedEvent, 'Event Contracts.Instantiated should be available');

        const contractAddress = instantiatedEvent.palletEvent.data.contract.address();
        defer.resolve(contractAddress);
      }
    });

  return defer.promise;
};

export const mintPSP22Balance = async (psp22Address: string, pair: KeyringPair, amount: bigint): Promise<void> => {
  console.log('[mintPSP22Balance]', psp22Address, pair.address, amount);

  const contract = new Contract<Psp22ContractApi>(client, psp22Metadata, psp22Address, { defaultCaller: pair.address });

  const {
    raw: { gasRequired },
  } = await contract.query.psp22MintableMint(amount);

  const defer = deferred<void>();
  await contract.tx
    .psp22MintableMint(amount, { gasLimit: gasRequired }) // prettier-end-here
    .signAndSend(pair, ({ status }) => {
      console.log('Transaction status:', status.type);

      if (status.type === 'BestChainBlockIncluded' || status.type === 'Finalized') {
        defer.resolve();
      }
    });

  return defer.promise;
};

export const devPairs = () => {
  const alice = KEYRING.addFromUri('//Alice');
  const bob = KEYRING.addFromUri('//Bob');
  return { alice, bob };
};

export const sleep = (ms: number = 0) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
