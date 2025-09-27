import {
  ContractDeployment,
  // -- START_SUPPORTED_NETWORKS --
  popTestnet,
  // -- END_SUPPORTED_NETWORKS --
} from 'typink';
import greeterMetadata from './artifacts/greeter/greeter.json';

export enum ContractId {
  GREETER = 'greeter',
}

export { greeterMetadata };

export const deployments: ContractDeployment[] = [
  // -- START_DEPLOYMENTS --
  {
    id: ContractId.GREETER,
    metadata: greeterMetadata,
    network: popTestnet.id,
    address: '12L4yRvLh5qWSgS5ty5X7gPoL5UjUTpQvM81jioo1L48gkS5',
  },
  // -- END_DEPLOYMENTS --
];
