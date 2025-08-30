import { PkgManagerInfo } from '../types.js';

export const IS_SUPPORTED_USER_AGENT_PREFIX = /^(npm|yarn|pnpm|bun)\/(\d+\.\d+\.\d+)/;

export function pkgFromUserAgent(userAgent: string | undefined): PkgManagerInfo | undefined {
  // Example of an userAgent: npm/9.2.0 node/v18.16.0 darwin arm64 workspaces/false
  if (!userAgent) return undefined;

  const match = IS_SUPPORTED_USER_AGENT_PREFIX.exec(userAgent);

  if (match?.length !== 3) return undefined;

  return {
    name: match[1],
    version: match[2],
  };
}
