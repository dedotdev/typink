import { ContractDeployment } from 'typink';
{{NETWORK_IMPORTS}}

import greeterMetadata from './artifacts/greeter/greeter.json';

export enum ContractId {
  GREETER = 'greeter',
}

{{DEPLOYMENTS}}
