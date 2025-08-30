export interface PkgManagerInfo {
  name: string;
  version?: string;
}

export type BaseOptions = {
  projectName: string | null;
  skipInstall: boolean;
  inkVersion: InkVersion | null;
  walletConnector: WalletConnector | null;
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
