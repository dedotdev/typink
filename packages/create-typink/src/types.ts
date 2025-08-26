export interface PkgManagerInfo {
  name: string;
  version?: string;
}

export type BaseOptions = {
  projectName: string | null;
  skipInstall: boolean;
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
