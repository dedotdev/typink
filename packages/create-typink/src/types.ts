export interface PkgManagerInfo {
  name: string;
  version?: string;
}

export type BaseOptions = {
  projectName: string | null;
  skipInstall: boolean;
  inkVersion: InkVersion | null;
  walletConnector: WalletConnector | null;
  networks: string[] | null;
  ui: UI | null;
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

// Template naming convention: {inkVersion}-{walletConnector}-{nextjs|vite}
// inkVersion: legacy | v6
// walletConnector: typink | subconnectv2 | talisman
// ui: nextjs | vite
export const TEMPLATES = [
  'legacy-typink-vite',
  'legacy-subconnectv2-vite',
  'legacy-talisman-vite',
  'legacy-typink-nextjs',
  'legacy-subconnectv2-nextjs',
  'legacy-talisman-nextjs',
  'v6-typink-vite',
  'v6-subconnectv2-vite',
  'v6-talisman-vite',
  'v6-typink-nextjs',
  'v6-subconnectv2-nextjs',
  'v6-talisman-nextjs',
] as const;
export type Template = (typeof TEMPLATES)[number];

export enum InkVersion {
  InkLegacy = 'legacy',
  InkV6 = 'v6',
}

export const INK_VERSIONS_CHOICES = [
  {
    name: 'v6 (RISC-V, pallet-revive)',
    value: InkVersion.InkV6,
    short: 'v6',
  },
  {
    name: 'v5 & v4 (WASM, pallet-contracts)',
    value: InkVersion.InkLegacy,
    short: 'v5 & v4',
  },
] as const;

export enum WalletConnector {
  Typink = 'typink',
  SubConnectV2 = 'subconnectv2',
  Talisman = 'talisman',
}

export const WALLET_CONNECTORS_CHOICES = [
  {
    name: 'Typink',
    value: WalletConnector.Typink,
  },
  {
    name: 'SubConnect V2',
    value: WalletConnector.SubConnectV2,
  },
  {
    name: 'Talisman Connect',
    value: WalletConnector.Talisman,
  },
] as const;

export enum UI {
  Vite = 'vite',
  NextJS = 'nextjs',
}

export const UI_CHOICES = [
  {
    name: 'Vite + Charka UI',
    value: UI.Vite,
  },
  {
    name: 'Next.JS + shadcn/ui',
    value: UI.NextJS,
  },
] as const;

export const LEGACY_NETWORKS = [
  {
    name: 'Aleph Zero Testnet',
    value: 'alephZeroTestnet',
    address: '5CDia8Y46K7CbD2vLej2SjrvxpfcbrLVqK2He3pTJod2Eyik',
  },
  { name: 'Aleph Zero', value: 'alephZero', address: '5CYZtKBxuva33JREQkbeaE4ed2niWb1ijS4pgXbFD61yZti1' },
  { name: 'Astar', value: 'astar', address: 'WejJavPYsGgcY8Dr5KQSJrTssxUh5EbeYiCfdddeo5aTbse' },
] as const;

export const V6_NETWORKS = [
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
