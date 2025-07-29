import { Alert, AlertDescription, AlertIcon, AlertTitle, Box, Button, Text } from '@chakra-ui/react';
import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box maxWidth='760px' mx='auto' my={4} px={4} flex={1} w='full'>
          <Alert
            p={12}
            status='error'
            flexDirection='column'
            alignItems='center'
            justifyContent='center'
            textAlign='center'>
            <AlertIcon boxSize='40px' mr={0} />
            <AlertTitle mt={4} mb={1} fontSize='lg'>
              Something went wrong
            </AlertTitle>
            <AlertDescription maxWidth='sm'>
              <Text mb={4}>
                An unexpected error occurred while loading this page. Please try refreshing or contact support if the
                problem persists.
              </Text>
              {this.state.error && (
                <Text fontSize='sm' color='gray.500' mb={6}>
                  Error: {this.state.error.message}
                </Text>
              )}
              <Button colorScheme='blackAlpha' variant='outline' size='sm' onClick={this.handleReset}>
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}
