import { NextSeo } from 'next-seo'
import { useState, useEffect, useRef } from 'react'
import Footer from '@/components/Footer'
import Header from '@/components/Header'
import Alert from '@/components/Alert'
import LoadingSpinner from '@/components/LoadingSpinner'
import RegisterCTA from '@/components/RegisterCTA'
import FreeToolsGrid from '@/components/FreeToolsGrid'
import { usePostHog } from 'posthog-js/react'
import { StarRating } from '@/components/StarRating'
import { getRating } from '@/lib/tools'
import {
  AcademicCapIcon,
  EnvelopeIcon,
  ClipboardDocumentIcon,
  MagnifyingGlassIcon,
  ChatBubbleBottomCenterTextIcon,
  GlobeAltIcon,
  PencilIcon,
  FaceSmileIcon,
  DocumentTextIcon,
  UserGroupIcon,
  SparklesIcon as SparklesIconOutline,
  LanguageIcon,
  ChevronDownIcon,
} from '@heroicons/react/24/outline'
import { PlusIcon, MinusIcon, SparklesIcon } from '@heroicons/react/24/solid'
import { Disclosure } from '@headlessui/react'
import { FAQPageJsonLd } from 'next-seo'
import { Streamdown, defaultRemarkPlugins } from '@/components/Streamdown'
import remarkExternalLinks from 'remark-external-links'
import { preprocessMath } from '@/utils/markdown'
import ToolsSignupModal from '@/components/ToolsSignupModal'

const loadingText = [
  'Analyzing your conversation...',
  'Detecting language...',
  'Translating content...',
  'Polishing the translation...',
  'Finalizing your translated conversation...',
]

// text that slowly fades in and out walking through the above array
const LoadingText = () => {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prevIndex) => {
        if (prevIndex < loadingText.length - 1) {
          return prevIndex + 1
        }
        clearInterval(interval)
        return prevIndex
      })
    }, 4000)

    return () => clearInterval(interval)
  }, [])

  return <p className="animate-pulse">{loadingText[index]}</p>
}

