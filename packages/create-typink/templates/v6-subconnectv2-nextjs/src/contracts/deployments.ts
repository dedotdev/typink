import { ContractDeployment, passetHub } from 'typink';
import flipperMetadata from './artifacts/flipper/flipper.json';

export enum ContractId {
  FLIPPER = 'flipper',
}

export const flipperDeployments: ContractDeployment[] = [
  {
    id: ContractId.FLIPPER,
    metadata: flipperMetadata as any,
    network: passetHub.id,
    address: '0x87396fA7d7FcE9B3e4b11a733C98700968426c50',
  },
];

export const deployments = [...flipperDeployments];
