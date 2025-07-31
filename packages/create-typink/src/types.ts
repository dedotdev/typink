export const WALLET_CONNECTORS = ['Default', 'SubConnect V2', 'Talisman Connect'] as const;
export type WalletConnector = (typeof WALLET_CONNECTORS)[number];

export const PRESET_CONTRACTS_FOR_PALLET_CONTRACTS = ['psp22', 'greeter'] as const;
export const PRESET_CONTRACTS_FOR_PALLET_REVIVE = ['psp22', 'flipper'] as const;
export type PresetContract =
  | (typeof PRESET_CONTRACTS_FOR_PALLET_CONTRACTS)[number]
  | (typeof PRESET_CONTRACTS_FOR_PALLET_REVIVE)[number];

export const NETWORKS_FOR_PALLET_CONTRACTS = ['Pop Testnet', 'Aleph Zero Testnet', 'Aleph Zero', 'Astar'] as const;
export const NETWORKS_FOR_PALLET_REVIVE = ['Pop Testnet'] as const;
export type Network =
  | (typeof NETWORKS_FOR_PALLET_CONTRACTS)[number] // prettier-ignore
  | (typeof NETWORKS_FOR_PALLET_REVIVE)[number];

export const TEMPLATES = ['default'] as const;
export type Template = (typeof TEMPLATES)[number];

export const INK_VERSIONS = ['legacy', 'v6'] as const;
export type InkVersion = (typeof INK_VERSIONS)[number];

export const INK_VERSIONS_CHOICES = [
  {
    name: 'v5 & v4 (legacy, wasm, pallet-contracts)',
    value: 'legacy',
    short: 'v5 & v4',
  },
  {
    name: 'v6 (risv-v, pallet-revive)',
    value: 'v6',
    short: 'v6',
  },
] as const;

export type BaseOptions = {
  projectName: string | null;
  skipInstall: boolean;
  presetContract: PresetContract | null;
  networks: Network[] | null;
  walletConnector: WalletConnector | null;
  template: Template | null;
  inkVersion: InkVersion | null;
  noGit: boolean;
};

export type RawOptions = {
  help: boolean;
  version: boolean;
};

export type Options = BaseOptions & RawOptions;
