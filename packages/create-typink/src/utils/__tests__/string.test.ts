import { describe, expect, it } from 'vitest';
import { pkgFromUserAgent } from '../string.js';

describe('string', () => {
  describe('pkgFromUserAgent', () => {
    it('should return undefined for undefined userAgent', () => {
      const result = pkgFromUserAgent(undefined);
      expect(result).toBeUndefined();
    });

    it('should parse npm user agent', () => {
      const userAgent = 'npm/9.2.0 node/v18.16.0 darwin arm64 workspaces/false';
      const result = pkgFromUserAgent(userAgent);
      expect(result).toEqual({ name: 'npm', version: '9.2.0' });
    });

    it('should parse yarn user agent', () => {
      const userAgent = 'yarn/1.22.19 npm/? node/v18.16.0 darwin x64';
      const result = pkgFromUserAgent(userAgent);
      expect(result).toEqual({ name: 'yarn', version: '1.22.19' });
    });

    it('should parse pnpm user agent', () => {
      const userAgent = 'pnpm/7.16.0 node/v18.16.0 darwin x64';
      const result = pkgFromUserAgent(userAgent);
      expect(result).toEqual({ name: 'pnpm', version: '7.16.0' });
    });

    it('should parse bun user agent', () => {
      const userAgent = 'bun/0.1.0 node/v18.16.0 darwin x64';
      const result = pkgFromUserAgent(userAgent);
      expect(result).toEqual({ name: 'bun', version: '0.1.0' });
    });

    it('should return undefined for malformed user agent', () => {
      const userAgent = 'npmmmm/0.0.0 node/v18.16.0 darwin x64';
      const result = pkgFromUserAgent(userAgent);
      expect(result).toBeUndefined();
    });
  });
});
