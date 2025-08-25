import { ContractDeployment, popTestnet } from 'typink';

import greeterMetadata from './artifacts/greeter/greeter.json';

export enum ContractId {
  GREETER = 'greeter',
}

export const greeterDeployments: ContractDeployment[] = [
  {
    id: ContractId.GREETER,
    metadata: greeterMetadata as any,
    network: popTestnet.id,
    address: '5HJ2XLhBuoLkoJT5G2MfMWVpsybUtcqRGWe29Fo26JVvDCZG',
  },
];

export const deployments = [...greeterDeployments];
