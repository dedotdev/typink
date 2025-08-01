import { PkgManagerInfo } from "../types.js";

export const IS_TEMPLATE_FILE = /([^/\\]*?)\.template\./;
export const IS_IGNORE_FILES = /[\\/]?(node_modules|dist|build|\.git|\.yarn)([\\/]|$)/;

export function pkgFromUserAgent(userAgent: string | undefined): PkgManagerInfo | undefined {
  if (!userAgent) return undefined;
  // Example of an userAgent: npm/9.2.0 node/v18.16.0 darwin arm64 workspaces/false
  const pkgSpec = userAgent.split(' ')[0];
  const pkgSpecArr = pkgSpec.split('/');
  return {
    name: pkgSpecArr[0],
    version: pkgSpecArr[1],
  };
}
