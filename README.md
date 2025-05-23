![Typink banner (1991-491)](https://github.com/user-attachments/assets/63538317-f52b-4696-aeba-bef50473cdf6)

# Typink

A comprehensive toolkit for [ink!](https://use.ink/) dApps development, powered by [Dedot!](https://github.com/dedotdev/dedot)

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

---

### Features
- ✅ Fully typesafe react hooks at contract messages & events level
- ✅ Choose your favorite wallet connector (Built-in Typink Connector, [SubConnect](https://github.com/Koniverse/SubConnect-v2), [Talisman Connect](https://github.com/TalismanSociety/talisman-connect), or build your own connector ...)
- ✅ Start a new project from scratch in seconds with `create-typink` cli.
- ✅ Multi-chain supports, lazily initialize when in-use.
- ⏳ ... and more to come

### Quick look

![typink-suggestions](https://github.com/user-attachments/assets/6a9f623a-ef77-459a-9854-6ec026a67042)


### Getting started

#### Start a new project from scratch via `create-typink` cli
Typink comes with a cli to help you start a new project from scratch faster & easier, to create a new project, run the below command:

```shell
npx create-typink@latest
```

> [!IMPORTANT]
> The `create-typink` cli requires NodeJS version >= `v20` to work properly, make sure to check your NodeJS version.


Following the instructions, the cli will help you generate a starter & working project ready for you to start integrate your own contracts and build your own logic:

<img width="1919" alt="new-typink-project" src="https://github.com/user-attachments/assets/b10b1366-f97b-41a7-b3e9-97ceb1bd0748" />

> [!IMPORTANT]
> Please note that `yarn` is the current default package manager for the start project, make sure to [install `yarn`](https://yarnpkg.com/getting-started/install) on your machine to streamline the development process.


#### Migrate from existing projects?

Install `typink` & `dedot` packages:

```shell
# via npm
npm i typink dedot

# via yarn
yarn add typink dedot

# via pnpm
pnpm add typink dedot
```

Typink heavily uses Typescript to enable & ensure type-safety, so we recommend using Typescript for your Dapp project. Typink will also work with plain Javascript, but you don't get the auto-completion & suggestions when interacting with your ink! contracts.

### Documentation
Check out Typink documentation on our website: https://typink.dev
- [Introducing Typink](https://docs.dedot.dev/typink/introducing-typink)
- [Getting started](https://docs.dedot.dev/typink/getting-started/start-a-new-dapp)
- [Migrate from existing project](https://docs.dedot.dev/typink/getting-started/migrate-from-existing-dapp)
- [Hooks & Providers](https://docs.dedot.dev/typink/hooks-and-providers)
- [Utilities](https://docs.dedot.dev/typink/utilities)
- [Tutorial: Build a PSP22 Transfer with Typink](https://docs.dedot.dev/help-and-faq/tutorials/develop-ink-dapp-using-typink)


### Example Dapps

- [Demo](https://github.com/dedotdev/typink/tree/main/examples/demo) (https://typink-demo.netlify.app/)
- [Demo with SubConnect](https://github.com/dedotdev/typink/tree/main/examples/demo-subconnect) (https://typink-subconnect.netlify.app/)

### License

[MIT](https://github.com/dedotdev/typink/blob/main/LICENSE)

### Acknowledgements

Funded by W3F

<p align="left">
  <img width="250" src="https://user-images.githubusercontent.com/6867026/227230786-0796214a-3e3f-42af-94e9-d4122c730b62.png">
</p>
