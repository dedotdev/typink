import { KeyringPair } from '@polkadot/keyring/types';
import { Contract, ContractDeployer, toEvmAddress } from 'dedot/contracts';
import { generateRandomHex } from 'dedot/utils';
import { Flipperv6ContractApi } from './contracts/flipperv6';
import flipperV6Metadata from './contracts/flipperv6.json';
import { ContractDeployment, development, Props, TypinkProvider } from 'typink';
import { Psp22v6ContractApi } from './contracts/psp22v6/index.js';
import psp22V6Metadata from './contracts/psp22v6.json';
import { ALICE, devPairs, mockSigner } from '../shared';
import { INK_NODE_ENDPOINT } from '../setup';

export const flipperMetadata = flipperV6Metadata;
export const psp22Metadata = psp22V6Metadata;

export const deployFlipperContract = async (): Promise<string> => {
  console.log('[deployFlipperContract]');
  const { alice } = devPairs();

  const caller = alice.address;

  const contractBinary = flipperMetadata.source.contract_binary!;
  const deployer = new ContractDeployer<Flipperv6ContractApi>(reviveClient, flipperMetadata, contractBinary);

  const salt = generateRandomHex();

  // Dry-run to estimate gas fee
  const {
    raw: { gasRequired },
  } = await deployer.query.new(true, {
    caller,
    salt,
  });

  console.log('Estimated gas required: ', gasRequired);

  const result = await deployer.tx
    .new(true, { gasLimit: gasRequired, salt }) // prettier-end-here;
    .signAndSend(alice)
    .untilFinalized();

  return await result.contractAddress();
};

export const deployPsp22Contract = async (): Promise<string> => {
  console.log('[deployPsp22Contract]');
  const { alice } = devPairs();

  const caller = alice.address;

  const contractBinary = psp22Metadata.source.contract_binary!;
  const deployer = new ContractDeployer<Psp22v6ContractApi>(reviveClient, psp22Metadata, contractBinary);

  const salt = generateRandomHex();

  // Dry-run to estimate gas fee
  const {
    raw: { gasRequired },
  } = await deployer.query.new(BigInt(1e20), 'PSP Token Name', 'PSPT', 10, {
    caller,
    salt,
  });

  console.log('Estimated gas required: ', gasRequired);

  const result = await deployer.tx
    .new(BigInt(1e20), 'PSP Token Name', 'PSPT', 10, { gasLimit: gasRequired, salt }) // prettier-end-here;
    .signAndSend(alice)
    .untilFinalized();

  return await result.contractAddress();
};

export const Wrapper = ({ children, deployments = [] }: Props) => (
  <TypinkProvider
    supportedNetworks={[{ ...development, providers: [INK_NODE_ENDPOINT] }]}
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
  await reviveClient.tx.balances
    .transferKeepAlive(to, value) // prettier-end-here
    .signAndSend(from, async ({ status }) => {
      console.log(`Transaction status:`, status.type);
    })
    .untilFinalized();
};

export const mintPSP22Balance = async (psp22Address: string, pair: KeyringPair, amount: bigint): Promise<void> => {
  console.log('[mintPSP22Balance]', psp22Address, pair.address, amount);

  const contract = new Contract<Psp22v6ContractApi>(reviveClient, psp22Metadata, psp22Address, {
    defaultCaller: pair.address,
  });

  const {
    raw: { gasRequired },
  } = await contract.query.psp22MintableMint(amount);

  await contract.tx
    .psp22MintableMint(amount, { gasLimit: gasRequired }) // prettier-end-here
    .signAndSend(pair, ({ status }) => {
      console.log('Transaction status:', status.type);
    })
    .untilFinalized();
};

export const mapAccount = async (who: KeyringPair): Promise<void> => {
  console.log('[mapAccount]', who.address);

  if (await reviveClient.query.revive.originalAccount(toEvmAddress(who.address))) {
    return;
  }

  await reviveClient.tx.revive
    .mapAccount()
    .signAndSend(who) // --
    .untilFinalized();
};
