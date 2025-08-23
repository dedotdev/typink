import { PkgManagerInfo } from '../types.js';

// Legacy constants no longer used in new template flow retained for backward compatibility
export const IS_TEMPLATE_FILE = /([^\/\\]*?)\.template\./;
export const IS_IGNORE_FILES = /[\\\/]?(node_modules|dist|build|\.git|\.yarn)([\\\/]|$)/;
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
