import { ReactNode } from 'react'
import {
  Box,
  Flex,
  Heading,
  Button,
  HStack,
  useColorModeValue,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Avatar,
  Text
} from '@chakra-ui/react'
import { ChevronDownIcon, LogOutIcon, SettingsIcon } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth()
  const toast = useToast()

  const handleLogout = async () => {
    try {
      await logout()
      toast({
        title: 'Logged out successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    } catch (error) {
      toast({
        title: 'Logout failed',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  }

  return (
    <Box minH="100vh" bg="gray.900">
      {/* Header */}
      <Box
        bg={useColorModeValue('white', 'gray.800')}
        px={4}
        py={3}
        borderBottom="1px"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
        position="sticky"
        top={0}
        zIndex={10}
      >
        <Flex justifyContent="space-between" alignItems="center">
          <HStack spacing={4}>
            <Heading size="lg" color="brand.500">
              Moni URL Shortener
            </Heading>
            <Text fontSize="sm" color="gray.500">
              Admin Dashboard
            </Text>
          </HStack>

          <HStack spacing={4}>
            <Menu>
              <MenuButton
                as={Button}
                variant="ghost"
                rightIcon={<ChevronDownIcon size={16} />}
                leftIcon={<Avatar size="sm" src={user?.photoURL || undefined} />}
              >
                <Text fontSize="sm">{user?.email}</Text>
              </MenuButton>
              <MenuList bg="gray.800" borderColor="gray.700">
                <MenuItem
                  icon={<SettingsIcon size={16} />}
                  bg="gray.800"
                  _hover={{ bg: 'gray.700' }}
                >
                  Settings
                </MenuItem>
                <MenuItem
                  icon={<LogOutIcon size={16} />}
                  bg="gray.800"
                  _hover={{ bg: 'gray.700' }}
                  onClick={handleLogout}
                >
                  Logout
                </MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </Flex>
      </Box>

      {/* Main Content */}
      <Box p={6}>
        {children}
      </Box>
    </Box>
  )
}
