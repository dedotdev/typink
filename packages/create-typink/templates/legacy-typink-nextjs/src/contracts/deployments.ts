import { alephZeroTestnet, ContractDeployment, popTestnet, alephZero, astar } from 'typink';
import greeterMetadata from './artifacts/greeter/greeter.json';

export enum ContractId {
  GREETER = 'greeter'
}

export { greeterMetadata };

export const greeterDeployments: ContractDeployment[] = [
  {
    id: ContractId.GREETER,
    metadata: greeterMetadata,
    network: popTestnet.id,
    address: '5HJ2XLhBuoLkoJT5G2MfMWVpsybUtcqRGWe29Fo26JVvDCZG',
  }
];

export const deployments = [...greeterDeployments];
