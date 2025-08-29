import { ContractDeployment } from 'typink';
{{NETWORK_IMPORTS}}

import flipperMetadata from './artifacts/flipper/flipper.json';

export enum ContractId {
  FLIPPER = 'flipper',
}

{{DEPLOYMENTS}}
