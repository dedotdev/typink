import { Box, Flex, Tab, TabList, TabPanel, TabPanels, Tabs } from '@chakra-ui/react';
import { useState } from 'react';
import { useSearchParam } from 'react-use';
import BalanceInsufficientAlert from '@/components/shared/BalanceInsufficientAlert.tsx';
import NonMappedAccountAlert from '@/components/shared/NonMappedAccountAlert.tsx';
import MainFooter from '@/components/shared/MainFooter';
import MainHeader from '@/components/shared/MainHeader';
import ErrorBoundary from '@/components/shared/ErrorBoundary';
import FlipperBoard from '@/components/FlipperBoard.tsx';
import { ContractDeployerBoard } from '@/components/ContractDeployerBoard.tsx';
import Psp22Board from '@/components/Psp22Board.tsx';

function App() {
  const tab = useSearchParam('tab');
  const tabIndex = tab ? parseInt(tab) : 0;
  const [index, setIndex] = useState(tabIndex);

  const handleTabsChange = (index: number) => {
    setIndex(index);
    history.pushState({}, '', location.pathname + `?tab=${index}`);
  };

  return (
    <Flex direction='column' minHeight='100vh'>
      <MainHeader />
      <ErrorBoundary>
        <Box maxWidth='760px' mx='auto' my={4} px={4} flex={1} w='full'>
          <BalanceInsufficientAlert />
          <NonMappedAccountAlert />
          <Tabs index={index} onChange={handleTabsChange}>
            <TabList>
              <Tab>Flipper Contract</Tab>
              <Tab>PSP22 Contract</Tab>
              <Tab>Deploy Flipper Contracts</Tab>
            </TabList>

            <TabPanels>
              <TabPanel>
                <FlipperBoard />
              </TabPanel>
              <TabPanel>
                <Psp22Board />
              </TabPanel>
              <TabPanel>
                <ContractDeployerBoard />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </ErrorBoundary>
      <MainFooter />
    </Flex>
  );
}

export default App;
