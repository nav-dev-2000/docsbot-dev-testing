import {
  ArrowPathIcon,
  ChevronLeftIcon,
  XMarkIcon,
  PhotoIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline'
import {
  faComment,
  faComments,
  faRobot,
  faLifeRing,
  faQuestion,
  faInfo,
  faBook,
  faPlus,
  faChevronDown,
  faFlag,
  faBullhorn,
} from '@fortawesome/free-solid-svg-icons'
import { faThumbsUp, faThumbsDown } from '@fortawesome/free-regular-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import classNames from '@/utils/classNames'
import { decideTextColor, getLighterColor } from '@/utils/colors'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import rehypeStringify from 'rehype-stringify'
import remarkGfm from 'remark-gfm'
import { useEffect, useState } from 'react'
import docsbotLogo from '@/images/logos/docsbot-logo.svg'
import Image from 'next/image'

const iconMap = {
  default: { icon: faComment, label: 'Comment' },
  comments: { icon: faComments, label: 'Comments' },
  robot: { icon: faRobot, label: 'Robot' },
  'life-ring': { icon: faLifeRing, label: 'Life Ring' },
  question: { icon: faQuestion, label: 'Question Mark' },
  book: { icon: faBook, label: 'Book' },
  custom: { icon: faPlus, label: 'Custom Icon' },
}

const botIconMap = {
  none: { icon: false, label: 'None' },
  comment: { icon: faComment, label: 'Comment' },
  robot: { icon: faRobot, label: 'Robot' },
  'life-ring': { icon: faLifeRing, label: 'Life Ring' },
  info: { icon: faInfo, label: 'Info' },
  book: { icon: faBook, label: 'Book' },
  custom: { icon: faPlus, label: 'Custom Icon' },
}

export default function WidgetPreview({
  bot,
  color,
  logo,
  headerAlignment,
  alignment,
  branding,
  icon,
  botIcon,
  showButtonLabel,
  labels,
  hideSources,
  supportLink,
  isAgent,
  tools,
}) {
  const [footerMarkdown, setFooterMarkdown] = useState('')

  useEffect(() => {
    if (labels.footerMessage) {
      unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(remarkRehype)
        .use(rehypeStringify)
        .process(labels.footerMessage)
        .then((file) => {
          setFooterMarkdown(String(file))
        })
        .catch((error) => {
          console.warn('Error processing footer markdown:', error)
        })
    }
  }, [labels.footerMessage])

  return (
    <div className="sticky top-20">
      <h3 className="mb-4 text-2xl font-bold">Preview</h3>
      <div className="overflow-hidden rounded-xl bg-gray-50 shadow-xl">
        <div
          className="flex items-center justify-center px-3 py-2 text-xs"
          style={{
            backgroundColor: color,
            color: decideTextColor(color || '#1292EE'),
          }}
        >
          <div className="relative w-full">
            <button
              className="absolute right-0 top-0 font-semibold focus:outline-none"
              title="Reset conversation"
            >
              <ArrowPathIcon className="h-4 w-4" />
            </button>
            <div
              className={classNames(
                headerAlignment === 'left' ? 'text-left' : 'text-center',
              )}
            >
              {logo ? (
                <div
                  className="flex items-center justify-center"
                  style={{
                    justifyContent:
                      headerAlignment === 'left' ? 'start' : 'center',
                  }}
                >
                  <img src={logo} alt={bot.name} className="max-h-7 w-auto" />
                </div>
              ) : (
                <>
                  <h1 className="text-base font-bold">{bot.name}</h1>
                  <span>{bot.description}</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="relative flex h-full flex-col overflow-y-scroll px-3 pt-4">
          <BotMessage
            text={labels.firstMessage}
            {...{ botIcon, iconMap, labels, color }}
          />

          <div className="mb-3 self-end rounded-2xl rounded-tr-none bg-white px-3 py-3 text-sm text-gray-700"
          style={{
            backgroundColor: color,
            color: decideTextColor(color),
          }}>
            Why are you so amazing?
          </div>

          <BotMessage
            text={
              "Thanks! Is there anything specific you would like to know about DocsBot or our [Embeddable Chat Widget](https://docsbot.ai/documentation/developer/embeddable-chat-widget)? I'm here to assist you!"
            }
            {...{ botIcon, iconMap, labels, color, sources: true, hideSources }}
          />

          {tools?.followup_rating?.enabled === undefined
            ? true
            : tools?.followup_rating?.enabled && (
            <BotMessage
            text={labels.feedbackMessage}
            {...{ botIcon, iconMap, labels, color, isAgent, sources: false, feedback: true }}
          />
          )}

          {tools?.human_escalation?.enabled === undefined
            ? true
            : tools?.human_escalation?.enabled  && (
              <>
              {isAgent && (
                <div className="mb-3 self-end rounded-2xl rounded-tr-none bg-white px-3 py-3 text-sm text-gray-700"
                style={{
                  backgroundColor: color,
                  color: decideTextColor(color),
                }}>
                  Can I talk to someone?
                </div>
              )}

              <BotMessage
              text={
                "Sure, can I connect you to the support team?"
              }
              {...{ botIcon, iconMap, labels, color, isAgent, supportLink, sources: false, support: true }}
            />
            </>
          )}
        </div>

        <div className="relative flex-1 px-4 py-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Send a message..."
              className="w-full rounded-2xl border border-gray-300 bg-gray-50 pr-12 pl-4 py-3 text-sm text-gray-700 placeholder-gray-500 focus:border-gray-300 focus:outline-none"
              style={{
                borderColor: color,
              }}
              disabled
            />
            <button 
              className="absolute right-2 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-full hover:bg-gray-200"
              disabled
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 512 512"
                className="h-3 w-3 fill-gray-300"
              >
                <path d="M476 3.2L12.5 270.6c-18.1 10.4-15.8 35.6 2.2 43.2L121 358.4l287.3-253.2c5.5-4.9 13.3 2.6 8.6 8.3L176 407v80.5c0 23.6 28.5 32.9 42.5 15.8L282 426l124.6 52.2c14.2 6 30.4-2.9 33-18.2l72-432C515 7.8 493.3-6.8 476 3.2z"></path>
              </svg>
            </button>
          </div>
          {labels.footerMessage && (
            <div className="mt-0.5 w-full text-xs prose first:prose-p:mt-0 last:prose-p:mb-0 text-gray-500 text-center">
              <span dangerouslySetInnerHTML={{ __html: footerMarkdown }} />
            </div>
          )}
          {branding && (
            <div className="mt-1 flex w-full items-center justify-center text-center">
              <button className="flex items-center justify-center text-xs font-semibold text-gray-500 hover:text-gray-800">
                Powered by <Image src={docsbotLogo} alt="DocsBot Logo" className="ml-0.5 h-3 w-auto" />
              </button>
            </div>
          )}
        </div>
      </div>
      <div className="mt-6 flex">
        <div
          className={classNames(
            alignment === 'right' ? 'ml-auto' : 'mr-auto',
            showButtonLabel ? 'px-5 h-12 rounded-2xl' : 'w-14 h-14 rounded-3xl',
            'inline-flex items-center justify-center text-md font-bold text-white shadow-lg hover:opacity-90',
          )}
          style={{
            backgroundColor: color,
            color: decideTextColor(color),
          }}
        >
          {iconMap[icon] ? (
            <FontAwesomeIcon icon={iconMap[icon].icon} size="xl" />
          ) : icon.includes('://') ? (
            <img src={icon} alt="icon" className="h-7 w-7 object-scale-down" />
          ) : null}
          {showButtonLabel && (
            <span className="text-md ml-3 font-normal">
              {labels.floatingButton}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

function BotMessage({ text, botIcon, labels, color, sources, hideSources, isAgent, supportLink, feedback, support }) {
  const avatarBgColor = getLighterColor(color || '#1292EE', 0.6)
  const avatarFontColor = decideTextColor(avatarBgColor)

  const bgColor = getLighterColor(color || '#1292EE')
  const fontColor = decideTextColor(bgColor)

  const [markdown, setMarkdown] = useState(text)

  useEffect(() => {
    unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype)
      .use(rehypeStringify)
      .process(text)
      .then((file) => {
        setMarkdown(String(file))
      })
      .catch((error) => {
        console.warn('Error processing markdown:', error)
      })
  }, [text])

  return (
    <>
    {!(support && !isAgent) && (
    <div className="items-top mb-3 flex justify-start">
      {botIcon !== 'none' && (
        <div
          className="mr-2 flex h-6 w-6 flex-none items-center justify-center rounded-full bg-gray-100"
          style={{
            backgroundColor: avatarBgColor,
            color: avatarFontColor,
          }}
        >
          {botIcon.includes('://') ? (
            <img
              src={botIcon}
              alt="icon"
              className="h-auto w-1/2 object-scale-down"
            />
          ) : (
            <FontAwesomeIcon icon={botIconMap[botIcon].icon} size="xs" />
          )}
        </div>
      )}
      <div
        className="prose rounded-2xl rounded-tl-none px-3 py-3 text-sm leading-snug text-gray-800 first:prose-p:my-0 bg-[#f1f3f5] mr-1"
        
      >
        <span dangerouslySetInnerHTML={{ __html: markdown }} />
        {sources && !hideSources && (
          <>
            <div className="mt-3 border-t border-gray-300 pt-3 text-sm font-semibold text-gray-700">Sources</div>
            <div className="">
              <a 
                href="https://docsbot.ai/documentation/developer/embeddable-chat-widget"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm text-gray-700 hover:text-gray-900 justify-between"
              >
                <span>Embeddable Chat Widget - DocsBot</span>
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
              </a>
            </div>
          </>
        )}
      </div>
    </div>
    )}

    {feedback && (
      <div className="mb-4 -mt-1 ml-1 flex justify-start">
        <div className="flex space-x-2">
        <button
          title={labels.helpful}
          className="rounded-md px-2 py-1 text-sm border border-gray-300 bg-white text-gray-700 hover:shadow-md transition-shadow"
        >
          {labels.feedbackYes}
        </button>
        <button
          title={labels.unhelpful}
          className="rounded-md px-2 py-1 text-sm border border-gray-300 bg-white text-gray-700 hover:shadow-md transition-shadow"
        >
          {labels.feedbackNo}
        </button>
      </div>
    </div>
    )}

    {support && (
      <div className="mb-4 -mt-1 ml-1 flex justify-start">
      {isAgent ? (
        <div className="flex space-x-2">
          <a href={supportLink} target="_blank" rel="noopener noreferrer"
            className="rounded-md px-2 py-1 text-sm border border-gray-300 bg-white text-gray-700 hover:shadow-md transition-shadow"
        >
          Yes, please
        </a>
        <button
          className="rounded-md px-2 py-1 text-sm border border-gray-300 bg-white text-gray-700 hover:shadow-md transition-shadow"
        >
          No, thanks
        </button>
      </div>
      ) : (
        <a href={supportLink} target="_blank" rel="noopener noreferrer" className="rounded-md px-2 py-1 text-sm font-medium border border-gray-300 bg-white text-gray-700 hover:shadow-md transition-shadow">
          {labels.getSupport}
        </a>
      )}
    </div>
    )}
    </>
  )
}
