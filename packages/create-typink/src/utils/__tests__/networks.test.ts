import { describe, expect, it } from 'vitest';
import { getNetworkConfig } from '../networks.js';
import { InkVersion } from '../../types.js';

describe('networks', () => {
  describe('getNetworkConfig', () => {
    describe('InkV6 networks', () => {
      it('should return correct config for single V6 network', () => {
        const result = getNetworkConfig(InkVersion.InkV6, ['Passet Hub']);

        expect(result.supportedNetworks).toBe('passetHub');
        expect(result.defaultNetworkId).toBe('passetHub.id');
        expect(result.deployments).toContain('flipperDeployments');
        expect(result.deployments).toContain('flipperMetadata');
        expect(result.deployments).toContain('ContractId.FLIPPER');
        expect(result.deployments).toContain('passetHub.id');
        expect(result.deployments).toContain('0x87396fA7d7FcE9B3e4b11a733C98700968426c50');
      });

      it('should return correct config for multiple V6 networks', () => {
        const result = getNetworkConfig(InkVersion.InkV6, ['Passet Hub', 'Kusama Asset Hub']);

        expect(result.supportedNetworks).toBe('passetHub, kusamaAssetHub');
        expect(result.defaultNetworkId).toBe('passetHub.id');
        expect(result.deployments).toContain('flipperDeployments');
        expect(result.deployments).toContain('0x87396fA7d7FcE9B3e4b11a733C98700968426c50');
        expect(result.deployments).toContain('0xFf6A8342Ae4440D95BB5b9204a72f328c671b751');
      });

      it('should handle camelCase network names for V6', () => {
        const result = getNetworkConfig(InkVersion.InkV6, ['passetHub']);

        expect(result.supportedNetworks).toBe('passetHub');
        expect(result.defaultNetworkId).toBe('passetHub.id');
      });

      it('should return correct config for all V6 networks', () => {
        const result = getNetworkConfig(InkVersion.InkV6, ['Passet Hub', 'Kusama Asset Hub', 'Westend Asset Hub']);

        expect(result.supportedNetworks).toBe('passetHub, kusamaAssetHub, westendAssetHub');
        expect(result.defaultNetworkId).toBe('passetHub.id');
        expect(result.deployments).toContain('0x87396fA7d7FcE9B3e4b11a733C98700968426c50');
        expect(result.deployments).toContain('0xFf6A8342Ae4440D95BB5b9204a72f328c671b751');
        expect(result.deployments).toContain('0xA8237FBAC4387CBcc595757d9bA6DEA296332449');
      });
    });

    describe('Legacy networks', () => {
      it('should return correct config for single legacy network', () => {
        const result = getNetworkConfig(InkVersion.InkLegacy, ['Aleph Zero Testnet']);

        expect(result.supportedNetworks).toBe('alephZeroTestnet');
        expect(result.defaultNetworkId).toBe('alephZeroTestnet.id');
        expect(result.deployments).toContain('greeterDeployments');
        expect(result.deployments).toContain('greeterMetadata');
        expect(result.deployments).toContain('ContractId.GREETER');
        expect(result.deployments).toContain('alephZeroTestnet.id');
        expect(result.deployments).toContain('5CDia8Y46K7CbD2vLej2SjrvxpfcbrLVqK2He3pTJod2Eyik');
      });

      it('should return correct config for multiple legacy networks', () => {
        const result = getNetworkConfig(InkVersion.InkLegacy, ['Aleph Zero', 'Astar']);

        expect(result.supportedNetworks).toBe('alephZero, astar');
        expect(result.defaultNetworkId).toBe('alephZero.id');
        expect(result.deployments).toContain('greeterDeployments');
        expect(result.deployments).toContain('5CYZtKBxuva33JREQkbeaE4ed2niWb1ijS4pgXbFD61yZti1');
        expect(result.deployments).toContain('WejJavPYsGgcY8Dr5KQSJrTssxUh5EbeYiCfdddeo5aTbse');
      });

      it('should handle camelCase network names for legacy', () => {
        const result = getNetworkConfig(InkVersion.InkLegacy, ['alephZero']);

        expect(result.supportedNetworks).toBe('alephZero');
        expect(result.defaultNetworkId).toBe('alephZero.id');
      });

      it('should return correct config for all legacy networks', () => {
        const result = getNetworkConfig(InkVersion.InkLegacy, ['Aleph Zero Testnet', 'Aleph Zero', 'Astar']);

        expect(result.supportedNetworks).toBe('alephZeroTestnet, alephZero, astar');
        expect(result.defaultNetworkId).toBe('alephZeroTestnet.id');
        expect(result.deployments).toContain('5CDia8Y46K7CbD2vLej2SjrvxpfcbrLVqK2He3pTJod2Eyik');
        expect(result.deployments).toContain('5CYZtKBxuva33JREQkbeaE4ed2niWb1ijS4pgXbFD61yZti1');
        expect(result.deployments).toContain('WejJavPYsGgcY8Dr5KQSJrTssxUh5EbeYiCfdddeo5aTbse');
      });
    });

    describe('deployment string generation', () => {
      it('should generate correct deployment structure for V6', () => {
        const result = getNetworkConfig(InkVersion.InkV6, ['Passet Hub']);

        expect(result.deployments).toMatch(/export const flipperDeployments: ContractDeployment\[\] = \[/);
        expect(result.deployments).toMatch(/id: ContractId\.FLIPPER,/);
        expect(result.deployments).toMatch(/metadata: flipperMetadata as any,/);
        expect(result.deployments).toMatch(/network: passetHub\.id,/);
        expect(result.deployments).toMatch(/address: '0x87396fA7d7FcE9B3e4b11a733C98700968426c50',/);
        expect(result.deployments).toMatch(/export const deployments = \[\.\.\.flipperDeployments\];/);
      });

      it('should generate correct deployment structure for legacy', () => {
        const result = getNetworkConfig(InkVersion.InkLegacy, ['Aleph Zero']);

        expect(result.deployments).toMatch(/export const greeterDeployments: ContractDeployment\[\] = \[/);
        expect(result.deployments).toMatch(/id: ContractId\.GREETER,/);
        expect(result.deployments).toMatch(/metadata: greeterMetadata as any,/);
        expect(result.deployments).toMatch(/network: alephZero\.id,/);
        expect(result.deployments).toMatch(/address: '5CYZtKBxuva33JREQkbeaE4ed2niWb1ijS4pgXbFD61yZti1',/);
        expect(result.deployments).toMatch(/export const deployments = \[\.\.\.greeterDeployments\];/);
      });

      it('should generate multiple deployment entries for multiple networks', () => {
        const result = getNetworkConfig(InkVersion.InkV6, ['Passet Hub', 'Kusama Asset Hub']);

        // Should contain both network entries
        const deploymentEntries = result.deployments.match(/{\s*id: ContractId\.FLIPPER,[\s\S]*?}/g);
        expect(deploymentEntries).toHaveLength(2);

        // Should be comma-separated
        expect(result.deployments).toMatch(/},\s*{\s*id: ContractId\.FLIPPER/);
      });
    });

    describe('error handling', () => {
      it('should throw error when no valid networks are selected for V6', () => {
        expect(() => {
          getNetworkConfig(InkVersion.InkV6, ['Invalid Network']);
        }).toThrow('No valid networks selected');
      });

      it('should throw error when no valid networks are selected for legacy', () => {
        expect(() => {
          getNetworkConfig(InkVersion.InkLegacy, ['Invalid Network']);
        }).toThrow('No valid networks selected');
      });

      it('should throw error when empty array is provided', () => {
        expect(() => {
          getNetworkConfig(InkVersion.InkV6, []);
        }).toThrow('No valid networks selected');
      });

      it('should throw error when mixing V6 and legacy network names', () => {
        expect(() => {
          getNetworkConfig(InkVersion.InkV6, ['Aleph Zero']); // Legacy network with V6 version
        }).toThrow('No valid networks selected');

        expect(() => {
          getNetworkConfig(InkVersion.InkLegacy, ['Passet Hub']); // V6 network with legacy version
        }).toThrow('No valid networks selected');
      });
    });

    describe('network name normalization', () => {
      it('should handle different case variations for V6 networks', () => {
        const result1 = getNetworkConfig(InkVersion.InkV6, ['passet hub']);
        const result2 = getNetworkConfig(InkVersion.InkV6, ['PASSET HUB']);
        const result3 = getNetworkConfig(InkVersion.InkV6, ['Passet Hub']);

        expect(result1.supportedNetworks).toBe('passetHub');
        expect(result2.supportedNetworks).toBe('passetHub');
        expect(result3.supportedNetworks).toBe('passetHub');
      });

      it('should handle different case variations for legacy networks', () => {
        const result1 = getNetworkConfig(InkVersion.InkLegacy, ['aleph zero']);
        const result2 = getNetworkConfig(InkVersion.InkLegacy, ['ALEPH ZERO']);
        const result3 = getNetworkConfig(InkVersion.InkLegacy, ['Aleph Zero']);

        expect(result1.supportedNetworks).toBe('alephZero');
        expect(result2.supportedNetworks).toBe('alephZero');
        expect(result3.supportedNetworks).toBe('alephZero');
      });
    });
  });
});
