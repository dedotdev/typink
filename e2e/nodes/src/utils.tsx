import Keyring from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import { cryptoWaitReady } from '@polkadot/util-crypto';
import { Contract, ContractAddress, ContractDeployer } from 'dedot/contracts';
import { assert, deferred, generateRandomHex } from 'dedot/utils';
import { FlipperContractApi } from './contracts/flipper';
import flipperV5 from './contracts/flipper_v5.json';
import flipperV6 from './contracts/flipper_v6.json';
import {
  ContractDeployment,
  development,
  InjectedSigner,
  JsonRpcApi,
  Props,
  SignerPayloadJSON,
  TypinkProvider,
} from 'typink';
import { Psp22ContractApi } from './contracts/psp22/index.js';
import psp22Metadata from './contracts/psp22.json';
import { TypeRegistry } from '@polkadot/types';

await cryptoWaitReady();
export const KEYRING = new Keyring({ type: 'sr25519' });

export const flipperV5Metadata = flipperV5;
export const flipperMetadata = flipperV5Metadata;
export const flipperV6Metadata = flipperV6;
export { psp22Metadata };

export const ALICE = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
export const BOB = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';
export const CHARLIE = '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y';

export const devPairs = () => {
  const alice = KEYRING.addFromUri('//Alice');
  const bob = KEYRING.addFromUri('//Bob');
  return { alice, bob };
};

export const deployFlipperV5 = async (signer: KeyringPair): Promise<ContractAddress> => {
  const deployer = new ContractDeployer<FlipperContractApi>(
    contractsClient, // prettier-end-here
    flipperV5Metadata,
    flipperV5Metadata.source.wasm!,
    { defaultCaller: signer.address },
  );

  const salt = generateRandomHex();

  const txResult = await deployer.tx // --
    .new(true, { salt })
    .signAndSend(signer)
    .untilFinalized();

  return await txResult.contractAddress();
};

export const deployFlipperV6 = async (signer: KeyringPair): Promise<ContractAddress> => {
  const deployer = new ContractDeployer<FlipperContractApi>(
    reviveClient,
    flipperV6Metadata,
    flipperV6Metadata.source.contract_binary!,
    { defaultCaller: signer.address },
  );

  const txResult = await deployer.tx // --
    .new(true)
    .signAndSend(signer)
    .untilFinalized();

  return await txResult.contractAddress();
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

export const Wrapper = ({ children, deployments = [] }: Props) => (
  <TypinkProvider
    supportedNetworks={[{ ...development, jsonRpcApi: JsonRpcApi.LEGACY }]}
    defaultNetworkId={development.id}
    deployments={deployments}
    defaultCaller={ALICE}
    signer={mockSigner}
    connectedAccount={{ address: ALICE, source: 'test' }}
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

  await contractsClient.tx.balances
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

  const wasm = flipperMetadata.source.wasm!;
  const deployer = new ContractDeployer<FlipperContractApi>(contractsClient, flipperMetadata, wasm);

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
        const instantiatedEvent = contractsClient.events.contracts.Instantiated.find(events);

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
  const deployer = new ContractDeployer<Psp22ContractApi>(contractsClient, psp22Metadata, wasm);

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
        const instantiatedEvent = contractsClient.events.contracts.Instantiated.find(events);

        assert(instantiatedEvent, 'Event Contracts.Instantiated should be available');

        const contractAddress = instantiatedEvent.palletEvent.data.contract.address();
        defer.resolve(contractAddress);
      }
    });

  return defer.promise;
};

export const mintPSP22Balance = async (psp22Address: string, pair: KeyringPair, amount: bigint): Promise<void> => {
  console.log('[mintPSP22Balance]', psp22Address, pair.address, amount);

  const contract = new Contract<Psp22ContractApi>(contractsClient, psp22Metadata, psp22Address, {
    defaultCaller: pair.address,
  });

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
