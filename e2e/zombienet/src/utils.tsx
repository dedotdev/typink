import { development, NetworkId, Props, TypinkProvider } from 'typink';

export const ALICE = '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY';
export const BOB = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';

export const wrapper = ({ children }: Props) => (
  <TypinkProvider
    supportedNetworks={[development]}
    defaultNetworkId={NetworkId.DEVELOPMENT}
    deployments={[]}
    defaultCaller={ALICE}>
    {children}
  </TypinkProvider>
);
