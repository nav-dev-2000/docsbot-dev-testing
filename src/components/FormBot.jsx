import { useEffect, useRef, useState } from 'react'
import { InformationCircleIcon } from '@heroicons/react/24/outline'
import { checkPlanPermission } from '@/utils/helpers'
import ModalCheckout from '@/components/ModalCheckout'
import { i18n } from '@/constants/strings.constants'
import { PRESET_PROMPTS } from '@/constants/prompts.constants'
import FieldToggle from '@/components/FieldToggle'
import RadioField from '@/components/RadioField'
import Tooltip from '@/components/Tooltip'
import PresetPromptSelect from '@/components/PresetPromptSelect'
import Glossary from '@/components/Glossary'
import ModelSelector from '@/components/ModelSelector'
import SuggestedQuestions from '@/components/SuggestedQuestions'

export default function FormBot({
  team,
  bot,
  setBotSettings,
  disabled,
  short = false,
}) {
  const defaultModel = 'gpt-5-mini'
  const [language, setLanguage] = useState(bot?.language || 'en')
  const [botName, setBotName] = useState(bot?.name || '')
  const [botDescription, setBotDescription] = useState(bot?.description || '')
  const [privacy, setPrivacy] = useState(bot?.privacy || 'public')
  const [model, setModel] = useState(bot?.model || defaultModel)
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
  const [rateLimitIPField, setRateLimitIPField] = useState(
    bot?.rateLimitIPAllowlist?.join(', ') || '',
  )
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [recordIP, setRecordIP] = useState(bot?.recordIP || false)
  const [temperature, setTemperature] = useState(bot?.temperature || 0)
  const [agentPrompt, setAgentPrompt] = useState(bot?.agentPrompt || '')
  const [agentRole, setAgentRole] = useState(bot?.agentRole || '')

  // Sync labels to new language when user changes language (skip initial mount to preserve custom labels)
  const isInitialMount = useRef(true)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }
    if (language && i18n[language]?.labels) {
      setLabels(i18n[language].labels)
    }
  }, [language])

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
      classify: true,
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
    temperature,
    agentPrompt,
  ])

  const handleAgentPromptChange = (value) => {
    // Don't allow HELPSCOUT preset for agent prompts
    if (value === 'HELPSCOUT') return

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
    // Don't allow HELPSCOUT preset for agent prompts
    if (agentRole && agentRole !== 'HELPSCOUT' && PRESET_PROMPTS[agentRole]) {
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
    if (!checkPlanPermission(team, 'personal').allowed) {
      //free or hobby plan
      // For non-personal plans, keep existing behavior
      if (
        [
          'gpt-5.2',
          'gpt-5.1',
          'gpt-5',
          'gpt-5-nano',
          'gpt-4.1',
          'gpt-4o',
        ].includes(model)
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
        setModel('gpt-5-mini') // Default to gpt-5-mini since they're on paid plan
        console.log(
          'Reverting to gpt-5-mini for paid plan user without OpenAI key',
        )
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
          <RadioField
            id="privacy-public"
            name="privacy"
            value="public"
            checked={privacy === 'public'}
            onChange={() => setPrivacy('public')}
            disabled={disabled}
            descriptionId="privacy-public-description"
            label="Public access"
            description="Allows for embedding on the frontend of websites."
          />
          <RadioField
            id="privacy-private"
            name="privacy"
            value="private"
            checked={privacy === 'private'}
            onChange={() => setPrivacy('private')}
            disabled={disabled}
            ariaDescribedBy="privacy-private-to-project-description"
            descriptionId="privacy-private-description"
            label={
              <>
                Private
                {!checkPlanPermission(team, 'hobby').allowed && (
                  <span className="ml-4 inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-medium text-cyan-800">
                    Paid
                  </span>
                )}
              </>
            }
            description="Authenticated API access only. Good for internal company content."
          />
        </div>
      </fieldset>

      <ModelSelector
        team={team}
        model={model}
        onModelChange={setModel}
        disabled={disabled}
        short={short}
      />

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
          <SuggestedQuestions
            questions={questions}
            addQuestion={addQuestion}
            updateQuestion={updateQuestion}
            removeQuestion={removeQuestion}
            placeholder={`What is ${bot.name}?`}
          />

          <Glossary
            team={team}
            bot={bot}
            glossary={glossary}
            onGlossaryChange={setGlossary}
            onUpgradeRequired={() => setShowUpgrade(true)}
            disabled={disabled}
          />

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
