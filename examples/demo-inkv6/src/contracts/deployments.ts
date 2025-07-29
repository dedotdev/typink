import { ContractDeployment, popTestnet, westendAssetHub } from 'typink';
import flipperMetadata from './artifacts/flipper/flipper6.json';
import psp22Metadata from './artifacts/psp22/psp22.json';

export enum ContractId {
  FLIPPER = 'flipper',
  PSP22 = 'psp22',
}

export { flipperMetadata };

export const flipperDeployments: ContractDeployment[] = [
  {
    id: ContractId.FLIPPER,
    metadata: flipperMetadata,
    network: popTestnet.id,
    address: '0x8036a0ff5670f418FB382cA8a2367A35970C9cdc',
  },
  {
    id: ContractId.FLIPPER,
    metadata: flipperMetadata,
    network: westendAssetHub.id,
    address: '0x40288Cf68bB879830407b8ffd245CbAA89FF626E',
  },
];

export const psp22Deployments: ContractDeployment[] = [
  {
    id: ContractId.PSP22,
    metadata: psp22Metadata,
    network: popTestnet.id,
    address: '0x5fdF0C445145e34E86216FEECB83fe11e170756d',
  },
];

export const deployments = [...flipperDeployments, ...psp22Deployments];
