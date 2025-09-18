import {
  ContractDeployment,
  // -- START_SUPPORTED_NETWORKS --
  passetHub,
  // -- END_SUPPORTED_NETWORKS --
} from 'typink';
import flipperMetadata from './artifacts/flipper/flipper.json';

export enum ContractId {
  FLIPPER = 'flipper',
}

export const flipperDeployments: ContractDeployment[] = [
  // -- START_DEPLOYMENTS --
  {
    id: ContractId.FLIPPER,
    metadata: flipperMetadata,
    network: passetHub.id,
    address: '0x87396fA7d7FcE9B3e4b11a733C98700968426c50',
  },
  // -- END_DEPLOYMENTS --
];

export const deployments = [...flipperDeployments];
