import { Fragment, useState, useEffect, useRef } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon, PlusIcon, PencilIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/20/solid'
import FieldToggle from '@/components/FieldToggle'
import LoadingSpinner from '@/components/LoadingSpinner'
import Alert from '@/components/Alert'
import ModalCheckout from '@/components/ModalCheckout'
import { checkPlanPermission } from '@/utils/helpers'

export default function ModalTopicManagement({ team, bot, open, setOpen }) {
  const TOPIC_LIMIT = 50
  const [topics, setTopics] = useState((bot?.topics || []).slice(0, TOPIC_LIMIT))
  const [allowOpenEndedTopics, setAllowOpenEndedTopics] = useState(
    bot?.allowOpenEndedTopics !== undefined ? bot.allowOpenEndedTopics : true
  )
  const [searchTerm, setSearchTerm] = useState('')
  const [newTopic, setNewTopic] = useState('')
  const [editingIndex, setEditingIndex] = useState(-1)
  const [editingTopic, setEditingTopic] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [successText, setSuccessText] = useState(null)
  const [showUpgrade, setShowUpgrade] = useState(false)
  
  // Check if user has permission for topic management
  const topicPermission = checkPlanPermission(team, 'business', 'topics')
  const canManageTopics = topicPermission.allowed
  
  // Refs for managing focus
  const searchInputRef = useRef(null)
  const newTopicInputRef = useRef(null)
  const editInputRefs = useRef([])

  // Filter topics based on search term
  const filteredTopics = topics.filter(topic =>
    topic.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Reset state when modal opens/closes
  useEffect(() => {
    if (open) {
      const initialTopics = (bot?.topics || []).slice(0, TOPIC_LIMIT)
      setTopics(initialTopics)
      const shouldDisableAI = initialTopics.length >= TOPIC_LIMIT
      const initialAllowOpenEnded =
        bot?.allowOpenEndedTopics !== undefined ? bot.allowOpenEndedTopics : true
      setAllowOpenEndedTopics(shouldDisableAI ? false : initialAllowOpenEnded)
      setSearchTerm('')
      setNewTopic('')
      setEditingIndex(-1)
      setEditingTopic('')
      setErrorText(null)
      setSuccessText(null)
    }
  }, [open, bot])

  // Focus search input when modal opens
  useEffect(() => {
    if (open && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 100)
    }
  }, [open])

  useEffect(() => {
    if (topics.length >= TOPIC_LIMIT && allowOpenEndedTopics) {
      setAllowOpenEndedTopics(false)
    }
  }, [topics, allowOpenEndedTopics])

  const isAtTopicLimit = topics.length >= TOPIC_LIMIT
  const remainingTopics = TOPIC_LIMIT - topics.length

  const handleAllowOpenEndedToggle = (value) => {
    if (!canManageTopics) {
      setShowUpgrade(true)
      return
    }

    if (isAtTopicLimit && value) {
      setErrorText(`You already have the maximum of ${TOPIC_LIMIT} topics. Remove one to enable AI-generated topics.`)
      return
    }

    setErrorText(null)
    setAllowOpenEndedTopics(value)
  }

  const addTopic = () => {
    if (!newTopic.trim()) return

    const trimmedTopic = newTopic.trim()
    if (topics.length >= TOPIC_LIMIT) {
      setErrorText(`You can only have up to ${TOPIC_LIMIT} topics. Remove one before adding another.`)
      return
    }
    if (topics.includes(trimmedTopic)) {
      setErrorText('Topic already exists')
      return
    }
    
    setTopics([...topics, trimmedTopic])
    setNewTopic('')
    setErrorText(null)
    
    // Focus the new topic input after adding
    setTimeout(() => {
      newTopicInputRef.current?.focus()
    }, 0)
  }

  const startEditing = (index, topic) => {
    setEditingIndex(index)
    setEditingTopic(topic)
    
    // Focus the edit input after setting editing state
    setTimeout(() => {
      editInputRefs.current[index]?.focus()
      editInputRefs.current[index]?.select()
    }, 0)
  }

  const saveEdit = (index) => {
    if (!editingTopic.trim()) {
      cancelEdit()
      return
    }
    
    const trimmedTopic = editingTopic.trim()
    if (topics.includes(trimmedTopic) && topics[index] !== trimmedTopic) {
      setErrorText('Topic already exists')
      return
    }
    
    const newTopics = [...topics]
    newTopics[index] = trimmedTopic
    setTopics(newTopics)
    setEditingIndex(-1)
    setEditingTopic('')
    setErrorText(null)
  }

  const cancelEdit = () => {
    setEditingIndex(-1)
    setEditingTopic('')
    setErrorText(null)
  }

  const deleteTopic = (index) => {
    const newTopics = topics.filter((_, i) => i !== index)
    setTopics(newTopics)
    setErrorText(null)
  }

  const handleKeyDown = (e, action, index = null) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (action === 'add') {
        if (canManageTopics) {
          addTopic()
        } else {
          setShowUpgrade(true)
        }
      } else if (action === 'save') {
        saveEdit(index)
      }
    } else if (e.key === 'Escape') {
      if (action === 'edit') {
        cancelEdit()
      }
    } else if (e.key === 'Tab' && action === 'edit') {
      // Allow tab navigation but save current edit first
      saveEdit(index)
    }
  }

  const saveChanges = async () => {
    if (submitting) return

    const originalTopics = (bot?.topics || []).slice(0, TOPIC_LIMIT)
    const isDeletionOnly =
      !canManageTopics &&
      topics.length <= originalTopics.length &&
      topics.every((t) => originalTopics.includes(t))

    // Check if user has permission to save topics (or is only deleting)
    if (!canManageTopics && !isDeletionOnly) {
      setShowUpgrade(true)
      return
    }

    setSubmitting(true)
    setErrorText(null)
    
    try {
      const response = await fetch(`/api/teams/${team.id}/bots/${bot.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          isDeletionOnly
            ? { topics }
            : { topics, allowOpenEndedTopics }
        ),
      })

      if (response.ok) {
        setSuccessText('Topics updated successfully!')
        setTimeout(() => {
          setOpen(false)
          // Refresh the page to show updated bot data
          window.location.reload()
        }, 1500)
      } else {
        const data = await response.json()
        if (data.message.includes('upgrade') || data.message.includes('plan')) {
          setShowUpgrade(true)
        } else {
          setErrorText(data.message || 'Failed to update topics')
        }
      }
    } catch (error) {
      setErrorText('Network error. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    if (editingIndex !== -1) {
      cancelEdit()
    }
    setOpen(false)
  }

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={handleClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
                <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2"
                    onClick={handleClose}
                  >
                    <span className="sr-only">Close</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="w-full">
                      <Dialog.Title as="h3" className="text-2xl font-bold leading-6 text-gray-900 mb-4">
                        Manage Topics
                      </Dialog.Title>
                      
                      <div className="mb-6">
                        <p className="text-sm text-gray-600 mb-4">
                          Topics help categorize and analyze user conversations. You can add custom topics or let the AI detect them automatically.
                        </p>
                        
                        {/* Plan restriction notice */}
                        {!canManageTopics && (
                          <div className="my-4 p-3 bg-cyan-50 border border-cyan-200 rounded-md">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <span className="text-sm text-cyan-700">
                                  Conversation topics are available on the {topicPermission.requiredPlanLabel} plan and higher.
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowUpgrade(true)}
                                className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500"
                              >
                                Upgrade
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Allow New Topic Detection Toggle */}
                        <div className="mb-6">
                          <FieldToggle
                            label="Allow New Topic Detection"
                            description="When enabled, the AI will automatically detect and suggest new topics from conversations. Disable this to only choose from the below topics."
                            enabled={allowOpenEndedTopics}
                            setEnabled={handleAllowOpenEndedToggle}
                            disabled={isAtTopicLimit}
                            planLabel={!canManageTopics ? topicPermission.requiredPlanLabel : null}
                          />
                          {isAtTopicLimit && (
                            <p className="mt-2 text-xs text-amber-600">
                              You have reached the maximum of {TOPIC_LIMIT} topics. Remove a topic to enable AI-generated topics or add new ones.
                            </p>
                          )}
                        </div>
                      </div>

                      <Alert type="error" title={errorText} />
                      <Alert type="success" title={successText} />

                      {/* Search and Add New Side-by-Side */}
                      <div className="mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Search Topics */}
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                            <input
                              ref={searchInputRef}
                              type="text"
                              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                              placeholder="Search topics..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                            />
                          </div>

                          {/* Add New Topic */}
                          <div className="flex space-x-2">
                            <input
                              ref={newTopicInputRef}
                              type="text"
                              className="flex-1 block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm disabled:cursor-not-allowed disabled:bg-gray-100"
                              placeholder="Add new topic..."
                              value={newTopic}
                              onChange={(e) => setNewTopic(e.target.value)}
                              onKeyDown={(e) => handleKeyDown(e, 'add')}
                              disabled={isAtTopicLimit}
                            />
                            <button
                              type="button"
                              onClick={canManageTopics ? addTopic : () => setShowUpgrade(true)}
                              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-cyan-600 hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                              disabled={isAtTopicLimit}
                            >
                              <PlusIcon className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                        </div>

                        {!isAtTopicLimit && (
                          <p className="mt-2 text-xs text-gray-500">
                            {remainingTopics === 1
                              ? 'You can add 1 more topic.'
                              : `You can add ${remainingTopics} more topics.`}
                          </p>
                        )}


                      </div>

                      {/* Topics List */}
                      <div className="max-h-96 overflow-y-auto border border-gray-200 rounded-md">
                        {filteredTopics.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            {searchTerm ? 'No topics match your search.' : 'No topics added yet.'}
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-200">
                            {filteredTopics.map((topic, filteredIndex) => {
                              const originalIndex = topics.findIndex(t => t === topic)
                              const isEditing = editingIndex === originalIndex
                              
                              return (
                                <div
                                  key={`${topic}-${originalIndex}`}
                                  className="flex items-center justify-between p-3 hover:bg-gray-50"
                                >
                                  {isEditing ? (
                                    <div className="flex-1 flex items-center space-x-2">
                                      <input
                                        ref={el => editInputRefs.current[originalIndex] = el}
                                        type="text"
                                        className="flex-1 block w-full px-3 py-1 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm"
                                        value={editingTopic}
                                        onChange={(e) => setEditingTopic(e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(e, 'edit', originalIndex)}
                                        onBlur={() => saveEdit(originalIndex)}
                                        disabled={!canManageTopics}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => saveEdit(originalIndex)}
                                        disabled={!canManageTopics}
                                        className="inline-flex items-center p-1 border border-transparent rounded text-green-600 hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <CheckIcon className="h-4 w-4" aria-hidden="true" />
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <span className="flex-1 text-sm text-gray-900">{topic}</span>
                                      <div className="flex items-center space-x-2">
                                        <button
                                          type="button"
                                          onClick={() => startEditing(originalIndex, topic)}
                                          disabled={!canManageTopics}
                                          className="inline-flex items-center p-1 border border-transparent rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          <PencilIcon className="h-4 w-4" aria-hidden="true" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => deleteTopic(originalIndex)}
                                          className="inline-flex items-center p-1 border border-transparent rounded text-red-400 hover:text-red-600 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                          <TrashIcon className="h-4 w-4" aria-hidden="true" />
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="button"
                    disabled={submitting}
                    onClick={saveChanges}
                    className="w-full inline-flex justify-center items-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-cyan-600 text-base font-medium text-white hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {submitting && <LoadingSpinner className="mr-2" />}
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
                
                <ModalCheckout team={team} open={showUpgrade} setOpen={setShowUpgrade} />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}