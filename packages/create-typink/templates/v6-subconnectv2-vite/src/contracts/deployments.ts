import { ContractDeployment, popTestnet } from 'typink';
import flipperMetadata from './artifacts/flipper/flipper.json';

export enum ContractId {
  FLIPPER = 'flipper',
}

export const flipperDeployments: ContractDeployment[] = [
  {
    id: ContractId.FLIPPER,
    metadata: flipperMetadata as any,
    network: popTestnet.id,
    address: '0x8036a0ff5670f418FB382cA8a2367A35970C9cdc',
  },
];

export const deployments = [...flipperDeployments];
