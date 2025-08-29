import { ContractDeployment } from 'typink';
{{NETWORK_IMPORTS}}

import flipper6Metadata from './artifacts/flipper/flipper6.json';

export enum ContractId {
  FLIPPER = 'flipper',
}

{{DEPLOYMENTS}}
