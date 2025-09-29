import {
  ContractDeployment,
  // -- START_SUPPORTED_NETWORKS --
  passetHub,
  // -- END_SUPPORTED_NETWORKS --
} from 'typink';
import storage from './artifacts/storage.json';

export enum ContractId {
  STORAGE = 'storage',
}

export const deployments: ContractDeployment[] = [
  // -- START_DEPLOYMENTS --
  {
    id: ContractId.STORAGE,
    metadata: storage,
    network: passetHub.id,
    address: '0x5153977aabd805e5e93d7d0d1a6a6f3179f90da8',
  },
  // -- END_DEPLOYMENTS --
];
