import { alephZeroTestnet, ContractDeployment, popTestnet, alephZero, astar } from 'typink';
import greeterMetadata from './artifacts/greeter/greeter.json';
import psp22Metadata from './artifacts/psp22/psp22.json';

export enum ContractId {
  GREETER = 'greeter',
  PSP22 = 'psp22',
}

export { greeterMetadata, psp22Metadata };

export const greeterDeployments: ContractDeployment[] = [
  {
    id: ContractId.GREETER,
    metadata: greeterMetadata,
    network: popTestnet.id,
    address: '5HJ2XLhBuoLkoJT5G2MfMWVpsybUtcqRGWe29Fo26JVvDCZG',
  },
  {
    id: ContractId.GREETER,
    metadata: greeterMetadata as any,
    network: alephZeroTestnet.id,
    address: '5CDia8Y46K7CbD2vLej2SjrvxpfcbrLVqK2He3pTJod2Eyik',
  },
  {
    id: ContractId.GREETER,
    metadata: greeterMetadata as any,
    network: alephZero.id,
    address: '5CYZtKBxuva33JREQkbeaE4ed2niWb1ijS4pgXbFD61yZti1',
  },
  {
    id: ContractId.GREETER,
    metadata: greeterMetadata as any,
    network: astar.id,
    address: 'WejJavPYsGgcY8Dr5KQSJrTssxUh5EbeYiCfdddeo5aTbse',
  },
];

export const psp22Deployments: ContractDeployment[] = [
  {
    id: ContractId.PSP22,
    metadata: psp22Metadata as any,
    network: popTestnet.id,
    address: '16119BccKAfWwbt4TCNvfLBDuRWHSeFozJELEcxFPVd11hnt',
  },
  {
    id: ContractId.PSP22,
    metadata: psp22Metadata as any,
    network: alephZeroTestnet.id,
    address: '5G5moUCkx5E2TD3CcRWvweg7rpCLngRmwukuKdaohvfBBmXr',
  },
  {
    id: ContractId.PSP22,
    metadata: psp22Metadata as any,
    network: alephZero.id,
    address: '5EkDPuyLdubc4uUmEhzMFRtcNtmxSoUecfcc9wWLUR7ZFXbb',
  },
  {
    id: ContractId.PSP22,
    metadata: psp22Metadata as any,
    network: astar.id,
    address: 'YFhgALp2qPtPe1pTFereqqB4RUXKzVM7YtCYfqQX412GWHr',
  },
];

export const deployments = [...greeterDeployments, ...psp22Deployments];
