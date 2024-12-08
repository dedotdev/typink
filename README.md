# Typink

Typesafe react hooks to interact with [ink!](https://use.ink/) smart contracts powered by [Dedot!](https://github.com/dedotdev/dedot)

![Version][ico-version]
![Unit test][ico-unit-test]
![E2E test][ico-e2e-test]
![License][ico-license]
[![Chat on Telegram][ico-telegram]][link-telegram]

[ico-telegram]: https://img.shields.io/badge/Dedot-2CA5E0.svg?style=flat-square&logo=telegram&label=Telegram
[ico-unit-test]: https://img.shields.io/github/actions/workflow/status/dedotdev/typink/run-tests.yml?label=unit%20tests&style=flat-square
[ico-e2e-test]: https://img.shields.io/github/actions/workflow/status/dedotdev/typink/zombienet-tests.yml?label=e2e%20tests&style=flat-square
[ico-version]: https://img.shields.io/github/package-json/v/dedotdev/typink?filename=packages%2Ftypink%2Fpackage.json&style=flat-square
[ico-license]: https://img.shields.io/github/license/dedotdev/typink?style=flat-square

[link-telegram]: https://t.me/JoinDedot

### Features
- Fully typesafe react hooks at contract messages & events level
- Choose your favorite wallet connector (Built-in Typink Connector, [SubConnect](https://github.com/Koniverse/SubConnect-v2), [Talisman Connect](https://github.com/TalismanSociety/talisman-connect), or build your own connector ...)
- Support multiple networks, lazily initialize when in-use.
- ... and more to come

### Getting started

```shell
# via npm
npm i typink dedot

# via yarn
yarn add typink dedot

# via pnpm
pnpm add typink dedot
```

Typink heavily uses Typescript to enable & ensure type-safety, so we recommend using Typescript for your Dapp project. Typink will also work with plain Javascript, but you don't get the auto-completion & suggestions when interacting with your ink! contracts.

### Configure your project

> [!NOTE]
>
> **Starting a new project from scratch?**
>
> Try out the prerelease of typink dapp template: https://github.com/dedotdev/typink-dapp-template.
>
> Clone the repo & have fun!



#### 1. Deploy your contracts and setup contract deployments

Typink needs to know your contract deployments information (address, metadata, ...) to help you do the magic under the hood.

The `ContractDeployment` interface have the following structure:
```typescript
export interface ContractDeployment {
  id: string; // A unique easy-to-remember contract id, recommened put them in an enum
  metadata: ContractMetadata | string; // Metadata for the contract
  address: SubstrateAddress; // Address of the contract
  network: string; // The network id that the contract is deployed to, e.g: Pop Testnet (pop_testnet), Aleph Zero Testnet (alephzero_testnet) ...
}
```

Put these information in a separate file (e.g: `deployments.ts`) so you can easily manage it.

```typescript deployments.ts
// deployments.ts

import { ContractDeployment, popTestnet } from 'typink';
import greeterMetadata from './greeter.json';
import psp22Metadata from './psp22.json';

export enum ContractId {
  GREETER = 'greeter',
  PSP22 = 'psp22',
}

export const deployments = [
  {
    id: ContractId.GREETER,
    metadata: greeterMetadata,
    address: '5HJ2XLhBuoLkoJT5G2MfMWVpsybUtcqRGWe29Fo26JVvDCZG',
    network: popTestnet.id
  },
  {
    id: ContractId.PSP22,
    metadata: psp22Metadata as any,
    address: '5GSGWox1ZxUkHBAEbm6NPAHLKD28VoQefTRBYTQuydLrxaKJ',
    network: popTestnet.id,
  },
];
```

#### 2. Generate Typescript bindings (types) for your ink! contracts from the metadata

Now, you'll need to generate the Typescript bindings for your ink! contracts using `dedot` cli. The types generated at this step will help enable the auto-completion & suggestions for your react hooks when interact with the contracts.

We recommend putting these types in a `./contracts/types` folder. Let's generate types for your `greeter` & `psp22` token contracts

```shell
npx dedot typink -m ./greeter.json -o ./contracts/types

npx dedot typink -m ./psp22.json -o ./contracts/types
```

After running the commands, the types will generated into the `./contracts/types` folder. You'll get the top-level type interface for `greeter` & `psp22` contracts as: `GreeterContractApi` and `Psp22ContractApi`.

> [!TIP]
> It's a good practice to put these commands to a shortcut script in th `package.json` file so you can easily regenerate these types again whenver you update the metadata for your contracts
>
> ```jsonc
> {
>    // ...
>    "scripts": {
>       "typink": "npx dedot typink -m ./greeter.json -o ./contracts/types && npx dedot typink -m ./psp22.json -o ./contracts/types"
>    }
>    // ...
> }
> ```
>
> To regenerate the types again:
> ```shell
> npm run typink
>
> # or
> yarn typink
>
> # or
> pnpm typink
> ```


#### 3. Setup your React application

Wrap your application component with `TypinkProvider`.

```tsx
import { popTestnet, development } from 'typink'
import { deployments } from './deployments';

// a default caller address when interact with ink! contract if there is no wallet is connected
const DEFAULT_CALLER = '5xxx...' 

const SUPPORTED_NETWORKS = [popTestnet]; // alephZeroTestnet, ...
if (process.env.NODE_ENV === 'development') {
  SUPPORTED_NETWORKS.push(development);
}

<TypinkProvider
  deployments={deployments}
  defaultCaller={DEFAULT_CALLER}
  supportedNetworks={SUPPORTED_NETWORKS}
  defaultNetworkId={popTestnet.id}
  cacheMetadata={true}>
  <MyAppComponent ... />
</TypinkProvider>
```

If you're using an external wallet connector like [SubConnect](https://github.com/Koniverse/SubConnect-v2) or [Talisman Connect](https://github.com/TalismanSociety/talisman-connect), you will need to pass into the `TypinkProvider` 2 more props: `connectedAccount` ([InjectedAccouunt](https://github.com/dedotdev/typink/blob/d10fe8b7fccc9ef7cdfc1b74576705c6f261160d/packages/typink/src/types.ts#L46-L51)) & `signer` ([Signer](https://github.com/polkadot-js/api/blob/42b9735c32671e4fac2a5b78283a7fcdec9ef912/packages/types/src/types/extrinsic.ts#L168-L183)) so Typink knows which account & signer to interact with the ink! contracts.

```tsx

const { connectedAccount, signer } = ... // from subconnect or talisman-connect ...

<TypinkProvider
  deployments={deployments}
  defaultCaller={DEFAULT_CALLER}
  supportedNetworks={SUPPORTED_NETWORKS}
  defaultNetworkId={popTestnet.id}
  cacheMetadata={true}
  connectedAccount={connectedAccount}
  signer={signer}
>
  <MyAppComponent ... />
</TypinkProvider>
```

### Usage

#### Providers

- `TypinkProvider`

⏳

#### Hooks

- `useTypink`
- `useBalance`, `useBalances`
- `useRawContract`
- `useContract`
- `useContractTx`
- `useContractQuery`
- `useWatchContractQuery`
- `useDeployer`
- `useDeployerTx`
- `useWallets`
- `useWatchContractEvent`
- `usePSP22Balance`

⏳

#### Support networks

1. Development
2. Testnet
3. Mainnet

⏳

### Examples

- [Demo](https://github.com/dedotdev/typink/tree/main/examples/demo)
- [Demo with SubConnect](https://github.com/dedotdev/typink/tree/main/examples/demo-subconnect)

### License

[MIT](https://github.com/dedotdev/typink/blob/main/LICENSE)

### Acknowledgements

Funded by W3F
