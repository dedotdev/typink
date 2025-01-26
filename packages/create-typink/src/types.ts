export const WALLET_CONNECTORS = ['Default', 'SubConnect V2', 'Talisman Connect'] as const;
export type WalletConnector = (typeof WALLET_CONNECTORS)[number];

export const PRESET_CONTRACTS = ['greeter', 'psp22'] as const;
export type PresetContract = (typeof PRESET_CONTRACTS)[number];

export const NETWORKS = ['Pop Testnet', 'Aleph Zero Testnet', 'Aleph Zero', 'Astar'] as const;
export type Network = (typeof NETWORKS)[number];

export const TEMPLATES = ['default'] as const;
export type Template = (typeof TEMPLATES)[number];

export type BaseOptions = {
  projectName: string | null;
  skipInstall: boolean;
  presetContract: PresetContract | null;
  networks: Network[] | null;
  walletConnector: WalletConnector | null;
  template: Template | null;
  noGit: boolean;
};

export type RawOptions = {
  help: boolean;
  version: boolean;
};

export type Options = BaseOptions & RawOptions;