// All languages supported by ChatGPT
const languages = [
  { id: 'auto', name: 'Auto-detect' },
  { id: 'af', name: 'Afrikaans' },
  { id: 'sq', name: 'Albanian' },
  { id: 'am', name: 'Amharic' },
  { id: 'ar', name: 'Arabic' },
  { id: 'hy', name: 'Armenian' },
  { id: 'az', name: 'Azerbaijani' },
  { id: 'eu', name: 'Basque' },
  { id: 'be', name: 'Belarusian' },
  { id: 'bn', name: 'Bengali' },
  { id: 'bs', name: 'Bosnian' },
  { id: 'bg', name: 'Bulgarian' },
  { id: 'ca', name: 'Catalan' },
  { id: 'ceb', name: 'Cebuano' },
  { id: 'zh', name: 'Chinese (Simplified)' },
  { id: 'zh-TW', name: 'Chinese (Traditional)' },
  { id: 'co', name: 'Corsican' },
  { id: 'hr', name: 'Croatian' },
  { id: 'cs', name: 'Czech' },
  { id: 'da', name: 'Danish' },
  { id: 'nl', name: 'Dutch' },
  { id: 'en', name: 'English' },
  { id: 'eo', name: 'Esperanto' },
  { id: 'et', name: 'Estonian' },
  { id: 'fi', name: 'Finnish' },
  { id: 'fr', name: 'French' },
  { id: 'fy', name: 'Frisian' },
  { id: 'gl', name: 'Galician' },
  { id: 'ka', name: 'Georgian' },
  { id: 'de', name: 'German' },
  { id: 'el', name: 'Greek' },
  { id: 'gu', name: 'Gujarati' },
  { id: 'ht', name: 'Haitian Creole' },
  { id: 'ha', name: 'Hausa' },
  { id: 'haw', name: 'Hawaiian' },
  { id: 'he', name: 'Hebrew' },
  { id: 'hi', name: 'Hindi' },
  { id: 'hmn', name: 'Hmong' },
  { id: 'hu', name: 'Hungarian' },
  { id: 'is', name: 'Icelandic' },
  { id: 'ig', name: 'Igbo' },
  { id: 'id', name: 'Indonesian' },
  { id: 'ga', name: 'Irish' },
  { id: 'it', name: 'Italian' },
  { id: 'ja', name: 'Japanese' },
  { id: 'jv', name: 'Javanese' },
  { id: 'kn', name: 'Kannada' },
  { id: 'kk', name: 'Kazakh' },
  { id: 'km', name: 'Khmer' },
  { id: 'rw', name: 'Kinyarwanda' },
  { id: 'ko', name: 'Korean' },
  { id: 'ku', name: 'Kurdish' },
  { id: 'ky', name: 'Kyrgyz' },
  { id: 'lo', name: 'Lao' },
  { id: 'la', name: 'Latin' },
  { id: 'lv', name: 'Latvian' },
  { id: 'lt', name: 'Lithuanian' },
  { id: 'lb', name: 'Luxembourgish' },
  { id: 'mk', name: 'Macedonian' },
  { id: 'mg', name: 'Malagasy' },
  { id: 'ms', name: 'Malay' },
  { id: 'ml', name: 'Malayalam' },
  { id: 'mt', name: 'Maltese' },
  { id: 'mi', name: 'Maori' },
  { id: 'mr', name: 'Marathi' },
  { id: 'mn', name: 'Mongolian' },
  { id: 'my', name: 'Myanmar (Burmese)' },
  { id: 'ne', name: 'Nepali' },
  { id: 'no', name: 'Norwegian' },
  { id: 'ny', name: 'Nyanja (Chichewa)' },
  { id: 'or', name: 'Odia (Oriya)' },
  { id: 'ps', name: 'Pashto' },
  { id: 'fa', name: 'Persian' },
  { id: 'pl', name: 'Polish' },
  { id: 'pt', name: 'Portuguese' },
  { id: 'pa', name: 'Punjabi' },
  { id: 'ro', name: 'Romanian' },
  { id: 'ru', name: 'Russian' },
  { id: 'sm', name: 'Samoan' },
  { id: 'gd', name: 'Scots Gaelic' },
  { id: 'sr', name: 'Serbian' },
  { id: 'st', name: 'Sesotho' },
  { id: 'sn', name: 'Shona' },
  { id: 'sd', name: 'Sindhi' },
  { id: 'si', name: 'Sinhala' },
  { id: 'sk', name: 'Slovak' },
  { id: 'sl', name: 'Slovenian' },
  { id: 'so', name: 'Somali' },
  { id: 'es', name: 'Spanish' },
  { id: 'su', name: 'Sundanese' },
  { id: 'sw', name: 'Swahili' },
  { id: 'sv', name: 'Swedish' },
  { id: 'tl', name: 'Tagalog (Filipino)' },
  { id: 'tg', name: 'Tajik' },
  { id: 'ta', name: 'Tamil' },
  { id: 'tt', name: 'Tatar' },
  { id: 'te', name: 'Telugu' },
  { id: 'th', name: 'Thai' },
  { id: 'tr', name: 'Turkish' },
  { id: 'tk', name: 'Turkmen' },
  { id: 'uk', name: 'Ukrainian' },
  { id: 'ur', name: 'Urdu' },
  { id: 'ug', name: 'Uyghur' },
  { id: 'uz', name: 'Uzbek' },
  { id: 'vi', name: 'Vietnamese' },
  { id: 'cy', name: 'Welsh' },
  { id: 'xh', name: 'Xhosa' },
  { id: 'yi', name: 'Yiddish' },
  { id: 'yo', name: 'Yoruba' },
  { id: 'zu', name: 'Zulu' },
]

