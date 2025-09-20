import { useState } from 'react'
import {
  Box,
  Button,
  VStack,
  Heading,
  Text,
  Container,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription
} from '@chakra-ui/react'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const { loginWithGoogle } = useAuth()
  const toast = useToast()

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      await loginWithGoogle()
      toast({
        title: 'Successfully logged in!',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Login failed',
        description: 'Please try again',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Container maxW="md" centerContent>
      <VStack spacing={8} py={20}>
        <Box textAlign="center">
          <Heading size="2xl" color="brand.500" mb={4}>
            Moni URL Shortener
          </Heading>
          <Text fontSize="lg" color="gray.400">
            Admin Dashboard
          </Text>
        </Box>

        <Alert status="info" borderRadius="lg" bg="blue.900" borderColor="blue.700">
          <AlertIcon />
          <Box>
            <AlertTitle>Organization Access</AlertTitle>
            <AlertDescription fontSize="sm">
              This admin panel is restricted to users with @monumental-i.com email addresses.
            </AlertDescription>
          </Box>
        </Alert>

        <Box
          bg="gray.800"
          p={8}
          borderRadius="lg"
          border="1px"
          borderColor="gray.700"
          w="full"
        >
          <VStack spacing={6}>
            <Text fontSize="lg" color="gray.300" textAlign="center">
              Sign in with your Google account to access the admin panel
            </Text>
            
            <Button
              colorScheme="brand"
              size="lg"
              w="full"
              onClick={handleGoogleLogin}
              isLoading={loading}
              loadingText="Signing in..."
              _hover={{
                bg: 'brand.600',
              }}
            >
              Continue with Google
            </Button>
          </VStack>
        </Box>

        <Text fontSize="sm" color="gray.500" textAlign="center">
          Only users with @monumental-i.com email addresses can access this dashboard
        </Text>
      </VStack>
    </Container>
  )
}
