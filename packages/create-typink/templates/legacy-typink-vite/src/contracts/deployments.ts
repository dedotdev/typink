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

export const greeterDeployments: ContractDeployment[] = [
  // -- START_DEPLOYMENTS --
  {
    id: ContractId.GREETER,
    metadata: greeterMetadata as any,
    network: alephZeroTestnet.id,
    address: '5HJ2XLhBuoLkoJT5G2MfMWVpsybUtcqRGWe29Fo26JVvDCZG',
  },
  // -- END_DEPLOYMENTS --
];

export const deployments = [...greeterDeployments];
