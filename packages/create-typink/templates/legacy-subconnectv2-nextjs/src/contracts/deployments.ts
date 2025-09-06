import { ContractDeployment, {{ SUPPORTED_NETWORKS }} } from 'typink';

import greeterMetadata from './artifacts/greeter/greeter.json';

export enum ContractId {
  GREETER = 'greeter',
}

{{ DEPLOYMENTS }}
