import { useEffect, useState, useCallback } from 'react'
import { PlusIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { InformationCircleIcon } from '@heroicons/react/24/outline'
import { checkPlanPermission } from '@/utils/helpers'
import Link from 'next/link'
import ModalCheckout from '@/components/ModalCheckout'
import { i18n } from '@/constants/strings.constants'
import { PRESET_PROMPTS } from '@/constants/prompts.constants'
import FieldToggle from '@/components/FieldToggle'
import Tooltip from '@/components/Tooltip'
import PresetPromptSelect from '@/components/PresetPromptSelect'

export default function FormBot({
  team,
  bot,
  setBotSettings,
  disabled,
  short = false,
}) {
  const [language, setLanguage] = useState(bot?.language || 'en')
  const [botName, setBotName] = useState(bot?.name || '')
  const [botDescription, setBotDescription] = useState(bot?.description || '')
  const [privacy, setPrivacy] = useState(bot?.privacy || 'public')
  const [model, setModel] = useState(
    bot?.model || 'gpt-4.1-mini'
  )
  const [questions, setQuestions] = useState(bot?.questions || [])
  const [glossary, setGlossary] = useState(bot?.glossary || [])
  const [rateLimitMessages, setRateLimitMessages] = useState(
    bot?.rateLimitMessages || 10,
  )
  const [labels, setLabels] = useState(
    bot?.labels || i18n[bot?.language]?.labels || null,
  )
  const [rateLimitSeconds, setRateLimitSeconds] = useState(
    bot?.rateLimitSeconds || 60,
  )
  const [rateLimitIPAllowlist, setRateLimitIPAllowlist] = useState(
    bot?.rateLimitIPAllowlist || [],
  )
  const [classifySwitch, setClassifySwitch] = useState(() => {
    if (bot?.classify === undefined) {
      // default to true
      return true
    }
    return bot?.classify
  })
  const [rateLimitIPField, setRateLimitIPField] = useState(
    bot?.rateLimitIPAllowlist?.join(', ') || '',
  )
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [recordIP, setRecordIP] = useState(bot?.recordIP || false)
  const [temperature, setTemperature] = useState(bot?.temperature || 0)
  const [agentPrompt, setAgentPrompt] = useState(bot?.agentPrompt || '')
  const [agentRole, setAgentRole] = useState(bot?.agentRole || '')

  // Define which models should be shown based on conditions
  const modelVisibility = {
    'gpt-5.2': true,
    'gpt-5.1': true,
    'gpt-5':
      model === 'gpt-5',
    'gpt-4.1': !short,
    'gpt-5-mini': checkPlanPermission(team, 'personal').allowed || model === 'gpt-5-mini',
    'gpt-4.1-mini': true,
    'gpt-5-nano':
      (checkPlanPermission(team, 'personal').allowed && !short) || model === 'gpt-5-nano',
    'gpt-4.1-nano': !short,
    'gpt-4.5-preview': model === 'gpt-4.5-preview',
    'gpt-4o': !short,
    'gpt-4o-mini': model === 'gpt-4o-mini',
    'gpt-4-turbo': model === 'gpt-4-turbo',
    'gpt-4': model === 'gpt-4',
    'gpt-3.5-turbo': model === 'gpt-3.5-turbo',
    'gpt-3.5-turbo-0613': model === 'gpt-3.5-turbo-0613',
  }

  useEffect(() => {
    setBotSettings({
      language,
      name: botName,
      description: botDescription,
      privacy,
      model,
      questions,
      glossary,
      rateLimitMessages,
      rateLimitSeconds,
      rateLimitIPAllowlist,
      labels,
      recordIP,
      classify: classifySwitch,
      temperature,
      agentPrompt,
    })
  }, [
    language,
    botName,
    botDescription,
    privacy,
    model,
    questions,
    glossary,
    rateLimitMessages,
    rateLimitSeconds,
    rateLimitIPAllowlist,
    labels,
    recordIP,
    classifySwitch,
    temperature,
    agentPrompt,
  ])

  const handleAgentPromptChange = (value) => {
    setAgentRole(value)
    setAgentPrompt(
      (PRESET_PROMPTS[value]?.prompt || '')
        .replace(/{company_name}/g, botName)
        .replace(/{old_prompt}\n/g, '')
        .replace(/{old_prompt}/g, ''),
    )

    // Set temperature based on the preset prompt
    if (value && PRESET_PROMPTS[value]?.temperature !== undefined) {
      setTemperature(PRESET_PROMPTS[value].temperature)
    }
  }

  // Update agentPrompt when botName changes if a preset role is selected
  useEffect(() => {
    if (agentRole && PRESET_PROMPTS[agentRole]) {
      setAgentPrompt(
        (PRESET_PROMPTS[agentRole]?.prompt || '')
          .replace(/{company_name}/g, botName)
          .replace(/{old_prompt}\n/g, '')
          .replace(/{old_prompt}/g, ''),
      )
    }
  }, [botName, agentRole])

  //show upgrade if they change privacy to private
  useEffect(() => {
    if (privacy === 'private' && !checkPlanPermission(team, 'hobby').allowed) {
      setShowUpgrade(true)
      setPrivacy('public')
    }
  }, [privacy])

  //show upgrade if they change model to gpt-5.2, gpt-5.1, or gpt-5
  useEffect(() => {
    // For users on the personal plan:
    // - They should be able to select gpt-5-mini, gpt-5-nano, gpt-4.1-mini, gpt-4.1-nano, gpt-4o-mini without any issues
    // - Only show upgrade for gpt-5, gpt-4.1, gpt-4o if they don't have supportsGPT4
    if (!checkPlanPermission(team, 'personal').allowed) { //free or hobby plan
      // For non-personal plans, keep existing behavior
      if (
        ['gpt-5.2', 'gpt-5.1', 'gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-4.1', 'gpt-4o'].includes(model)
      ) {
        setShowUpgrade(true)
        setModel('gpt-4.1-mini')
        console.log('Setting default free/hobby plan model to gpt-4.1-mini')
      }
    } else {
      // For paid plan users (personal and above)
      // If they select a full model without OpenAI key, revert to a mini model
      // The modal will be triggered by NewBotPanel/ModalBotEdit components
      if (
        ['gpt-5.2', 'gpt-5.1', 'gpt-5', 'gpt-4.1', 'gpt-4o'].includes(model) &&
        !team.supportsGPT4
      ) {
        setModel('gpt-4.1-mini') // Default to gpt-5-mini since they're on paid plan
        console.log('Reverting to gpt-4.1-mini for paid plan user without OpenAI key')
      }
      // If they're selecting gpt-5-mini, gpt-5-nano, gpt-4.1-mini, gpt-4.1-nano, gpt-4o-mini, don't change anything
    }
  }, [model, team, checkPlanPermission])

  const updateQuestion = (index, newQuestion) => {
    setQuestions((questions) => {
      const newQuestions = [...questions]
      newQuestions[index] = newQuestion
      return newQuestions
    })
  }

  const removeQuestion = (index) => {
    setQuestions((questions) => {
      const newQuestions = [...questions]
      newQuestions.splice(index, 1)
      return newQuestions
    })
  }

  const addQuestion = () => {
    setQuestions((questions) => {
      const newQuestions = [...questions]
      newQuestions.push('')
      return newQuestions
    })
  }

  const updateGlossary = (index, newGlossary) => {
    setGlossary((glossary) => {
      const newGlossaries = [...glossary]
      newGlossaries[index] = newGlossary
      console.log(newGlossaries)
      return newGlossaries
    })
  }

  const removeGlossary = (index) => {
    setGlossary((glossary) => {
      const newGlossaries = [...glossary]
      newGlossaries.splice(index, 1)
      return newGlossaries
    })
  }

  const addGlossary = () => {
    if (checkPlanPermission(team, 'pro', 'glossary').allowed) {
      setGlossary((glossary) => {
        const newGlossaries = [...glossary]
        newGlossaries.push({ word: '', translation: '' })
        return newGlossaries
      })
    } else {
      setShowUpgrade(true)
    }
  }

  useEffect(() => {
    //check for valid IPv4 and IPv6 addresses
    const ipArray = rateLimitIPField
      .split(',')
      .map((ip) => ip.trim())
      .filter((ip) => {
        if (ip.match(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/)) {
          return true
        } else if (ip.match(/^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/)) {
          //does not support shorthand notation
          return true
        }
        return false
      })
    setRateLimitIPAllowlist(ipArray)
  }, [rateLimitIPField])

  const QuestionPrompt = ({ index }) => {
    const [question, setQuestion] = useState(questions[index])

    return (
      <div className="flex items-start pt-2">
        <div className="w-full text-sm">
          <input
            type="text"
            value={question}
            autoComplete="off"
            onChange={(e) => setQuestion(e.target.value)}
            onBlur={(e) => {
              updateQuestion(index, e.target.value)
            }}
            placeholder={`What is ${bot.name}?`}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-600 focus:ring-cyan-600 sm:text-sm"
          />
        </div>
        <div className="m-auto flex items-center text-center">
          <button
            type="button"
            className="ml-1 flex h-5 w-5 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            onClick={() => removeQuestion(index)}
          >
            <span className="sr-only">Remove question: {question}</span>
            <XMarkIcon className="h-5 w-5 text-gray-700" aria-hidden="true" />
          </button>
        </div>
      </div>
    )
  }

  const GlossaryEntry = ({ index }) => {
    const [word, setWord] = useState(glossary[index].word)
    const [translation, setTranslation] = useState(glossary[index].translation)
    const [isDirty, setIsDirty] = useState(false)

    // Sync with parent state changes
    useEffect(() => {
      if (!isDirty) {
        setWord(glossary[index].word)
        setTranslation(glossary[index].translation)
      }
    }, [glossary[index], isDirty])

    // Update parent state when component loses focus entirely
    const handleFocusOut = useCallback(() => {
      if (isDirty) {
        updateGlossary(index, { word, translation })
        setIsDirty(false)
      }
    }, [index, word, translation, isDirty])

    const isDisabled =
      disabled || !checkPlanPermission(team, 'pro', 'glossary').allowed

    return (
      <div
        className="flex items-start pt-2"
        onBlur={(e) => {
          // Only update parent if focus is leaving this component entirely
          // Check if the relatedTarget (where focus is going) is not a child of this component
          if (!e.currentTarget.contains(e.relatedTarget)) {
            handleFocusOut()
          }
        }}
      >
        <div className="grid w-full grid-cols-2 gap-2 text-sm">
          <div>
            <input
              type="text"
              value={word}
              autoComplete="off"
              onChange={(e) => {
                setWord(e.target.value)
                setIsDirty(true)
              }}
              placeholder={`Word`}
              disabled={isDisabled}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-600 focus:ring-cyan-600 sm:text-sm"
            />
          </div>
          <div>
            <input
              type="text"
              value={translation}
              autoComplete="off"
              onChange={(e) => {
                setTranslation(e.target.value)
                setIsDirty(true)
              }}
              placeholder={`Equivalent in sources`}
              disabled={isDisabled}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-600 focus:ring-cyan-600 sm:text-sm"
            />
          </div>
        </div>
        <div className="m-auto flex items-center text-center">
          <button
            type="button"
            className="ml-1 flex h-5 w-5 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            onClick={() => removeGlossary(index)}
            disabled={disabled}
          >
            <span className="sr-only">Remove Glossary entry: {word}</span>
            <XMarkIcon className="h-5 w-5 text-gray-700" aria-hidden="true" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <ModalCheckout team={team} open={showUpgrade} setOpen={setShowUpgrade} />
      <div>
        <label
          htmlFor="project-name"
          className="block text-sm font-medium text-gray-900"
        >
          Name
        </label>
        <div className="mt-1">
          <input
            type="text"
            name="project-name"
            id="project-name"
            value={botName}
            onChange={(e) => setBotName(e.target.value)}
            disabled={disabled}
            placeholder="What would you like to call your bot?"
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-600 focus:ring-cyan-600 sm:text-sm"
          />
        </div>
      </div>
      {!short && (
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-900"
          >
            Description (optional)
          </label>
          <div className="mt-1">
            <textarea
              id="description"
              name="description"
              placeholder="This is an internal description of your bot, not a prompt or instructions."
              rows={4}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-600 focus:ring-cyan-600 sm:text-sm"
              value={botDescription}
              disabled={disabled}
              onChange={(e) => setBotDescription(e.target.value)}
            />
          </div>
        </div>
      )}

      {short && (
        <div>
          <PresetPromptSelect
            value={agentRole}
            onChange={handleAgentPromptChange}
            disabled={disabled}
            className="w-full"
            label="Choose Preset"
            defaultOptionLabel="Agent Role"
            defaultOptionDescription="Select a default role for this bot"
          />
          <p className="text-xs text-gray-500">
            Choose a preset to get started quickly. You can customize your
            agent's instructions later.
          </p>
        </div>
      )}

      <fieldset>
        <legend className="text-sm font-medium text-gray-900">Privacy</legend>
        <div className="mt-2 space-y-2">
          <div className="relative flex items-start">
            <div className="absolute flex h-5 items-center">
              <input
                id="privacy-public"
                name="privacy"
                value="public"
                aria-describedby="privacy-public-description"
                type="radio"
                className="h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                checked={privacy === 'public'}
                onChange={() => setPrivacy('public')}
                disabled={disabled}
              />
            </div>
            <div className="pl-7 text-sm">
              <label
                htmlFor="privacy-public"
                className="font-medium text-gray-900"
              >
                Public access
              </label>
              <p id="privacy-public-description" className="text-gray-500">
                Allows for embedding on the frontend of websites.
              </p>
            </div>
          </div>
          <div>
            <div className="relative flex items-start">
              <div className="absolute flex h-5 items-center">
                <input
                  id="privacy-private"
                  name="privacy"
                  value="private"
                  aria-describedby="privacy-private-to-project-description"
                  type="radio"
                  className="h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                  checked={privacy === 'private'}
                  onChange={() => setPrivacy('private')}
                  disabled={disabled}
                />
              </div>
              <div className="pl-7 text-sm">
                <label
                  htmlFor="privacy-private"
                  className="font-medium text-gray-900"
                >
                  Private
                  {!checkPlanPermission(team, 'hobby').allowed && (
                    <span className="ml-4 inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-medium text-cyan-800">
                      Paid
                    </span>
                  )}
                </label>
                <p id="privacy-private-description" className="text-gray-500">
                  Authenticated API access only. Good for internal company
                  content.
                </p>
              </div>
            </div>
          </div>
        </div>
      </fieldset>

        <fieldset>
          <legend className="text-sm font-medium text-gray-900">
            OpenAI Model
          </legend>
          <div className="mt-2 space-y-2">
            {/* Render models based on visibility rules */}
            {modelVisibility['gpt-5.2'] && (
              <div className="relative flex items-start">
                <div className="absolute flex h-5 items-center">
                  <input
                    id="gpt-5-2"
                    name="model"
                    value="gpt-5.2"
                    aria-describedby="gpt-5-2-description"
                    type="radio"
                    className="h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    checked={model === 'gpt-5.2'}
                    onChange={() => setModel('gpt-5.2')}
                    disabled={disabled}
                  />
                </div>
                <div className="pl-7 text-sm">
                  <label htmlFor="gpt-5-2" className="font-medium text-gray-900">
                    GPT-5.2 - Most Powerful
                  </label>
                  <p id="gpt-5-2-description" className="text-gray-500">
                    Latest flagship tuned for long-context work, stronger tool use, and adaptive reasoning.{' '}
                    <span className="font-bold text-xs">
                      Requires <Link href="https://help.openai.com/en/articles/10910291-api-organization-verification" target="_blank" className="underline hover:text-gray-800">organization verification</Link>.
                    </span>
                  </p>
                </div>
              </div>
            )}

            {modelVisibility['gpt-5.1'] && (
              <div className="relative flex items-start">
                <div className="absolute flex h-5 items-center">
                  <input
                    id="gpt-5-1"
                    name="model"
                    value="gpt-5.1"
                    aria-describedby="gpt-5-1-description"
                    type="radio"
                    className="h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    checked={model === 'gpt-5.1'}
                    onChange={() => setModel('gpt-5.1')}
                    disabled={disabled}
                  />
                </div>
                <div className="pl-7 text-sm">
                  <label htmlFor="gpt-5-1" className="font-medium text-gray-900">
                    GPT-5.1 - Adaptive Flagship
                  </label>
                  <p id="gpt-5-1-description" className="text-gray-500">
                    Previous flagship with adaptive reasoning and fast responses for complex tasks.{' '}
                    <span className="font-bold text-xs">
                      Requires <Link href="https://help.openai.com/en/articles/10910291-api-organization-verification" target="_blank" className="underline hover:text-gray-800">organization verification</Link>.
                    </span>
                  </p>
                </div>
              </div>
            )}

            {modelVisibility['gpt-5'] && (
              <div className="relative flex items-start">
                <div className="absolute flex h-5 items-center">
                  <input
                    id="gpt-5"
                    name="model"
                    value="gpt-5"
                    aria-describedby="gpt-5-description"
                    type="radio"
                    className="h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    checked={model === 'gpt-5'}
                    onChange={() => setModel('gpt-5')}
                    disabled={disabled}
                  />
                </div>
                <div className="pl-7 text-sm">
                  <label htmlFor="gpt-5" className="font-medium text-gray-900">
                    GPT-5 - Powerful General-Purpose Model
                  </label>
                  <p id="gpt-5-description" className="text-gray-500">
                    Smartest, fastest, most useful model yet, with thinking built in
                    — so you get the best answer, every time.{' '}
                    <span className="font-bold text-xs">
                      Requires <Link href="https://help.openai.com/en/articles/10910291-api-organization-verification" target="_blank" className="underline hover:text-gray-800">organization verification</Link>.
                    </span>
                  </p>
                </div>
              </div>
            )}

            {modelVisibility['gpt-4.1'] && (
              <div className="relative flex items-start">
                <div className="absolute flex h-5 items-center">
                  <input
                    id="gpt-4.1"
                    name="model"
                    value="gpt-4.1"
                    aria-describedby="gpt-4.1-description"
                    type="radio"
                    className="h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    checked={model === 'gpt-4.1'}
                    onChange={() => setModel('gpt-4.1')}
                    disabled={disabled}
                  />
                </div>
                <div className="pl-7 text-sm">
                  <label
                    htmlFor="gpt-4.1"
                    className="font-medium text-gray-900"
                  >
                    GPT-4.1
                    <span className="ml-4 inline-flex items-center rounded-full bg-cyan-600 px-2.5 py-0.5 text-xs font-medium text-white">
                      Recommended
                    </span>
                  </label>
                  <p id="gpt-4.1-description" className="text-gray-500">
                    Previous generation model good at instruction following.
                  </p>
                </div>
              </div>
            )}

            {modelVisibility['gpt-5-mini'] && (
              <div className="relative flex items-start">
                <div className="absolute flex h-5 items-center">
                  <input
                    id="gpt-5-mini"
                    name="model"
                    value="gpt-5-mini"
                    aria-describedby="gpt-5-mini-description"
                    type="radio"
                    className="h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    checked={model === 'gpt-5-mini'}
                    onChange={() => setModel('gpt-5-mini')}
                    disabled={disabled}
                  />
                </div>
                <div className="pl-7 text-sm">
                  <label htmlFor="gpt-5-mini" className="font-medium text-gray-900">
                    GPT-5 mini - Best Value
                  </label>
                  <p id="gpt-5-mini-description" className="text-gray-500">
                    Smart, fast, and useful model. Good for most support use cases.{' '}
                    {team.supportsGPT4 && (
                      <span className="font-bold text-xs">
                        Requires <Link href="https://help.openai.com/en/articles/10910291-api-organization-verification" target="_blank" className="underline hover:text-gray-800">organization verification</Link>.
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}

            {modelVisibility['gpt-4.1-mini'] && (
              <div className="relative flex items-start">
                <div className="absolute flex h-5 items-center">
                  <input
                    id="gpt-4.1-mini"
                    name="model"
                    value="gpt-4.1-mini"
                    aria-describedby="gpt-4.1-mini-description"
                    type="radio"
                    className="h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    checked={model === 'gpt-4.1-mini'}
                    onChange={() => setModel('gpt-4.1-mini')}
                    disabled={disabled}
                  />
                </div>
                <div className="pl-7 text-sm">
                  <label
                    htmlFor="gpt-4.1-mini"
                    className="font-medium text-gray-900"
                  >
                    GPT-4.1 mini
                    {!team.supportsGPT4 && (
                      <span className="ml-4 inline-flex items-center rounded-full bg-cyan-600 px-2.5 py-0.5 text-xs font-medium text-white">
                        Recommended
                      </span>
                    )}
                  </label>
                  <p id="gpt-4.1-mini-description" className="text-gray-500">
                    Faster than GPT-4.1 while still good at instruction following.
                  </p>
                </div>
              </div>
            )}

            {modelVisibility['gpt-5-nano'] && (
              <div className="relative flex items-start">
                <div className="absolute flex h-5 items-center">
                  <input
                    id="gpt-5-nano"
                    name="model"
                    value="gpt-5-nano"
                    aria-describedby="gpt-5-nano-description"
                    type="radio"
                    className="h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    checked={model === 'gpt-5-nano'}
                    onChange={() => setModel('gpt-5-nano')}
                    disabled={disabled}
                  />
                </div>
                <div className="pl-7 text-sm">
                  <label htmlFor="gpt-5-nano" className="font-medium text-gray-600">
                    GPT-5 nano - Fast & Cost Effective
                  </label>
                  <p id="gpt-5-nano-description" className="text-gray-500">
                    Included in all plans. Affordable & extremely fast model.
                  </p>
                </div>
              </div>
            )}

            {modelVisibility['gpt-4.1-nano'] && (
              <div className="relative flex items-start">
                <div className="absolute flex h-5 items-center">
                  <input
                    id="gpt-4.1-nano"
                    name="model"
                    value="gpt-4.1-nano"
                    aria-describedby="gpt-4.1-nano-description"
                    type="radio"
                    className="h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    checked={model === 'gpt-4.1-nano'}
                    onChange={() => setModel('gpt-4.1-nano')}
                    disabled={disabled}
                  />
                </div>
                <div className="pl-7 text-sm">
                  <label
                    htmlFor="gpt-4.1-nano"
                    className="font-medium text-gray-600"
                  >
                    GPT-4.1 nano
                  </label>
                  <p id="gpt-4.1-nano-description" className="text-gray-500">
                    Previous generation model. We recommend upgrading to at least GPT-4.1 mini.
                  </p>
                </div>
              </div>
            )}

            {modelVisibility['gpt-4.5-preview'] && (
              <div className="relative flex items-start">
                <div className="absolute flex h-5 items-center">
                  <input
                    id="gpt-4.5-preview"
                    name="model"
                    value="gpt-4.5-preview"
                    aria-describedby="gpt-4.5-preview-description"
                    type="radio"
                    className="h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    checked={model === 'gpt-4.5-preview'}
                    onChange={() => setModel('gpt-4.5-preview')}
                    disabled={disabled}
                  />
                </div>
                <div className="pl-7 text-sm">
                  <label
                    htmlFor="gpt-4.5-preview"
                    className="font-medium text-gray-600"
                  >
                    GPT-4.5 - Not Recommended
                    <span className="ml-4 inline-flex items-center rounded-full bg-orange-600 px-2.5 py-0.5 text-xs font-medium text-white">
                      Retiring June 2025
                    </span>
                  </label>
                  <p id="gpt-4.5-preview-description" className="text-gray-500">
                    Very slow, expensive ($0.27/question), and low rate limits.
                    Not recommended for most use cases.
                  </p>
                </div>
              </div>
            )}

            {modelVisibility['gpt-4o'] && (
              <div className="relative flex items-start">
                <div className="absolute flex h-5 items-center">
                  <input
                    id="gpt-4o"
                    name="model"
                    value="gpt-4o"
                    aria-describedby="gpt-4o-description"
                    type="radio"
                    className="h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    checked={model === 'gpt-4o'}
                    onChange={() => setModel('gpt-4o')}
                    disabled={disabled}
                  />
                </div>
                <div className="pl-7 text-sm">
                  <label htmlFor="gpt-4o" className="font-medium text-gray-600">
                    GPT-4o
                  </label>
                  <p id="gpt-4o-description" className="text-gray-500">
                    Previous generation general purpose model. Consider
                    upgrading to GPT-4.1.
                  </p>
                </div>
              </div>
            )}

            {modelVisibility['gpt-4o-mini'] && (
              <div className="relative flex items-start">
                <div className="absolute flex h-5 items-center">
                  <input
                    id="gpt-4o-mini"
                    name="model"
                    value="gpt-4o-mini"
                    aria-describedby="gpt-4o-mini-description"
                    type="radio"
                    className="h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    checked={model === 'gpt-4o-mini'}
                    onChange={() => setModel('gpt-4o-mini')}
                    disabled={disabled}
                  />
                </div>
                <div className="pl-7 text-sm">
                  <label
                    htmlFor="gpt-4o-mini"
                    className="font-medium text-gray-600"
                  >
                    GPT-4o mini
                  </label>
                  <p id="gpt-4o-mini-description" className="text-gray-500">
                    Previous generation model. Consider upgrading to GPT-4.1 mini.
                  </p>
                </div>
              </div>
            )}

            {modelVisibility['gpt-4-turbo'] && (
              <div className="relative flex items-start">
                <div className="absolute flex h-5 items-center">
                  <input
                    id="gpt-4-turbo"
                    name="model"
                    value="gpt-4-turbo"
                    aria-describedby="gpt-4-turbo-description"
                    type="radio"
                    className="h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    checked={model === 'gpt-4-turbo'}
                    onChange={() => setModel('gpt-4-turbo')}
                    disabled={disabled}
                  />
                </div>
                <div className="pl-7 text-sm">
                  <label
                    htmlFor="gpt-4-turbo"
                    className="font-medium text-gray-600"
                  >
                    GPT-4 Turbo - Legacy
                  </label>
                  <p id="gpt-4-turbo-description" className="text-gray-500">
                    Previous generation model. Recommend upgrading to GPT-4.1.
                  </p>
                </div>
              </div>
            )}

            {modelVisibility['gpt-4'] && (
              <div className="relative flex items-start">
                <div className="absolute flex h-5 items-center">
                  <input
                    id="gpt-4"
                    name="model"
                    value="gpt-4"
                    aria-describedby="gpt-4-description"
                    type="radio"
                    className="h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    checked={model === 'gpt-4'}
                    onChange={() => setModel('gpt-4')}
                    disabled={disabled}
                  />
                </div>
                <div className="pl-7 text-sm">
                  <label htmlFor="gpt-4" className="font-medium text-gray-600">
                    GPT-4 - Legacy
                  </label>
                  <p id="gpt-4-description" className="text-gray-500">
                    Previous generation model. Recommend upgrading to GPT-4.1.
                  </p>
                </div>
              </div>
            )}

            {modelVisibility['gpt-3.5-turbo'] && (
              <div className="relative flex items-start">
                <div className="absolute flex h-5 items-center">
                  <input
                    id="gpt-3.5-turbo"
                    name="model"
                    value="gpt-3.5-turbo"
                    aria-describedby="gpt-3.5-turbo-description"
                    type="radio"
                    className="h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    checked={model === 'gpt-3.5-turbo'}
                    onChange={() => setModel('gpt-3.5-turbo')}
                    disabled={disabled}
                  />
                </div>
                <div className="pl-7 text-sm">
                  <label
                    htmlFor="gpt-3.5-turbo"
                    className="font-medium text-gray-600"
                  >
                    GPT 3.5 Turbo - Legacy
                  </label>
                  <p id="gpt-3.5-turbo-description" className="text-gray-500">
                    Previous generation model. Recommend upgrading to GPT-4.1.
                  </p>
                </div>
              </div>
            )}

            {modelVisibility['gpt-3.5-turbo-0613'] && (
              <div className="relative flex items-start">
                <div className="absolute flex h-5 items-center">
                  <input
                    id="gpt-3.5-turbo-0613"
                    name="model"
                    value="gpt-3.5-turbo-0613"
                    aria-describedby="gpt-3.5-turbo-0613-description"
                    type="radio"
                    className="h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                    checked={model === 'gpt-3.5-turbo-0613'}
                    onChange={() => setModel('gpt-3.5-turbo-0613')}
                    disabled={disabled}
                  />
                </div>
                <div className="pl-7 text-sm">
                  <label
                    htmlFor="gpt-3.5-turbo-0613"
                    className="font-medium text-gray-500"
                  >
                    GPT 3.5 Turbo (Old June 2023 Version) - Legacy
                  </label>
                  <p
                    id="gpt-3.5-turbo-0613-description"
                    className="text-gray-500"
                  >
                    The previous model retiring June 2024. Not recommended.
                  </p>
                </div>
              </div>
            )}
        </div>
        {short && (
          <p className="mt-2 text-xs text-gray-500">
            More model choices available later in your bot settings
          </p>
        )}
        </fieldset>


      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="language"
            className="flex items-center gap-1.5 text-sm font-medium text-gray-900"
          >
            Language
            <Tooltip content="Sets the default language for prompts and widget labels. The bot will still detect and respond in the language used in messages.">
              <InformationCircleIcon className="h-4 w-4 text-gray-500" />
            </Tooltip>
          </label>
          <select
            id="language"
            name="language"
            className="mt-2 block w-full rounded-md border-0 py-1.5 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-cyan-600 sm:text-sm sm:leading-6"
            defaultValue={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={disabled}
          >
            {Object.keys(i18n).map((key) => (
              <option key={key} value={key}>
                {i18n[key].name}
              </option>
            ))}
          </select>
        </div>

        {!short && !model.startsWith('gpt-5') && (
          <div>
            <label
              htmlFor="temperature"
              className="flex items-center gap-1.5 text-sm font-medium text-gray-900"
            >
              Temperature
              <Tooltip content="Controls how creative vs precise the bot's responses are. Lower values (closer to 0) make responses more focused and predictable, while higher values make them more creative and varied.">
                <InformationCircleIcon className="h-4 w-4 text-gray-500" />
              </Tooltip>
            </label>
            <div className="mt-2">
              <input
                type="range"
                name="temperature"
                id="temperature"
                min="0"
                max="1"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                disabled={disabled}
                className="transparent h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-300 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-600"
              />
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>Predictable</span>
                <span className="text-center font-semibold">
                  {temperature === Math.floor(temperature)
                    ? temperature.toFixed(0)
                    : temperature.toFixed(1)}
                </span>
                <span>Creative</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {!short && (
        <>
          {(bot?.classify === false || bot?.classify === undefined) && ( //don't allow new selection of classify
            <div className="mt-4">
              <FieldToggle
                label="Classify Answers"
                description="Classify if the bot could answer the user question in logs. (recommended)"
                enabled={classifySwitch}
                setEnabled={setClassifySwitch}
                disabled={disabled}
              />
            </div>
          )}
          <fieldset
            id="suggested-questions"
            aria-describedby="suggested-questions-description"
          >
            <div>
              <legend
                htmlFor="suggested-questions"
                className="block text-sm font-medium text-gray-900"
              >
                Suggested questions
              </legend>
              <p
                id="suggested-questions-description"
                className="text-sm text-gray-500"
              >
                A random selection of these sample questions will be shown to
                users in the chat interfaces.
              </p>
              {questions !== undefined &&
                questions.map((_, index) => (
                  <QuestionPrompt index={index} key={index} />
                ))}
              <div className="mt-2 flex justify-center">
                <button
                  type="button"
                  className="flex items-center justify-center rounded-md px-2 py-1 text-cyan-700 hover:text-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                  onClick={() => addQuestion()}
                >
                  <PlusIcon className="h-5 w-5" aria-hidden="true" />
                  Add
                </button>
              </div>
            </div>
          </fieldset>

          <fieldset id="glossary" aria-describedby="glossary-description">
            <div>
              <legend
                htmlFor="glossary"
                className="block text-sm font-medium text-gray-900"
              >
                Glossary
                {!checkPlanPermission(team, 'pro', 'glossary').allowed ? (
                  <span className="ml-4 inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-medium text-cyan-800">
                    {
                      checkPlanPermission(team, 'pro', 'glossary')
                        .requiredPlanLabel
                    }
                  </span>
                ) : (
                  <span className="ml-4 inline-flex items-center rounded-full bg-cyan-600 px-2.5 py-0.5 text-xs font-medium text-white">
                    New!
                  </span>
                )}
              </legend>
              <p id="glossary-description" className="text-sm text-gray-500">
                Define a list of words and their equivalents in your
                documentation for the bot to use when finding relevant sources.
                This can help the bot understand the user's question better when
                using brand or product-specific terminology or translations.
                Words are case-insensitive and only the full word is matched.
                <Link
                  href="https://docsbot.ai/documentation/doc/glossary-improve-search-relevance-with-smart-term-replacement"
                  target="_blank"
                  className="ml-1 text-cyan-600 hover:text-cyan-500"
                >
                  Learn more &rarr;
                </Link>
              </p>
              {glossary !== undefined &&
                glossary.map((_, index) => (
                  <GlossaryEntry index={index} key={index} />
                ))}
              <div className="mt-2 flex justify-center">
                <button
                  type="button"
                  className="flex items-center justify-center rounded-md px-2 py-1 text-cyan-700 hover:text-cyan-900 focus:outline-none focus:ring-2 focus:ring-cyan-600"
                  onClick={() => addGlossary()}
                  disabled={disabled}
                >
                  <PlusIcon className="h-5 w-5" aria-hidden="true" />
                  Add
                </button>
              </div>
            </div>
          </fieldset>

          <div className="border-t border-gray-900/10 pt-6">
            <h2 className="text-base font-semibold leading-7 text-gray-900">
              Rate Limiting
              {!checkPlanPermission(team, 'business').allowed && (
                <span className="ml-4 inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-medium text-cyan-800">
                  {checkPlanPermission(team, 'business').requiredPlanLabel}
                </span>
              )}
            </h2>
            <p className="mt-1 text-sm leading-6 text-gray-600">
              Rate limiting is a way to prevent abuse of your bot and excessive
              OpenAI usage costs.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div className="sm:col-span-1 sm:col-start-1">
                <label
                  htmlFor="rateLimitMessages"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Messages
                </label>
                <div className="mt-2">
                  <input
                    type="number"
                    min={1}
                    name="rateLimitMessages"
                    id="rateLimitMessages"
                    value={rateLimitMessages}
                    onChange={(e) => setRateLimitMessages(e.target.value)}
                    disabled={
                      disabled || !checkPlanPermission(team, 'business').allowed
                    }
                    aria-describedby="rateLimitMessages-description"
                    className="block w-full rounded-md border-0 py-1.5 text-center text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-600 sm:text-sm sm:leading-6"
                  />
                </div>
                <p
                  className="mt-2 text-sm text-gray-500"
                  id="rateLimitMessages-description"
                >
                  {rateLimitMessages} Messages (questions)
                </p>
              </div>

              <div className="sm:col-span-1">
                <label
                  htmlFor="rateLimitSeconds"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  Seconds
                </label>
                <div className="mt-2">
                  <input
                    type="number"
                    min={1}
                    name="rateLimitSeconds"
                    id="rateLimitSeconds"
                    value={rateLimitSeconds}
                    onChange={(e) => setRateLimitSeconds(e.target.value)}
                    disabled={
                      disabled || !checkPlanPermission(team, 'business').allowed
                    }
                    aria-describedby="rateLimitSeconds-description"
                    className="block w-full rounded-md border-0 py-1.5 text-center text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-600 sm:text-sm sm:leading-6"
                  />
                </div>
                <p
                  className="mt-2 text-sm text-gray-500"
                  id="rateLimitSeconds-description"
                >
                  Per {rateLimitSeconds} seconds
                </p>
              </div>

              <div className="sm:col-span-4">
                <label
                  htmlFor="rateLimitIPAllowlist"
                  className="block text-sm font-medium leading-6 text-gray-900"
                >
                  IP Allowlist
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="rateLimitIPAllowlist"
                    id="rateLimitIPAllowlist"
                    value={rateLimitIPField}
                    onChange={(e) => setRateLimitIPField(e.target.value)}
                    disabled={
                      disabled || !checkPlanPermission(team, 'business').allowed
                    }
                    aria-describedby="rateLimitMessages-description"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-600 sm:text-sm sm:leading-6"
                  />
                </div>
                <p
                  className="mt-2 text-sm text-gray-500"
                  id="rateLimitIPAllowlist-description"
                >
                  Comma-separated IPs that should be exempt from rate limiting.
                </p>
              </div>
            </div>

            <div className="mt-4">
              <label
                htmlFor="rateLimitMessage"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Warning Message
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="rateLimitMessage"
                  id="rateLimitMessage"
                  value={labels?.rateLimitMessage}
                  onChange={(e) =>
                    setLabels({ ...labels, rateLimitMessage: e.target.value })
                  }
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-cyan-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
            <div className="mt-4">
              <FieldToggle
                label="Record IP Addresses"
                description="Record unhashed IP addresses of users to help monitor abuse. Has privacy implications."
                enabled={recordIP}
                setEnabled={setRecordIP}
                disabled={!checkPlanPermission(team, 'business').allowed}
              />
            </div>
          </div>
        </>
      )}
    </>
  )
}
