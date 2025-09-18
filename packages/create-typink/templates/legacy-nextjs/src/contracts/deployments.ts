import {
  ContractDeployment,
  // -- START_SUPPORTED_NETWORKS --
  alephZeroTestnet,
  // -- END_SUPPORTED_NETWORKS --
} from 'typink';
import greeterMetadata from './artifacts/greeter/greeter.json';

export enum ContractId {
  GREETER = 'greeter',
}

export { greeterMetadata };

export const greeterDeployments: ContractDeployment[] = [
  // -- START_DEPLOYMENTS --
  {
    id: ContractId.GREETER,
    metadata: greeterMetadata,
    network: alephZeroTestnet.id,
    address: '5CDia8Y46K7CbD2vLej2SjrvxpfcbrLVqK2He3pTJod2Eyik',
  },
  // -- END_DEPLOYMENTS --
];

export const deployments = [...greeterDeployments];
