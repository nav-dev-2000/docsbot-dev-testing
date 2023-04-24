import { useEffect, useState, useCallback } from 'react'
import { PlusIcon, XMarkIcon } from '@heroicons/react/20/solid'
import { stripePlan } from '@/utils/helpers'
import Link from 'next/link'
import ModalCheckout from '@/components/ModalCheckout'

export default function FormBot({ team, bot, setBotSettings, disabled }) {
  const [language, setLanguage] = useState(bot?.language || 'en')
  const [botName, setBotName] = useState(bot?.name || '')
  const [botDescription, setBotDescription] = useState(bot?.description || '')
  const [privacy, setPrivacy] = useState(bot?.privacy || 'public')
  const [model, setModel] = useState(bot?.model || 'gpt-3.5-turbo')
  const [questions, setQuestions] = useState(bot?.questions || [])
  const [showUpgrade, setShowUpgrade] = useState(false)

  useEffect(() => {
    setBotSettings({
      language,
      name: botName,
      description: botDescription,
      privacy,
      model,
      questions,
    })
  }, [language, botName, botDescription, privacy, model, questions])

  //show upgrade if they change privacy to private
  useEffect(() => {
    if (privacy === 'private' && stripePlan(team).name === 'Free') {
      setShowUpgrade(true)
      setPrivacy('public')
    }
  }, [privacy])

  //show upgrade if they change model to gpt-4
  useEffect(() => {
    if (model === 'gpt-4' && stripePlan(team).name === 'Free') {
      setShowUpgrade(true)
      setModel('gpt-3.5-turbo')
    }
  }, [model])

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

  const QuestionPrompt = ({ index }) => {
    const [question, setQuestion] = useState(questions[index])

    return (
      <fieldset
        id="suggested-questions"
        aria-describedby="suggested-questions-description"
        className="flex items-start pt-2"
      >
        <div className="w-full text-sm">
          <input
            type="text"
            name="project-name"
            id="project-name"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onBlur={(e) => {
              updateQuestion(index, e.target.value)
            }}
            placeholder={`What is ${bot.name}?`}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
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
      </fieldset>
    )
  }

  return (
    <>
      <ModalCheckout team={team} open={showUpgrade} setOpen={setShowUpgrade} />
      <div>
        <label htmlFor="project-name" className="block text-sm font-medium text-gray-900">
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
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
          />
        </div>
      </div>
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-900">
          Description
        </label>
        <div className="mt-1">
          <textarea
            id="description"
            name="description"
            placeholder="(optional) Describe what your bot will do and how it will be used, e.g. 'Ask me anything about my product!'"
            rows={4}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 sm:text-sm"
            value={botDescription}
            disabled={disabled}
            onChange={(e) => setBotDescription(e.target.value)}
          />
        </div>
      </div>

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
              <label htmlFor="privacy-public" className="font-medium text-gray-900">
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
                <label htmlFor="privacy-private" className="font-medium text-gray-900">
                  Private
                  {stripePlan(team).name === 'Free' && (
                    <span className="ml-4 inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-medium text-cyan-800">
                      Paid
                    </span>
                  )}
                </label>
                <p id="privacy-private-description" className="text-gray-500">
                  Authenticated API access only. Good for internal company content.
                </p>
              </div>
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-gray-900">OpenAI Model</legend>
        <div className="mt-2 space-y-2">
          <div className="relative flex items-start">
            <div className="absolute flex h-5 items-center">
              <input
                id="model-public"
                name="model"
                value="gpt-3.5-turbo"
                aria-describedby="model-public-description"
                type="radio"
                className="h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                checked={model === 'gpt-3.5-turbo'}
                onChange={() => setModel('gpt-3.5-turbo')}
                disabled={disabled}
              />
            </div>
            <div className="pl-7 text-sm">
              <label htmlFor="model-public" className="font-medium text-gray-900">
                GPT 3.5 (Original ChatGPT)
              </label>
              <p id="model-public-description" className="text-gray-500">
                The fastest and cheapest (&lt;$0.005/question) model good for most use cases.
              </p>
            </div>
          </div>
          <div>
            <div className="relative flex items-start">
              <div className="absolute flex h-5 items-center">
                <input
                  id="model-private"
                  name="model"
                  value="gpt-4"
                  aria-describedby="model-private-to-project-description"
                  type="radio"
                  className="h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                  checked={model === 'gpt-4'}
                  onChange={() => setModel('gpt-4')}
                  disabled={disabled || !team.supportsGPT4}
                />
              </div>
              <div className="pl-7 text-sm">
                <label htmlFor="model-private" className="font-medium text-gray-900">
                  GPT-4
                  {stripePlan(team).name === 'Free' && (
                    <span className="ml-4 inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-0.5 text-xs font-medium text-cyan-800">
                      Paid
                    </span>
                  )}
                </label>
                <p id="model-private-description" className="text-gray-500">
                  Most powerful but slower and more expensive (&lt;$0.09/question) model for
                  advanced reasoning or content creation needs.
                  {!team.supportsGPT4 && (
                    <Link
                      href="/app/api"
                      className="ml-1 inline-block underline hover:text-gray-800"
                    >
                      Request access
                    </Link>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <legend className="text-sm font-medium text-gray-900">Language</legend>
        <div className="mt-2 flex space-x-8">
          <div className="relative flex items-start">
            <div className="absolute flex h-5 items-center">
              <input
                id="language-english"
                name="language"
                value="en"
                type="radio"
                className="h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                checked={language === 'en'}
                onChange={() => setLanguage('en')}
                disabled={disabled}
              />
            </div>
            <div className="pl-7 text-sm">
              <label htmlFor="language-english" className="font-medium text-gray-900">
                English
              </label>
            </div>
          </div>
          <div>
            <div className="relative flex items-start">
              <div className="absolute flex h-5 items-center">
                <input
                  id="language-japanese"
                  name="language"
                  value="jp"
                  type="radio"
                  className="h-4 w-4 border-gray-300 text-cyan-600 focus:ring-cyan-500"
                  checked={language === 'jp'}
                  onChange={() => setLanguage('jp')}
                  disabled={disabled}
                />
              </div>
              <div className="pl-7 text-sm">
                <label htmlFor="language-japanese" className="font-medium text-gray-900">
                  Japanese (日本語)
                </label>
              </div>
            </div>
          </div>
        </div>
      </fieldset>

      <fieldset>
        <div>
          <label htmlFor="suggested-questions" className="block text-sm font-medium text-gray-900">
            Suggested questions
          </label>
          <p id="suggested-questions-description" className="text-gray-500 text-sm">
            A random selection of these sample questions will be shown to users in the chat interfaces.
          </p>
          {questions !== undefined &&
            questions.map((_, index) => <QuestionPrompt index={index} key={index} />)}
          <div className="mt-2 flex justify-center">
            <button
              type="button"
              className="flex items-center justify-center rounded-full bg-cyan-50 px-3 py-1 text-cyan-700 hover:bg-cyan-100 focus:ring-cyan-600 focus:ring-offset-cyan-50"
              onClick={() => addQuestion()}
            >
              <PlusIcon className="mr-1 h-5 w-5 text-cyan-700" aria-hidden="true" />
              Add
            </button>
          </div>
        </div>
      </fieldset>
    </>
  )
}
