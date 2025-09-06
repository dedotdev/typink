import { ContractDeployment, {{ SUPPORTED_NETWORKS }} } from 'typink';

import flipperMetadata from './artifacts/flipper/flipper.json';

export enum ContractId {
  FLIPPER = 'flipper',
}

{{ DEPLOYMENTS }}
