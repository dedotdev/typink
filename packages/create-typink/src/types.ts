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

// New template naming convention: {inkVersion}-{walletConnector}-{nextjs|default}
// inkVersion: legacy | v6
// walletConnector: default | subconnectv2 | talisman
// ui: nextjs | default
export const TEMPLATES = [
  // legacy default UI only
  'legacy-default-default',
  'legacy-subconnectv2-default',
  'legacy-talisman-default',
] as const;
export type Template = (typeof TEMPLATES)[number];
