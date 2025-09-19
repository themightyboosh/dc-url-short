import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
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
  StatHelpText,
  SimpleGrid
} from '@chakra-ui/react'
import { SearchIcon, PlusIcon, CopyIcon, ExternalLinkIcon, BarChart3Icon } from 'lucide-react'
import { linksApi, Link } from '../lib/api'
import CreateLinkModal from './CreateLinkModal'
import { formatDistanceToNow } from 'date-fns'

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(0)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  const queryClient = useQueryClient()

  const { data: linksData, isLoading, error } = useQuery(
    ['links', page, searchTerm],
    () => linksApi.list({ 
      limit: 20, 
      offset: page * 20, 
      search: searchTerm || undefined 
    }),
    {
      keepPreviousData: true,
    }
  )

  const deleteMutation = useMutation(linksApi.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('links')
      toast({
        title: 'Link deleted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      })
    },
    onError: () => {
      toast({
        title: 'Failed to delete link',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
    }
  })

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: 'Copied to clipboard',
      status: 'success',
      duration: 2000,
      isClosable: true,
    })
  }

  const getShortUrl = (slug: string) => {
    return `https://go.monumental-i.com/s/${slug}`
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

      {/* Header */}
      <Flex justifyContent="space-between" alignItems="center">
        <Heading size="lg">Links Management</Heading>
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
                  <Text fontSize="sm" color="gray.400">
                    {formatDistanceToNow(new Date(link.createdAt), { addSuffix: true })}
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
