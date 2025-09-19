import { Routes, Route, Navigate } from 'react-router-dom'
import { Box, Spinner, Center, Alert, AlertIcon, AlertTitle, AlertDescription, Container, VStack } from '@chakra-ui/react'
import { useAuth } from './hooks/useAuth'
import LoginPage from './components/LoginPage'
import Dashboard from './components/Dashboard'
import LinkDetail from './components/LinkDetail'
import Layout from './components/Layout'

function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="brand.500" />
      </Center>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  // Check if user is from monumental-i.com organization
  if (!user.email?.endsWith('@monumental-i.com')) {
    return (
      <Container maxW="md" centerContent>
        <VStack spacing={8} py={20}>
          <Alert status="error" borderRadius="lg" bg="red.900" borderColor="red.700">
            <AlertIcon />
            <Box>
              <AlertTitle>Access Denied</AlertTitle>
              <AlertDescription fontSize="sm">
                This admin panel is restricted to users with @monumental-i.com email addresses.
                Your email ({user.email}) is not authorized to access this dashboard.
              </AlertDescription>
            </Box>
          </Alert>
        </VStack>
      </Container>
    )
  }

  return (
    <Box minH="100vh" bg="gray.900">
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/admin" replace />} />
          <Route path="/admin" element={<Dashboard />} />
          <Route path="/admin/links/:slug" element={<LinkDetail />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Layout>
    </Box>
  )
}

export default App
