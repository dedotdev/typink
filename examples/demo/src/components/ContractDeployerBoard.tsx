import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import { SubstrateAddress, useDeployer, useDeployerTx } from 'typink';
import { greeterMetadata } from '@/contracts/deployments.ts';
import { GreeterContractApi } from '@/contracts/types/greeter';
import { useState } from 'react';
import { txToaster } from '@/utils/txToaster.tsx';
import { numberToHex } from 'dedot/utils';
import { useLocalStorage } from 'react-use';

interface DeployedContract {
  address: SubstrateAddress;
  at: number;
}

export function ContractDeployerBoard() {
  const wasmHash = greeterMetadata.source.hash;
  const { deployer } = useDeployer<GreeterContractApi>(greeterMetadata, wasmHash);
  const newGreeterTx = useDeployerTx(deployer, 'new');
  const [initMessage, setInitMessage] = useState<string>('');
  const [deployedContracts, setDeployedContracts] = useLocalStorage<DeployedContract[]>('DEPLOYED_CONTRACTS', []);

  const doDeploy = async () => {
    if (!initMessage || !deployer) return;

    const toaster = txToaster();
    try {
      const salt = numberToHex(Date.now());
      await newGreeterTx.signAndSend({
        args: [initMessage],
        txOptions: { salt },
        callback: ({ status }, contractAddress) => {
          console.log(status);

          if (status.type === 'BestChainBlockIncluded') {
            setInitMessage('');
          }

          // TODO improve this?
          if (contractAddress) {
            console.log('Contract is deployed at address', contractAddress);
            setDeployedContracts((prev) => [{ address: contractAddress, at: Date.now() }, ...(prev || [])]);
          }

          toaster.updateTxStatus(status);
        },
      });
    } catch (e: any) {
      console.error(e);
      toaster.onError(e);
    }
  };

  return (
    <Box>
      <Heading size='md' mb={4}>
        Deploy Greeter Contract
      </Heading>
      <form>
        <FormControl>
          <FormLabel>Initial message</FormLabel>
          <Input
            type='input'
            maxLength={50}
            value={initMessage}
            onChange={(e) => setInitMessage(e.target.value)}
            isDisabled={newGreeterTx.inBestBlockProgress}
          />
          <FormHelperText>Max 50 characters</FormHelperText>
        </FormControl>
        <Button
          size='sm'
          mt={4}
          isDisabled={!initMessage}
          isLoading={newGreeterTx.inBestBlockProgress}
          onClick={doDeploy}>
          Deploy
        </Button>
      </form>
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
