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
    address: '0x0F96195B74599bbD51925bcE776923E2DA5c0235',
  },
  // -- END_DEPLOYMENTS --
];

export const deployments = [...storageDeployments];
