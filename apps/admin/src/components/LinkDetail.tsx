import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import {
  Box,
  VStack,
  HStack,
  Text,
  Heading,
  Badge,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Switch,
  Checkbox,
  useToast,
  Spinner,
  Center,
  IconButton,
  Tooltip
} from '@chakra-ui/react'
import { ArrowLeftIcon, CopyIcon, ExternalLinkIcon, TrashIcon } from 'lucide-react'
import { linksApi, UpdateLinkData } from '../lib/api'
import { formatDistanceToNow, format } from 'date-fns'

export default function LinkDetail() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()

  const { data: link, isLoading: linkLoading } = useQuery(
    ['link', slug],
    () => linksApi.get(slug!),
    { enabled: !!slug }
  )

  const { data: clicks, isLoading: clicksLoading } = useQuery(
    ['clicks', slug],
    () => {
      const to = new Date()
      const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000)
      return linksApi.getClicks(slug!, {
        from: from.toISOString(),
        to: to.toISOString(),
        limit: 100
      })
    },
    { enabled: !!slug }
  )

  const updateMutation = useMutation(
    (data: UpdateLinkData) => linksApi.update(slug!, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['link', slug])
        toast({
          title: 'Link updated successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      },
      onError: () => {
        toast({
          title: 'Failed to update link',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
      }
    }
  )

  const clearClicksMutation = useMutation(
    () => linksApi.clearClicks(slug!),
    {
      onSuccess: (data) => {
        queryClient.invalidateQueries(['link', slug])
        queryClient.invalidateQueries(['clicks', slug])
        toast({
          title: 'Click logs cleared',
          description: `Deleted ${data.deletedCount} click records`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        })
      },
      onError: () => {
        toast({
          title: 'Failed to clear click logs',
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

      const getShortUrl = (slug: string) => {
        return `https://go.monumental-i.com/${slug}`
      }

      if (linkLoading) {
    return (
      <Center h="400px">
        <Spinner size="xl" color="brand.500" />
      </Center>
    )
  }

      if (!link) {
        return (
          <Center h="400px">
            <Text color="red.400">Link not found</Text>
          </Center>
        )
      }

      return (
    <VStack spacing={6} align="stretch">
      {/* Header */}
      <HStack justifyContent="space-between">
        <HStack>
          <IconButton
            aria-label="Go back"
            icon={<ArrowLeftIcon size={16} />}
            onClick={() => navigate('/admin')}
            variant="ghost"
          />
          <Heading size="lg">{link.slug}</Heading>
          <Badge
            colorScheme={link.disabled ? 'red' : 'green'}
            variant="subtle"
          >
            {link.disabled ? 'Disabled' : 'Active'}
          </Badge>
        </HStack>
        
        <HStack>
          <Tooltip label="Copy short URL">
            <IconButton
              aria-label="Copy short URL"
              icon={<CopyIcon size={16} />}
              onClick={() => copyToClipboard(getShortUrl(link.slug))}
              variant="ghost"
            />
          </Tooltip>
          <Tooltip label="Open link">
            <IconButton
              aria-label="Open link"
              icon={<ExternalLinkIcon size={16} />}
              onClick={() => window.open(getShortUrl(link.slug), '_blank')}
              variant="ghost"
            />
          </Tooltip>
        </HStack>
      </HStack>

      {/* Link Info */}
      <Box bg="gray.800" p={6} borderRadius="lg" border="1px" borderColor="gray.700">
        <VStack spacing={4} align="stretch">
          <Box>
            <Text fontSize="sm" color="gray.400" mb={1}>Long URL</Text>
            <Text fontSize="sm" color="blue.400" wordBreak="break-all" cursor="pointer" _hover={{ textDecoration: "underline" }} onClick={() => window.open(link.longUrl, '_blank')}>
              {link.longUrl}
            </Text>
          </Box>
          
          <Box>
            <Text fontSize="sm" color="gray.400" mb={1}>Short URL</Text>
            <Text fontFamily="mono" fontSize="sm" color="brand.400">
              {getShortUrl(link.slug)}
            </Text>
          </Box>

          {link.notes && (
            <Box>
              <Text fontSize="sm" color="gray.400" mb={1}>Notes</Text>
              <Text fontSize="sm">{link.notes}</Text>
            </Box>
          )}

          {link.tags && link.tags.length > 0 && (
            <Box>
              <Text fontSize="sm" color="gray.400" mb={2}>Tags</Text>
              <HStack flexWrap="wrap">
                {link.tags.map((tag) => (
                  <Badge key={tag} colorScheme="brand" variant="subtle">
                    {tag}
                  </Badge>
                ))}
              </HStack>
            </Box>
          )}

          <HStack justifyContent="space-between">
            <Text fontSize="sm" color="gray.400">
              Created {link.createdAt ? (() => {
                try {
                  const date = new Date(link.createdAt);
                  return isNaN(date.getTime()) ? 'Invalid date' : formatDistanceToNow(date, { addSuffix: true });
                } catch {
                  return 'Invalid date';
                }
              })() : 'No date'}
            </Text>
            <HStack>
              <Text fontSize="sm" color="gray.400">Status:</Text>
              <Switch
                isChecked={!link.disabled}
                onChange={(e) => updateMutation.mutate({ disabled: !e.target.checked })}
                colorScheme="brand"
              />
            </HStack>
            <HStack>
              <Text fontSize="sm" color="gray.400">Email Alerts:</Text>
              <Checkbox
                isChecked={link.emailAlerts || false}
                onChange={(e) => updateMutation.mutate({ emailAlerts: e.target.checked })}
                colorScheme="brand"
              />
            </HStack>
          </HStack>
        </VStack>
      </Box>

      {/* Stats */}
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
        <Stat bg="gray.800" p={4} borderRadius="lg">
          <StatLabel>Total Clicks</StatLabel>
          <StatNumber color="brand.500">{link.clickCount}</StatNumber>
        </Stat>
        <Stat bg="gray.800" p={4} borderRadius="lg">
          <StatLabel>Last Clicked</StatLabel>
          <StatNumber color="green.500" fontSize="lg">
            {link.lastClickedAt ? (() => {
              try {
                const date = new Date(link.lastClickedAt);
                return isNaN(date.getTime()) ? 'Invalid date' : formatDistanceToNow(date, { addSuffix: true });
              } catch {
                return 'Invalid date';
              }
            })() : 'Never'}
          </StatNumber>
        </Stat>
        <Stat bg="gray.800" p={4} borderRadius="lg">
          <StatLabel>Recent Clicks</StatLabel>
          <StatNumber color="blue.500">{clicks?.length || 0}</StatNumber>
          <StatHelpText>Last 7 days</StatHelpText>
        </Stat>
      </SimpleGrid>


      {/* Recent Clicks */}
      <Box bg="gray.800" borderRadius="lg" border="1px" borderColor="gray.700" overflow="hidden">
        <Box p={4} borderBottom="1px" borderColor="gray.700">
          <HStack justifyContent="space-between">
            <Heading size="md">Recent Clicks</Heading>
            {clicks && clicks.length > 0 && (
              <Tooltip label="Clear all click logs">
                <IconButton
                  aria-label="Clear click logs"
                  icon={<TrashIcon size={16} />}
                  onClick={() => {
                    if (window.confirm(`Are you sure you want to clear all ${clicks.length} click logs? This action cannot be undone.`)) {
                      clearClicksMutation.mutate();
                    }
                  }}
                  variant="ghost"
                  colorScheme="red"
                  size="sm"
                  isLoading={clearClicksMutation.isLoading}
                />
              </Tooltip>
            )}
          </HStack>
        </Box>
        
        {clicksLoading ? (
          <Center h="200px">
            <Spinner color="brand.500" />
          </Center>
        ) : clicks && clicks.length > 0 ? (
          <Table variant="simple" colorScheme="gray">
                <Thead bg="gray.700">
                  <Tr>
                    <Th color="gray.300">Timestamp</Th>
                    <Th color="gray.300">Location</Th>
                    <Th color="gray.300">IP Address</Th>
                    <Th color="gray.300">ISP</Th>
                    <Th color="gray.300">Referer</Th>
                  </Tr>
                </Thead>
            <Tbody>
                  {clicks.slice(0, 20).map((click) => (
                    <Tr key={click.id} _hover={{ bg: 'gray.750' }}>
                      <Td>
                        <Text fontSize="sm">
                          {(() => {
                            try {
                              const date = new Date(click.ts);
                              return isNaN(date.getTime()) ? 'Invalid date' : format(date, 'MMM dd, HH:mm');
                            } catch {
                              return 'Invalid date';
                            }
                          })()}
                        </Text>
                      </Td>
                      <Td>
                        <VStack spacing={0} align="start">
                          {click.country && (
                            <Text fontSize="sm" fontWeight="medium">
                              {click.country}
                            </Text>
                          )}
                          {click.region && (
                            <Text fontSize="xs" color="gray.400">
                              {click.region}
                            </Text>
                          )}
                          {click.city && (
                            <Text fontSize="xs" color="gray.400">
                              {click.city}
                            </Text>
                          )}
                          {!click.country && !click.region && !click.city && (
                            <Text fontSize="sm" color="gray.400">
                              Unknown
                            </Text>
                          )}
                        </VStack>
                      </Td>
                      <Td>
                        <Text fontFamily="mono" fontSize="sm">
                          {click.ip}
                        </Text>
                      </Td>
                      <Td maxW="150px">
                        <Text fontSize="sm" isTruncated title={click.isp || 'Unknown'}>
                          {click.isp || 'Unknown'}
                        </Text>
                      </Td>
                      <Td maxW="150px">
                        <Text fontSize="sm" isTruncated title={click.referer || 'Direct'}>
                          {click.referer || 'Direct'}
                        </Text>
                      </Td>
                    </Tr>
                  ))}
            </Tbody>
          </Table>
        ) : (
          <Center h="200px">
            <Text color="gray.400">No clicks in the last 7 days</Text>
          </Center>
        )}
      </Box>
    </VStack>
  )
}
