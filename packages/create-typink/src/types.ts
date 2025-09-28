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

export const PALLET_CONTRACTS_NETWORKS = [
  { name: 'Pop Testnet', value: 'popTestnet', address: '12L4yRvLh5qWSgS5ty5X7gPoL5UjUTpQvM81jioo1L48gkS5' },
  {
    name: 'Aleph Zero Testnet',
    value: 'alephZeroTestnet',
    address: '5CDia8Y46K7CbD2vLej2SjrvxpfcbrLVqK2He3pTJod2Eyik',
  },
  { name: 'Aleph Zero', value: 'alephZero', address: '5CYZtKBxuva33JREQkbeaE4ed2niWb1ijS4pgXbFD61yZti1' },
  { name: 'Astar', value: 'astar', address: 'WejJavPYsGgcY8Dr5KQSJrTssxUh5EbeYiCfdddeo5aTbse' },
] as const;

export const PALLET_REVIVE_NETWORKS = [
  { name: 'Pop Testnet', value: 'popTestnet', address: '0x73d678d38cd4b404223c4Ff8F0e7A5AF4beBA352' },
  { name: 'Passet Hub', value: 'passetHub', address: '0x87396fA7d7FcE9B3e4b11a733C98700968426c50' },
  { name: 'Kusama Asset Hub', value: 'kusamaAssetHub', address: '0xFf6A8342Ae4440D95BB5b9204a72f328c671b751' },
  { name: 'Westend Asset Hub', value: 'westendAssetHub', address: '0xA8237FBAC4387CBcc595757d9bA6DEA296332449' },
] as const;

export type NetworkConfig = {
  name: string;
  // The exported name of the network info in the typink package.
  // This will be used when generating templates.
  value: string;
  // Example contract address for each network:
  // Flipper for ink! v6, Greeter for legacy.
  address: string;
};
