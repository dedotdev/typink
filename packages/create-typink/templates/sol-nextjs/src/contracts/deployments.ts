import {
  ContractDeployment,
  // -- START_SUPPORTED_NETWORKS --
  passetHub,
  // -- END_SUPPORTED_NETWORKS --
} from 'typink';
import storeAbi from './abi/storage.json';

export enum ContractId {
  STORAGE = 'storage',
}

export const storageDeployments: ContractDeployment[] = [
  // -- START_DEPLOYMENTS --
  {
    id: ContractId.STORAGE,
    metadata: storeAbi,
    network: passetHub.id,
    address: '0x5153977aAbd805E5E93d7d0D1a6A6f3179f90Da8',
  },
  // -- END_DEPLOYMENTS --
];

export const deployments = [...storageDeployments];
