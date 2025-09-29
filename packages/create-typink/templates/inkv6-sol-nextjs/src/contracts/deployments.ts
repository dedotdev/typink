import {
  ContractDeployment,
  // -- START_SUPPORTED_NETWORKS --
  passetHub,
  // -- END_SUPPORTED_NETWORKS --
} from 'typink';
import flipper from './artifacts/flipper/flipper.json';

export enum ContractId {
  FLIPPER = 'flipper',
}

export const deployments: ContractDeployment[] = [
  // -- START_DEPLOYMENTS --
  {
    id: ContractId.FLIPPER,
    metadata: flipper,
    network: passetHub.id,
    address: '0xbff0c319c037fe24476d0dece1713e4b05cf9541',
  },
  // -- END_DEPLOYMENTS --
];
