export const WALLET_CONNECTORS = ['Default', 'SubConnect V2', 'Talisman Connect'] as const;
export type WalletConnector = (typeof WALLET_CONNECTORS)[number];

export const PRESET_CONTRACTS_FOR_PALLET_CONTRACTS = ['greeter', 'psp22'] as const;
export const PRESET_CONTRACTS_FOR_PALLET_REVIVE = ['flipper'] as const;
export type PresetContract =
  | (typeof PRESET_CONTRACTS_FOR_PALLET_CONTRACTS)[number]
  | (typeof PRESET_CONTRACTS_FOR_PALLET_REVIVE)[number];

export const NETWORKS_FOR_PALLET_CONTRACTS = ['Pop Testnet', 'Aleph Zero Testnet', 'Aleph Zero', 'Astar'] as const;
export const NETWORKS_FOR_PALLET_REVIVE = ['Pop Testnet', 'Passet Hub', 'Kusama AssetHub', 'Westend AssetHub'] as const;
export type Network =
  | (typeof NETWORKS_FOR_PALLET_CONTRACTS)[number] // prettier-ignore
  | (typeof NETWORKS_FOR_PALLET_REVIVE)[number];

export const TEMPLATES = ['default'] as const;
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

export interface PkgManagerInfo {
  name: string;
  version?: string;
}

export type BaseOptions = {
  projectName: string | null;
  skipInstall: boolean;
  presetContract: PresetContract | null;
  networks: Network[] | null;
  walletConnector: WalletConnector | null;
  template: Template | null;
  inkVersion: InkVersion | null;
  // This option will be determined by the user agent instead of being set by the user
  pkgManager: PkgManagerInfo;
  noGit: boolean;
};

export type RawOptions = {
  help: boolean;
  version: boolean;
};

export type Options = BaseOptions & RawOptions;
