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
import { ArrowLeftIcon, CopyIcon, ExternalLinkIcon } from 'lucide-react'
import { linksApi, Click, UpdateLinkData } from '../lib/api'
import { formatDistanceToNow, format } from 'date-fns'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'

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

  // Process clicks data for chart
  const processClicksForChart = (clicks: Click[]) => {
    const dailyClicks: Record<string, number> = {}
    
    clicks.forEach(click => {
      try {
        const date = new Date(click.ts);
        if (!isNaN(date.getTime())) {
          const dateStr = format(date, 'yyyy-MM-dd');
          dailyClicks[dateStr] = (dailyClicks[dateStr] || 0) + 1;
        }
      } catch {
        // Skip invalid dates
      }
    })

    return Object.entries(dailyClicks)
      .map(([date, count]) => ({ date, clicks: count }))
      .sort((a, b) => a.date.localeCompare(b.date))
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

  const chartData = clicks ? processClicksForChart(clicks) : []

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
            <Text fontSize="sm" color="blue.400" wordBreak="break-all">
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

      {/* Chart */}
      {chartData.length > 0 && (
        <Box bg="gray.800" p={6} borderRadius="lg" border="1px" borderColor="gray.700">
          <Heading size="md" mb={4}>Click Trends</Heading>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="gray.600" />
              <XAxis 
                dataKey="date" 
                stroke="gray.400"
                fontSize={12}
              />
              <YAxis stroke="gray.400" fontSize={12} />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: 'gray.700', 
                  border: '1px solid gray.600',
                  borderRadius: '8px',
                  color: 'white'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="clicks" 
                stroke="#0ea5e9" 
                strokeWidth={2}
                dot={{ fill: '#0ea5e9', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      )}

      {/* Recent Clicks */}
      <Box bg="gray.800" borderRadius="lg" border="1px" borderColor="gray.700" overflow="hidden">
        <Box p={4} borderBottom="1px" borderColor="gray.700">
          <Heading size="md">Recent Clicks</Heading>
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
