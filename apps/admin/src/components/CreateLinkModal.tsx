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
  InputGroup,
  InputRightElement,
  IconButton
} from '@chakra-ui/react'
import { PlusIcon, CopyIcon } from 'lucide-react'
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
        description: `Short URL: https://go.monumental-i.com/s/${data.slug}`,
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
    setFormData({ slug: '', longUrl: '', notes: '', tags: [] })
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

  const copyShortUrl = () => {
    if (formData.slug) {
      navigator.clipboard.writeText(`https://go.monumental-i.com/s/${formData.slug}`)
      toast({
        title: 'Copied to clipboard',
        status: 'success',
        duration: 2000,
        isClosable: true,
      })
    }
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
                <InputGroup>
                  <Input
                    placeholder="my-custom-slug"
                    value={formData.slug}
                    onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                    bg="gray.700"
                    borderColor="gray.600"
                    _focus={{ borderColor: 'brand.500' }}
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label="Copy short URL"
                      icon={<CopyIcon size={14} />}
                      size="sm"
                      variant="ghost"
                      onClick={copyShortUrl}
                      isDisabled={!formData.slug}
                    />
                  </InputRightElement>
                </InputGroup>
                <Text fontSize="sm" color="gray.400" mt={1}>
                  If empty, a random slug will be generated
                </Text>
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
