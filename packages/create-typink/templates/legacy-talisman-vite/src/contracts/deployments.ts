import { ContractDeployment, alephZeroTestnet } from 'typink';

import greeterMetadata from './artifacts/greeter/greeter.json';

export enum ContractId {
  GREETER = 'greeter',
}

export const greeterDeployments: ContractDeployment[] = [
  {
    id: ContractId.GREETER,
    metadata: greeterMetadata as any,
    network: alephZeroTestnet.id,
    address: '5CDia8Y46K7CbD2vLej2SjrvxpfcbrLVqK2He3pTJod2Eyik',
  },
];

export const deployments = [...greeterDeployments];
