import {
  ContractDeployment,
  // -- START_SUPPORTED_NETWORKS --
  popTestnet,
  // -- END_SUPPORTED_NETWORKS --
} from 'typink';
import flipperMetadata from './artifacts/flipper/flipper.json';

export enum ContractId {
  FLIPPER = 'flipper',
}

export { flipperMetadata };

export const deployments: ContractDeployment[] = [
  // -- START_DEPLOYMENTS --
  {
    id: ContractId.FLIPPER,
    metadata: flipperMetadata,
    network: popTestnet.id,
    address: '12L4yRvLh5qWSgS5ty5X7gPoL5UjUTpQvM81jioo1L48gkS5',
  },
  // -- END_DEPLOYMENTS --
];
