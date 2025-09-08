import { stringCamelCase } from '@dedot/utils';
import { InkVersion, LEGACY_NETWORKS, V6_NETWORKS, NetworkConfig } from '../types.js';

export interface NetworkTemplateConfig {
  supportedNetworks: string;
  defaultNetworkId: string;
  deployments: string;
}

export function getNetworkConfig(inkVersion: InkVersion, selectedNetworks: string[]): NetworkTemplateConfig {
  const availableNetworks = inkVersion === InkVersion.InkV6 ? V6_NETWORKS : LEGACY_NETWORKS;
  const selectedNetworkConfigs = availableNetworks.filter((network) =>
    selectedNetworks.map((one) => stringCamelCase(one)).includes(network.value),
  );

  if (selectedNetworkConfigs.length === 0) {
    throw new Error('No valid networks selected');
  }

  const supportedNetworks = selectedNetworkConfigs.map((network) => network.value).join(', ');
  const defaultNetworkId = `${selectedNetworkConfigs[0].value}.id`;
  const deployments = generateDeployments(selectedNetworkConfigs, inkVersion);

  return {
    supportedNetworks,
    defaultNetworkId,
    deployments,
  };
}

function generateDeployments(networkConfigs: NetworkConfig[], inkVersion: InkVersion): string {
  const contractName = inkVersion === InkVersion.InkV6 ? 'flipper' : 'greeter';
  const metadataName = inkVersion === InkVersion.InkV6 ? 'flipperMetadata' : 'greeterMetadata';

  const deploymentEntries = networkConfigs
    .map(
      (network) =>
        `{
          id: ContractId.${contractName.toUpperCase()},
          metadata: ${metadataName} as any,
          network: ${network.value}.id,
          address: '${network.address}',
        }`,
    )
    .join(',\n');

  return `export const ${contractName}Deployments: ContractDeployment[] = [${deploymentEntries}];`;
}
