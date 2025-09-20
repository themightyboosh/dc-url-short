import { useState } from 'react'
import { useMutation, useQueryClient } from 'react-query'
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  HStack,
  Text,
  useToast,
  FormErrorMessage,
  Tag,
  TagLabel,
  TagCloseButton,
  Checkbox
} from '@chakra-ui/react'
import { PlusIcon } from 'lucide-react'
import { linksApi, CreateLinkData } from '../lib/api'
import { useAuth } from '../hooks/useAuth'

interface CreateLinkModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreateLinkModal({ isOpen, onClose }: CreateLinkModalProps) {
  const [formData, setFormData] = useState({
    slug: '',
    longUrl: '',
    notes: '',
    tags: [] as string[],
    emailAlerts: false,
  })
  const [tagInput, setTagInput] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { user } = useAuth()
  const toast = useToast()
  const queryClient = useQueryClient()

  const createMutation = useMutation(linksApi.create, {
    onSuccess: (data) => {
      queryClient.invalidateQueries('links')
      toast({
        title: 'Link created successfully',
        description: `Short URL created: ${data.slug}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      })
      handleClose()
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to create link',
        description: error.response?.data?.error || 'Please try again',
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  })

  const handleClose = () => {
    setFormData({ slug: '', longUrl: '', notes: '', tags: [], emailAlerts: false })
    setTagInput('')
    setErrors({})
    onClose()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.longUrl) {
      setErrors({ longUrl: 'URL is required' })
      return
    }

    if (!user?.email) {
      toast({
        title: 'Authentication error',
        status: 'error',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    const linkData: CreateLinkData = {
      slug: formData.slug || undefined,
      longUrl: formData.longUrl,
      createdBy: user.email,
      notes: formData.notes || undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
      emailAlerts: formData.emailAlerts,
    }

    createMutation.mutate(linkData)
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }))
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }


  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent bg="gray.800" borderColor="gray.700">
        <ModalHeader>Create New Link</ModalHeader>
        <ModalCloseButton />
        
        <form onSubmit={handleSubmit}>
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isInvalid={!!errors.longUrl}>
                <FormLabel>Long URL *</FormLabel>
                <Input
                  placeholder="https://example.com/very-long-url"
                  value={formData.longUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, longUrl: e.target.value }))}
                  bg="gray.700"
                  borderColor="gray.600"
                  _focus={{ borderColor: 'brand.500' }}
                />
                <FormErrorMessage>{errors.longUrl}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel>Custom Slug (optional)</FormLabel>
                <Input
                  placeholder="my-custom-slug"
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  bg="gray.700"
                  borderColor="gray.600"
                  _focus={{ borderColor: 'brand.500' }}
                />
                <Text fontSize="sm" color="gray.400" mt={1}>
                  If empty, a random slug will be generated
                </Text>
              </FormControl>

              <FormControl>
                <FormLabel>Email Alerts</FormLabel>
                <Checkbox
                  isChecked={formData.emailAlerts}
                  onChange={(e) => setFormData(prev => ({ ...prev, emailAlerts: e.target.checked }))}
                  colorScheme="brand"
                >
                  <Text fontSize="sm" color="gray.400">
                    Send email alerts to Google authorized users when this link is clicked
                  </Text>
                </Checkbox>
              </FormControl>

              <FormControl>
                <FormLabel>Notes (optional)</FormLabel>
                <Textarea
                  placeholder="Add notes about this link..."
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  bg="gray.700"
                  borderColor="gray.600"
                  _focus={{ borderColor: 'brand.500' }}
                  rows={3}
                />
              </FormControl>

              <FormControl>
                <FormLabel>Tags (optional)</FormLabel>
                <HStack>
                  <Input
                    placeholder="Add tag..."
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    bg="gray.700"
                    borderColor="gray.600"
                    _focus={{ borderColor: 'brand.500' }}
                  />
                  <Button
                    leftIcon={<PlusIcon size={14} />}
                    onClick={addTag}
                    isDisabled={!tagInput.trim()}
                    size="sm"
                  >
                    Add
                  </Button>
                </HStack>
                {formData.tags.length > 0 && (
                  <HStack mt={2} flexWrap="wrap">
                    {formData.tags.map((tag) => (
                      <Tag key={tag} colorScheme="brand" size="sm">
                        <TagLabel>{tag}</TagLabel>
                        <TagCloseButton onClick={() => removeTag(tag)} />
                      </Tag>
                    ))}
                  </HStack>
                )}
              </FormControl>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={handleClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              colorScheme="brand"
              isLoading={createMutation.isLoading}
              loadingText="Creating..."
            >
              Create Link
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  )
}
