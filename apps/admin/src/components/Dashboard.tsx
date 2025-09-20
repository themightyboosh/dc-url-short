import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { useWindowFocusRefresh, useMultiWindowDetection } from '../hooks/useMultiWindow'
import {
  Box,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  InputGroup,
  InputLeftElement,
  HStack,
  VStack,
  Text,
  Badge,
  IconButton,
  useDisclosure,
  useToast,
  Spinner,
  Center,
  Flex,
  Heading,
  Stat,
  StatLabel,
  StatNumber,
  SimpleGrid,
  Checkbox,
  Switch
} from '@chakra-ui/react'
import { SearchIcon, PlusIcon, CopyIcon, ExternalLinkIcon, BarChart3Icon, TrashIcon } from 'lucide-react'
import { linksApi, settingsApi } from '../lib/api'
import CreateLinkModal from './CreateLinkModal'
import { formatDistanceToNow } from 'date-fns'

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  const queryClient = useQueryClient()

  // Multi-window detection and focus refresh
  const { isRefreshing } = useWindowFocusRefresh()
  useMultiWindowDetection()

  const { data: linksData, isLoading, error } = useQuery(
    ['links', page, searchTerm],
    () => linksApi.list({ 
      limit: 20, 
      offset: page * 20, 
      search: searchTerm || undefined 
    }),
    {
      keepPreviousData: true,
      staleTime: 30 * 1000, // 30 seconds - shorter for multi-window scenarios
      refetchOnWindowFocus: true,
      refetchOnMount: true,
    }
  )

  const { data: settings } = useQuery(
    'settings',
    () => settingsApi.get(),
    {
      staleTime: 30 * 1000, // 30 seconds - shorter for multi-window scenarios
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      onError: (error: any) => {
        console.error('Settings fetch error:', error)
      }
    }
  )

  const updateSettingsMutation = useMutation(
    (data: { globalEmailAlerts: boolean }) => settingsApi.update(data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('settings')
        toast({
          title: 'Settings updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      },
      onError: (error: any) => {
        console.error('Settings update error:', error)
        toast({
          title: 'Failed to update settings',
          description: error.response?.data?.error || error.message || 'Please try again',
          status: 'error',
          duration: 5000,
          isClosable: true,
        })
      }
    }
  )

  const updateLinkMutation = useMutation(
    ({ slug, data }: { slug: string; data: any }) => linksApi.update(slug, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('links')
        toast({
          title: 'Link updated successfully',
          status: 'success',
          duration: 2000,
          isClosable: true,
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Failed to update link',
          description: error.response?.data?.error || 'Please try again',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      }
    }
  )

  const deleteLinkMutation = useMutation(
    (slug: string) => linksApi.delete(slug),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('links')
        toast({
          title: 'Link deleted successfully',
          status: 'success',
          duration: 2000,
          isClosable: true,
        })
      },
      onError: (error: any) => {
        toast({
          title: 'Failed to delete link',
          description: error.response?.data?.error || 'Please try again',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      }
    }
  )

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied to clipboard',
      status: 'success',
      duration: 2000,
      isClosable: true,
    })
  }

  const handleDeleteLink = (slug: string) => {
    deleteLinkMutation.mutate(slug)
  }

  const getShortUrl = (slug: string) => {
    return `https://go.monumental-i.com/${slug}`
  }

  if (isLoading) {
    return (
      <Center h="400px">
        <Spinner size="xl" color="brand.500" />
      </Center>
    )
  }

  if (error) {
    return (
      <Center h="400px">
        <Text color="red.400">Failed to load links</Text>
      </Center>
    )
  }

  const links = linksData?.data || []
  const totalClicks = links.reduce((sum, link) => sum + link.clickCount, 0)

  return (
    <VStack spacing={6} align="stretch">
      {/* Stats */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        <Stat bg="gray.800" p={4} borderRadius="lg">
          <StatLabel>Total Links</StatLabel>
          <StatNumber color="brand.500">{linksData?.pagination.total || 0}</StatNumber>
        </Stat>
        <Stat bg="gray.800" p={4} borderRadius="lg">
          <StatLabel>Total Clicks</StatLabel>
          <StatNumber color="green.500">{totalClicks}</StatNumber>
        </Stat>
        <Stat bg="gray.800" p={4} borderRadius="lg">
          <StatLabel>Active Links</StatLabel>
          <StatNumber color="blue.500">
            {links.filter(link => !link.disabled).length}
          </StatNumber>
        </Stat>
      </SimpleGrid>

      {/* Global Settings */}
      <Box bg="gray.800" p={6} borderRadius="lg" border="1px" borderColor="gray.700">
        <VStack spacing={4} align="stretch">
          <Heading size="md">Global Settings</Heading>
          <HStack justifyContent="space-between">
            <VStack align="start" spacing={1}>
              <Text fontWeight="medium">Email Alerts</Text>
              <Text fontSize="sm" color="gray.400">
                Enable email notifications for all link clicks
              </Text>
            </VStack>
            <Checkbox
              isChecked={settings?.globalEmailAlerts || false}
              onChange={(e) => updateSettingsMutation.mutate({ globalEmailAlerts: e.target.checked })}
              colorScheme="brand"
              size="lg"
              isDisabled={updateSettingsMutation.isLoading}
            />
          </HStack>
        </VStack>
      </Box>

      {/* Header */}
      <Flex justifyContent="space-between" alignItems="center">
        <HStack>
          <Heading size="lg">Monumental URL Shortener</Heading>
          {isRefreshing && (
            <Badge colorScheme="blue" variant="subtle">
              Refreshing...
            </Badge>
          )}
        </HStack>
        <Button
          leftIcon={<PlusIcon size={16} />}
          colorScheme="brand"
          onClick={onOpen}
        >
          Create Link
        </Button>
      </Flex>

      {/* Search */}
      <InputGroup maxW="400px">
        <InputLeftElement pointerEvents="none">
          <SearchIcon size={16} color="gray.400" />
        </InputLeftElement>
        <Input
          placeholder="Search links..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          bg="gray.800"
          borderColor="gray.700"
          _focus={{ borderColor: 'brand.500' }}
        />
      </InputGroup>

      {/* Links Table */}
      <Box
        bg="gray.800"
        borderRadius="lg"
        overflow="hidden"
        border="1px"
        borderColor="gray.700"
      >
        <Table variant="simple" colorScheme="gray">
          <Thead bg="gray.700">
            <Tr>
              <Th color="gray.300">Slug</Th>
              <Th color="gray.300">Long URL</Th>
              <Th color="gray.300">Clicks</Th>
              <Th color="gray.300">Status</Th>
              <Th color="gray.300">Email Alerts</Th>
              <Th color="gray.300">Created</Th>
              <Th color="gray.300">Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {links.map((link) => (
              <Tr key={link.id} _hover={{ bg: 'gray.750' }}>
                <Td>
                  <Text fontFamily="mono" fontSize="sm">
                    {link.slug}
                  </Text>
                </Td>
                    <Td maxW="300px">
                      <Text
                        fontSize="sm"
                        isTruncated
                        title={link.longUrl}
                        color="blue.400"
                        cursor="pointer"
                        _hover={{ textDecoration: "underline" }}
                        onClick={() => window.open(link.longUrl, '_blank')}
                      >
                        {link.longUrl}
                      </Text>
                    </Td>
                <Td>
                  <Text fontWeight="medium">{link.clickCount}</Text>
                </Td>
                <Td>
                  <Badge
                    colorScheme={link.disabled ? 'red' : 'green'}
                    variant="subtle"
                  >
                    {link.disabled ? 'Disabled' : 'Active'}
                  </Badge>
                </Td>
                <Td>
                  <HStack spacing={2}>
                    <Switch
                      isChecked={link.emailAlerts || false}
                      onChange={(e) => updateLinkMutation.mutate({ 
                        slug: link.slug, 
                        data: { emailAlerts: e.target.checked } 
                      })}
                      colorScheme="brand"
                      size="sm"
                      isDisabled={updateLinkMutation.isLoading}
                    />
                    <Text fontSize="xs" color="gray.400">
                      {link.emailAlerts ? 'On' : 'Off'}
                    </Text>
                  </HStack>
                </Td>
                <Td>
                  <Text fontSize="sm" color="gray.400">
                    {link.createdAt ? (() => {
                      try {
                        const date = new Date(link.createdAt);
                        return isNaN(date.getTime()) ? 'Invalid date' : formatDistanceToNow(date, { addSuffix: true });
                      } catch {
                        return 'Invalid date';
                      }
                    })() : 'No date'}
                  </Text>
                </Td>
                <Td>
                  <HStack spacing={2}>
                    <IconButton
                      aria-label="Copy short URL"
                      icon={<CopyIcon size={14} />}
                      size="sm"
                      variant="ghost"
                      onClick={() => copyToClipboard(getShortUrl(link.slug))}
                    />
                    <IconButton
                      aria-label="View analytics"
                      icon={<BarChart3Icon size={14} />}
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(`/admin/links/${link.slug}`, '_blank')}
                    />
                    <IconButton
                      aria-label="Open link"
                      icon={<ExternalLinkIcon size={14} />}
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(getShortUrl(link.slug), '_blank')}
                    />
                    <IconButton
                      aria-label="Delete link"
                      icon={<TrashIcon size={14} />}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => handleDeleteLink(link.slug)}
                      isLoading={deleteLinkMutation.isLoading}
                    />
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>

      {/* Pagination */}
      {linksData?.pagination.hasMore && (
        <Flex justifyContent="center">
          <Button
            onClick={() => setPage(page + 1)}
            isLoading={isLoading}
            loadingText="Loading..."
          >
            Load More
          </Button>
        </Flex>
      )}

      <CreateLinkModal isOpen={isOpen} onClose={onClose} />
    </VStack>
  )
}
