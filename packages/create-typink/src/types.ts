export interface PkgManagerInfo {
  name: string;
  version?: string;
}

export type BaseOptions = {
  projectName: string | null;
  skipInstall: boolean;
  contractType: ContractType | null;
  networks: string[] | null;
  template: Template | null;
  // This option will be determined by the user agent instead of being set by the user
  pkgManager: PkgManagerInfo;
  noGit: boolean;
};

export type RawOptions = {
  help: boolean;
  version: boolean;
};

export type Options = BaseOptions & RawOptions;

export const TEMPLATES = ['inkv6-nextjs', 'inkv6-sol-nextjs', 'sol-nextjs', 'inkv5-nextjs'] as const;

export type Template = (typeof TEMPLATES)[number];

export enum ContractType {
  InkV5 = 'inkv5',
  InkV6 = 'inkv6',
  InkV6Sol = 'inkv6-sol',
  Sol = 'sol',
}

export const CONTRACT_TYPES_CHOICES = [
  {
    name: 'Ink! v6 (PVM, pallet-revive)',
    value: ContractType.InkV6,
    short: 'v6',
  },
  {
    name: 'Ink! v6 using Sol ABI (PVM, pallet-revive)',
    value: ContractType.InkV6Sol,
    short: 'v6-sol',
  },
  {
    name: 'Solidity (PVM, pallet-revive)',
    value: ContractType.Sol,
    short: 'sol',
  },
  {
    name: 'Ink! v5 (WASM, pallet-contracts)',
    value: ContractType.InkV5,
    short: 'v5',
  },
] as const;

export const PALLET_CONTRACTS_NETWORKS: NetworkConfig[] = [
  {
    name: 'Pop Testnet',
    value: 'popTestnet',
    contractAddresses: {
      [ContractType.InkV5]: '12L4yRvLh5qWSgS5ty5X7gPoL5UjUTpQvM81jioo1L48gkS5', // greeter
    },
  },
  {
    name: 'Aleph Zero Testnet',
    value: 'alephZeroTestnet',
    contractAddresses: {
      [ContractType.InkV5]: '5CDia8Y46K7CbD2vLej2SjrvxpfcbrLVqK2He3pTJod2Eyik', // greeter
    },
  },
  {
    name: 'Aleph Zero',
    value: 'alephZero',
    contractAddresses: {
      [ContractType.InkV5]: '5CYZtKBxuva33JREQkbeaE4ed2niWb1ijS4pgXbFD61yZti1', // greeter
    },
  },
  {
    name: 'Astar',
    value: 'astar',
    contractAddresses: {
      [ContractType.InkV5]: 'WejJavPYsGgcY8Dr5KQSJrTssxUh5EbeYiCfdddeo5aTbse', // greeter
    },
  },
];

export const PALLET_REVIVE_NETWORKS: NetworkConfig[] = [
  {
    name: 'Passet Hub',
    value: 'passetHub',
    contractAddresses: {
      [ContractType.InkV6]: '0xad70e3fa83a3d8340e87226c54f1ac6171cd0d85', // flipper
      [ContractType.InkV6Sol]: '0xbff0c319c037fe24476d0dece1713e4b05cf9541', // flipper
      [ContractType.Sol]: '0x5153977aabd805e5e93d7d0d1a6a6f3179f90da8', // storage
    },
  },
  {
    name: 'Pop Testnet',
    value: 'popTestnet',
    contractAddresses: {
      [ContractType.InkV6]: '0x3ddc397c0350cbfb89d4f28d476073d6051067c4', // flipper
      [ContractType.InkV6Sol]: '0xb8e3c219fecda5328539a228fe497b29c064c1a2', // flipper
      [ContractType.Sol]: '0x403669f05ebb82378680ab00d8aa8a4e6aa6a89a', // storage
    },
  },
];

export type NetworkConfig = {
  name: string;
  // The exported name of the network info in the typink package.
  // This will be used when generating templates.
  value: string;
  // Example contract address for each network:
  // Flipper for ink! v6, Greeter for legacy.
  contractAddresses: Record<string, string>;
};
