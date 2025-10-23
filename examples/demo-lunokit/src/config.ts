import { createConfig } from '@luno-kit/react';
import { polkadotjsConnector, subwalletConnector, talismanConnector, enkryptConnector } from '@luno-kit/react/connectors';

export const config = createConfig({
  appName: 'Typink + LunoKit',
  connectors: [polkadotjsConnector(), subwalletConnector(), talismanConnector(), enkryptConnector()],
})
