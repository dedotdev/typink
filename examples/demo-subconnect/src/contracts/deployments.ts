import { alephZeroTestnet, ContractDeployment, popTestnet } from 'typink';
import greeterMetadata from './artifacts/greeter/greeter.json';
import psp22Metadata from './artifacts/psp22/psp22.json';

export enum ContractId {
  GREETER = 'greeter',
  PSP22 = 'psp22',
}

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
];

export const psp22Deployments: ContractDeployment[] = [
  {
    id: ContractId.PSP22,
    metadata: psp22Metadata as any,
    network: popTestnet.id,
    address: '5GSGWox1ZxUkHBAEbm6NPAHLKD28VoQefTRBYTQuydLrxaKJ',
  },
  {
    id: ContractId.PSP22,
    metadata: psp22Metadata as any,
    network: alephZeroTestnet.id,
    address: '5G5moUCkx5E2TD3CcRWvweg7rpCLngRmwukuKdaohvfBBmXr',
  },
];

export const deployments = [...greeterDeployments, ...psp22Deployments];
