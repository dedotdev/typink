import { ContractDeployment, popTestnet, westendAssetHub } from 'typink';
import flipperMetadata from './artifacts/flipper/flipper6.json';

export enum ContractId {
  FLIPPER = 'flipper',
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

export const deployments = [...flipperDeployments];
