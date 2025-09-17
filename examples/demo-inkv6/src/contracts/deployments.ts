import { ContractDeployment, passetHub, westendAssetHub } from 'typink';
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
    network: passetHub.id,
    address: '0xbb0DFCF5fbb516399B2D85FB5b3E6E354019412d',
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
    network: passetHub.id,
    address: '0x42D61fC4215Cc62C36348598e7d84E2DA6760F5E',
  },
];

export const deployments = [...flipperDeployments, ...psp22Deployments];