const SupportConversationTranslator = () => {
  const [input, setInput] = useState('')
  const [isComputing, setIsComputing] = useState(false)
  const [errorText, setErrorText] = useState(null)
  const [translatedResults, setTranslatedResults] = useState([])
  const [isCopied, setIsCopied] = useState(false)
  const [selectedLanguage, setSelectedLanguage] = useState('auto')
  const [browserLanguage, setBrowserLanguage] = useState('en')
  const [browserLanguageName, setBrowserLanguageName] = useState('English')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const posthog = usePostHog()
  const [showSignupModal, setShowSignupModal] = useState(false)

  useEffect(() => {
    // Detect browser language
    const detectBrowserLanguage = () => {
      const browserLang = navigator.language || navigator.userLanguage
      const langCode = browserLang.split('-')[0] // Get primary language code
      
      // Check if we support this language
      const supportedLang = languages.find(lang => lang.id === langCode)
      if (supportedLang) {
        setBrowserLanguage(langCode)
        setBrowserLanguageName(supportedLang.name)
      } else {
        setBrowserLanguage('en')
        setBrowserLanguageName('English')
      }
    }
    
    detectBrowserLanguage()
  }, [])

  useEffect(() => {
    if (!showSignupModal) {
      setErrorText(null)
    }
  }, [showSignupModal])
  
  // Add event listener to detect dropdown state changes
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    const handleDropdownClick = () => {
      setIsDropdownOpen(prev => !prev)
    }

    const selectElement = dropdownRef.current
    if (selectElement) {
      selectElement.addEventListener('click', handleDropdownClick)
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      if (selectElement) {
        selectElement.removeEventListener('click', handleDropdownClick)
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [])
  
  const translateConversation = async (userInput, targetLanguage) => {
    setIsComputing(true)
    setErrorText('')

    if (!userInput.trim()) {
      setErrorText('Please enter a support conversation to translate.')
      setIsComputing(false)
      posthog?.capture('Free Tool', {
        tool: 'Support Conversation Translator',
        action: 'Error',
        error: 'Empty Input',
        category: 'Support',
      })
      return
    }

    // Get the language name for the selected language ID
    let languageId = targetLanguage
    let languageName = 'Unknown'
    
    if (targetLanguage === 'auto') {
      // If auto-detect is selected, use the browser language
      languageId = browserLanguage
      languageName = browserLanguageName
    } else {
      // Otherwise find the language name for the selected language ID
      const selectedLanguageObj = languages.find(lang => lang.id === targetLanguage)
      languageName = selectedLanguageObj ? selectedLanguageObj.name : 'Unknown'
    }

    const endpoint = `/api/tools/text-prompter`
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'supportConversationTranslator',
          input: userInput,
          targetLanguage: languageId + ' (' + languageName + ')',
        }),
      })

      if (!response.ok) {
        if (response.status === 429) {
          setErrorText(
            'Daily usage limit exceeded, please try again tomorrow.',
          )
          setShowSignupModal(true)
        } else {
          const errorData = await response.json()
          setErrorText(
            errorData.message || 'Something went wrong, please try again.',
          )
          posthog?.capture('Free Tool', {
            tool: 'Support Conversation Translator',
            action: 'Error',
            error: errorData.message || 'Unknown error',
            category: 'Support',
          })
        }
      } else {
        const data = await response.json()
        setTranslatedResults((prevResults) => [
          ...prevResults,
          {
            text: data,
            language: languageId,
            languageName: languageName,
          },
        ])
        posthog?.capture('Free Tool', {
          tool: 'Support Conversation Translator',
          action: 'Used',
          language: languageId,
          languageName: languageName,
          category: 'Support',
        })
      }
    } catch (e) {
      setErrorText('Error: ' + e.message)
      posthog?.capture('Free Tool', {
        tool: 'Support Conversation Translator',
        action: 'Error',
        error: e.message,
        category: 'Support',
      })
    }

    setIsComputing(false)
  }

  const copyLatestTranslation = () => {
    if (translatedResults.length > 0) {
      navigator.clipboard.writeText(translatedResults[translatedResults.length - 1].text)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    }
  }

  const handleNewTranslation = () => {
    setInput('')
    setTranslatedResults([])
    // Scroll to top of page smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="py-12 pb-0">
        <div className="mx-auto rounded-xl bg-white px-6 py-6 pt-4 shadow-xl ring-1 ring-slate-900/10 lg:p-8 lg:pt-8">
          <Alert title={errorText} type="error" />

          {/* Only show the input section if there are no results */}
          {translatedResults.length === 0 && (
            <>
              <textarea
                id="original-text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={isComputing}
                placeholder="Paste or type your support conversation here..."
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-cyan-500 focus:ring-cyan-500 disabled:bg-gray-100 disabled:opacity-75 sm:text-sm"
                rows={6}
                maxLength={10000}
              />
              
              <div className="mt-4">
                <label htmlFor="language-selector" className="block text-sm font-medium text-gray-700 mb-2">
                  Choose a language to translate to:
                </label>
                <div className="relative">
                  <div className="relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 z-10">
                      <LanguageIcon className="h-5 w-5 text-cyan-500" aria-hidden="true" />
                    </div>
                    <div className="relative">
                      <select
                        ref={dropdownRef}
                        id="language-selector"
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value)}
                        className="block w-full rounded-md border-gray-300 py-2 pl-10 pr-10 text-base focus:border-cyan-500 focus:outline-none focus:ring-cyan-500 sm:text-sm transition-all duration-200 hover:border-cyan-400 appearance-none bg-white transform hover:scale-[1.01] focus:scale-[1.01]"
                        style={{ 
                          WebkitAppearance: 'none', 
                          MozAppearance: 'none',
                          appearance: 'none',
                          backgroundImage: 'none'
                        }}
                        disabled={isComputing}
                      >
                        <option value="auto" className="font-medium">Auto-detect ({browserLanguageName})</option>
                        <optgroup label="Common Languages">
                          {languages
                            .filter(lang => ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'].includes(lang.id))
                            .map((language) => (
                              <option key={language.id} value={language.id}>
                                {language.name}
                              </option>
                            ))}
                        </optgroup>
                        <optgroup label="All Languages">
                          {languages
                            .filter(lang => !['auto', 'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko'].includes(lang.id))
                            .map((language) => (
                              <option key={language.id} value={language.id}>
                                {language.name}
                              </option>
                            ))}
                        </optgroup>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 z-10">
                        <ChevronDownIcon 
                          className={`h-5 w-5 text-cyan-500 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                          aria-hidden="true" 
                        />
                      </div>
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Select a language or use auto-detect to match your browser settings
                  </p>
                </div>
              </div>
            </>
          )}

          {translatedResults.map((result, index) => (
            <TranslationResult key={index} result={result} />
          ))}

          {/* Only show the form if there are no results */}
          {translatedResults.length === 0 && (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                translateConversation(input, selectedLanguage)
              }}
            >
              <div className="mt-6 flex justify-center">
                <button
                  type="submit"
                  disabled={isComputing}
                  className="inline-flex items-center justify-center rounded-lg border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed w-full"
                >
                  {isComputing ? (
                    <>
                      <LoadingSpinner /> <LoadingText />
                    </>
                  ) : (
                    <>
                      <LanguageIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                      Translate Conversation
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {translatedResults.length > 0 && (
            <div className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-2">
              <button
                type="button"
                onClick={handleNewTranslation}
                className="inline-flex items-center justify-center rounded-lg border border-transparent bg-cyan-600 px-4 py-2 text-sm font-medium text-white shadow-md hover:bg-cyan-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 transition-all duration-200 hover:shadow-lg"
              >
                <LanguageIcon className="mr-2 h-5 w-5" aria-hidden="true" />
                Translate New Conversation
              </button>
              <button
                onClick={copyLatestTranslation}
                type="button"
                className={`rounded-lg text-center bg-white px-3 py-2 text-sm font-semibold text-gray-500 shadow-md ring-1 ring-inset transition-all duration-200 hover:shadow-lg ${
                  isCopied ? 'ring-green-500' : 'ring-gray-300'
                } hover:bg-gray-50`}
                title="Copy to clipboard"
              >
                <div className="flex items-center justify-center">
                  <ClipboardDocumentIcon className={`h-5 w-5 transition-colors duration-200 ${
                    isCopied ? 'text-green-500' : 'text-gray-600'
                  }`} />
                  <span className={`ml-2 transition-colors duration-200 ${
                    isCopied ? 'text-green-500' : 'text-gray-500'
                  }`}>
                    {isCopied ? 'Copied!' : 'Copy Translation'}
                  </span>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>

      <ToolsSignupModal 
        open={showSignupModal}
        setOpen={setShowSignupModal}
        toolName="Support Conversation Translator"
        toolCategory="Support"
      />
    </div>
  )
}

const TranslationResult = ({ result }) => {
  const [copySuccess, setCopySuccess] = useState(false)

  const copyToClipboard = (e) => {
    e.preventDefault()
    e.stopPropagation()
    navigator.clipboard.writeText(result.text).then(() => {
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    })
  }

  const streamdownRemarkPlugins = [
    ...Object.values(defaultRemarkPlugins),
    [remarkExternalLinks, { target: '_blank', rel: ['noopener'] }],
  ]
  
  const getLanguageName = (languageId) => {
    if (result.languageName) return result.languageName
    const language = languages.find(l => l.id === languageId)
    return language ? language.name : 'Translated'
  }

  return (
    <div className="relative">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">
          {getLanguageName(result.language)} Translation:
        </h3>
      </div>
      <div className="prose prose-h2:mt-0 min-h-16 max-w-none rounded-lg bg-gray-50 p-4 text-left shadow-sm ring-1 ring-gray-200">
        <Streamdown
          mode="static"
          isAnimating={false}
          remarkPlugins={streamdownRemarkPlugins}
        >
          {preprocessMath(result.text)}
        </Streamdown>
      </div>
    </div>
  )
}

const useCases = [
  {
    name: 'International Customer Support',
    description: 'Provide support to customers in their preferred language, improving satisfaction and understanding.',
    icon: GlobeAltIcon,
  },
  {
    name: 'Multilingual Team Communication',
    description:
      'Facilitate communication between support team members who speak different languages.',
    icon: UserGroupIcon,
  },
  {
    name: 'Global Customer Service',
    description:
      'Expand your customer service reach to international markets without language barriers.',
    icon: ChatBubbleBottomCenterTextIcon,
  },
  {
    name: 'Technical Support Across Languages',
    description:
      'Deliver technical support and troubleshooting assistance to customers in their native language.',
    icon: AcademicCapIcon,
  },
  {
    name: 'Improve Customer Experience',
    description:
      'Create a more inclusive support experience by communicating in the customer\'s preferred language.',
    icon: FaceSmileIcon,
  },
  {
    name: 'Streamline Support Workflow',
    description:
      'Efficiently handle support conversations in multiple languages without needing multiple support agents.',
    icon: PencilIcon,
  },
]

const faqs = [
  {
    question: 'What is an AI Support Conversation Translator?',
    answer: 'An AI Support Conversation Translator is a specialized tool that uses artificial intelligence to translate support conversations between different languages. It helps support teams communicate effectively with customers who speak different languages.',
  },
  {
    question: 'How does the Support Conversation Translator work?',
    answer:
      'Our Support Conversation Translator works with any text-based support conversation. Simply paste your conversation, select your desired target language, and our AI will translate it while maintaining the original meaning and context.',
  },
  {
    question: 'What languages are supported?',
    answer:
      'Our tool supports over 100 languages including English, Spanish, French, German, Chinese, Japanese, Portuguese, Russian, and many more. The tool can also automatically detect the language of your conversation.',
  },
  {
    question: 'How can this improve my customer support workflow?',
    answer:
      'The Support Conversation Translator helps you provide support to international customers, communicate with multilingual team members, expand your global reach, and create a more inclusive support experience without language barriers.',
  },
  {
    question: 'Is my support conversation data secure?',
    answer:
      'We take data security seriously. All support conversations processed by our translator are encrypted in transit and not stored on our servers. Your conversation content and translations remain confidential and are automatically deleted after processing.',
  },
  {
    question: 'Can it handle technical support conversations?',
    answer:
      'Yes, our AI is trained to understand and translate technical support conversations effectively. It can maintain technical accuracy while translating between languages.',
  },
  {
    question: 'How accurate are the translations?',
    answer:
      'Our AI Support Conversation Translator uses advanced natural language processing to ensure high accuracy. It effectively maintains the original meaning while translating between languages. However, we recommend reviewing translations for critical conversations.',
  },
  {
    question: 'Can I integrate this with my helpdesk system?',
    answer:
      'While our free tool works through copy-paste functionality, DocsBot offers API access and direct integrations with popular helpdesk platforms through our premium plans. Custom train a bot to not only translate, but respond to tickets with AI trained on your knowledge base, documentation, and previous conversations.',
  },
]

export default function SupportConversationTranslatorPage({ starRatingData }) {
  return (
    <>
      <NextSeo
        title="AI Support Conversation Translator | Free Customer Service Tool"
        description="Translate your support conversations with our AI-powered translator. Communicate with international customers in their preferred language."
        openGraph={{
          images: [
            {
              url: 'https://docsbot.ai/images/og/support-conversation-translator.png',
              alt: 'AI Support Conversation Translator',
            },
          ],
        }}
      />
      <FAQPageJsonLd
        mainEntity={faqs.map((faq) => ({
          questionName: faq.question,
          acceptedAnswerText: faq.answer,
        }))}
      />
      <Header />
      <main>
        <div className="relative isolate bg-gray-900">
          <div
            className="absolute inset-x-0 top-0 -z-10 transform-gpu overflow-hidden blur-3xl"
            aria-hidden="true"
          >
            <div
              className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#a4e2ff] to-[#32aa9c] opacity-20 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
              style={{
                clipPath:
                  'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
              }}
            />
          </div>
          <div className="py-12 sm:py-24">
            <div className="mx-auto max-w-7xl px-6 lg:px-8">
              <div className="mx-auto max-w-3xl text-center">
                <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                  Free AI Support Conversation Translator
                </h1>
                <p className="mt-6 text-lg leading-8 text-gray-300">
                  Translate your support conversations to communicate with international customers. Our AI automatically detects the language and translates to your preferred language.
                </p>
                <SupportConversationTranslator />
                <StarRating
                  itemId="support-conversation-translator"
                  name="Support Conversation Translator - DocsBot"
                  className="mx-auto mt-12 flex justify-center text-white"
                  starRatingData={starRatingData}
                />
              </div>
            </div>
          </div>
        </div>

        <RegisterCTA
          customTitle="Automate Your Customer Support Now!"
        />

        {/* How to Use Section */}
        <div className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-cyan-600">
                Easy Translation
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                How to Use Our Free AI Support Conversation Translator
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Translate your support conversations into different languages in seconds with these simple steps.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      1
                    </span>
                    Paste Your Conversation
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Copy your support conversation and paste it into the input box. Our tool works with any type of support communication.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      2
                    </span>
                    Choose Your Language
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Select your desired target language from the dropdown menu and click the 'Translate Conversation' button to transform your text.
                    </p>
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                    <span className="rounded-full bg-cyan-600 px-3 py-1 text-white">
                      3
                    </span>
                    Use Your Translated Conversation
                  </dt>
                  <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                    <p className="flex-auto">
                      Review the translated conversation and copy it for use in your support system. The original meaning is preserved in the new language.
                    </p>
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Use Cases Section */}
        <div className="bg-gray-900 py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl lg:text-center">
              <h2 className="text-base font-semibold leading-7 text-cyan-400">
                Many Applications
              </h2>
              <p className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Use Cases for Our Free AI Support Conversation Translator
              </p>
              <p className="mt-6 text-lg leading-8 text-gray-300">
                Discover how our AI-powered Support Conversation Translator can improve your support workflow and boost productivity across various domains.
              </p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-4xl">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
                {useCases.map((useCase) => (
                  <div key={useCase.name} className="relative pl-16">
                    <dt className="text-base font-semibold leading-7 text-white">
                      <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-600">
                        <useCase.icon
                          className="h-6 w-6 text-white"
                          aria-hidden="true"
                        />
                      </div>
                      {useCase.name}
                    </dt>
                    <dd className="mt-2 text-base leading-7 text-gray-300">
                      {useCase.description}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white">
          <div className="mx-auto max-w-7xl px-6 py-24 sm:py-32 lg:px-8 lg:py-40">
            <div className="mx-auto max-w-4xl divide-y divide-gray-900/10">
              <h2 className="text-2xl font-bold leading-10 tracking-tight text-gray-900">
                Frequently Asked Questions
              </h2>
              <dl className="mt-10 space-y-6 divide-y divide-gray-900/10">
                {faqs.map((faq) => (
                  <Disclosure as="div" key={faq.question} className="pt-6">
                    {({ open }) => (
                      <>
                        <dt>
                          <Disclosure.Button className="flex w-full items-start justify-between text-left text-gray-900">
                            <span className="text-base font-semibold leading-7">
                              {faq.question}
                            </span>
                            <span className="ml-6 flex h-7 items-center">
                              {open ? (
                                <MinusIcon
                                  className="h-6 w-6"
                                  aria-hidden="true"
                                />
                              ) : (
                                <PlusIcon
                                  className="h-6 w-6"
                                  aria-hidden="true"
                                />
                              )}
                            </span>
                          </Disclosure.Button>
                        </dt>
                        <Disclosure.Panel as="dd" className="mt-2 pr-12">
                          <p className="text-base leading-7 text-gray-600">
                            {faq.answer}
                          </p>
                        </Disclosure.Panel>
                      </>
                    )}
                  </Disclosure>
                ))}
              </dl>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8">
          <FreeToolsGrid category="Customer Support" />
        </div>
      </main>
      <Footer />
    </>
  )
}

export const getStaticProps = async () => {
  const starRatingData = await getRating('support-conversation-translator')

  return {
    props: { starRatingData },
    revalidate: 86400,
  }
} 