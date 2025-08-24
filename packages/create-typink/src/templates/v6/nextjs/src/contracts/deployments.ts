import { ContractDeployment, popTestnet } from 'typink';
import flipperMetadata from './artifacts/flipper/flipper.json';

export enum ContractId {
  FLIPPER = 'flipper'
}

export { flipperMetadata };

export const flipperDeployments: ContractDeployment[] = [
  {
    id: ContractId.FLIPPER,
    metadata: flipperMetadata as any,
    network: popTestnet.id,
    address: '0x8036a0ff5670f418FB382cA8a2367A35970C9cdc',
  },
  // {
  //   id: ContractId.FLIPPER,
  //   metadata: flipperMetadata as any,
  //   network: passetHub.id,
  //   address: '0x87396fA7d7FcE9B3e4b11a733C98700968426c50',
  // },
  // {
  //   id: ContractId.FLIPPER,
  //   metadata: flipperMetadata as any,
  //   network: westendAssetHub.id,
  //   address: '0xA8237FBAC4387CBcc595757d9bA6DEA296332449',
  // },
];

export const deployments = [...flipperDeployments];
