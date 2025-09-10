import { Box, Button, Heading, Table, TableContainer, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import { SubstrateAddress, useDeployer, useDeployerTx, txToaster } from 'typink';
import { flipperMetadata } from '@/contracts/deployments.ts';
import { generateRandomHex } from 'dedot/utils';
import { useLocalStorage } from 'react-use';
import { Flipper6ContractApi } from '@/contracts/types/flipper6';

interface DeployedContract {
  address: SubstrateAddress;
  at: number;
}

export function ContractDeployerBoard() {
  const wasmHash = flipperMetadata.source.hash;
  const { deployer } = useDeployer<Flipper6ContractApi>(flipperMetadata, wasmHash);
  const newFlipperTx = useDeployerTx(deployer, 'new');
  const [deployedContracts, setDeployedContracts] = useLocalStorage<DeployedContract[]>('DEPLOYED_CONTRACTS', []);

  const doDeploy = async () => {
    if (!deployer) return;

    const toaster = txToaster();
    try {
      const salt = generateRandomHex();
      await newFlipperTx.signAndSend({
        args: [true],
        txOptions: { salt },
        callback: (progress, contractAddress) => {
          const { status } = progress;
          console.log(status);

          // TODO improve this?
          if (contractAddress) {
            console.log('Contract is deployed at address', contractAddress);
            setDeployedContracts((prev) => [{ address: contractAddress, at: Date.now() }, ...(prev || [])]);
          }

          toaster.onTxProgress(progress);
        },
      });
    } catch (e: any) {
      console.error(e);
      toaster.onTxError(e);
    }
  };

  return (
    <Box>
      <Heading size='md' mb={4}>
        Deploy Flipper Contract
      </Heading>
      <Button my={4} isLoading={newFlipperTx.inBestBlockProgress} onClick={doDeploy}>
        Deploy
      </Button>
      <Box mt={4}>
        <Heading size='sm' mb={4}>
          Deployed Contracts
        </Heading>
        <TableContainer>
          <Table variant='simple' size='sm'>
            <Thead>
              <Tr>
                <Th>Contract Address</Th>
                <Th>Deployed at</Th>
              </Tr>
            </Thead>
            <Tbody>
              {deployedContracts!.map(({ address, at }) => (
                <Tr key={address}>
                  <Td>{address}</Td>
                  <Td>{new Date(at).toLocaleString()}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </TableContainer>
      </Box>
    </Box>
  );
}
