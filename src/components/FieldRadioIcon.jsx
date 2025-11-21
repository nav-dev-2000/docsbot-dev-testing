import { RadioGroup } from '@headlessui/react'
import {
  faComment,
  faComments,
  faRobot,
  faLifeRing,
  faQuestion,
  faInfo,
  faBook,
  faUpload,
  faPlus,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import classNames from '@/utils/classNames'

//icon can be default, robot, life-ring, or question-circle
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

export default function FieldRadioIcon({
  type,
  label,
  icon,
  disabled,
  setIcon,
  imageOptions = [],
  imageBackgroundStyle = {},
  props,
}) {
  const list = type === 'bot' ? botIconMap : iconMap

  const brandOptions = imageOptions.map((option, index) => ({
    key: `brand-${index}`,
    label: option.type
      ? `${option.type.charAt(0).toUpperCase() + option.type.slice(1)} Icon`
      : 'Brand icon',
    imageUrl: option.url,
    isBrand: true,
    value: option.url,
  }))

  const baseOptions = Object.keys(list)
    .filter((key) => key !== 'custom')
    .map((key) => ({
      key,
      label: list[key].label,
      icon: list[key].icon,
      isBrand: false,
      value: key,
    }))

  const customOption = list.custom
    ? [
        {
          key: 'custom',
          label: list.custom.label,
          icon: list.custom.icon,
          isBrand: false,
          value: 'custom',
        },
      ]
    : []

  const options = [...baseOptions, ...brandOptions, ...customOption]

  const findSelectedKey = () => {
    if (list[icon]) {
      return icon
    }

    const brandMatch = brandOptions.find((option) => option.value === icon)
    if (brandMatch) {
      return brandMatch.key
    }

    if (icon === 'custom') {
      return 'custom'
    }

    if (type === 'bot' && icon === 'none') {
      return 'none'
    }

    if (icon && typeof icon === 'string' && icon.includes('://')) {
      return 'custom'
    }

    return baseOptions[0]?.key || 'custom'
  }

  const selectedKey = findSelectedKey()

  const isBrandSelection = brandOptions.some(
    (option) => option.value === icon,
  )

  const isCustomUploaded =
    !list[icon] &&
    !isBrandSelection &&
    typeof icon === 'string' &&
    icon.includes('://')

  const handleChange = (selectedOptionKey) => {
    const selectedOption = options.find(
      (option) => option.key === selectedOptionKey,
    )

    if (selectedOption) {
      setIcon(selectedOption.value)
    }
  }

  return (
    <RadioGroup value={selectedKey} onChange={handleChange} {...{ props }}>
      <RadioGroup.Label className="block text-sm font-medium leading-6 text-gray-900">
        {label}
      </RadioGroup.Label>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        {options.map((option) => (
          <RadioGroup.Option
            key={option.key}
            value={option.key}
            disabled={disabled}
            className={({ active, checked }) =>
              classNames(
                'ring-cyan-700',
                checked ? 'text-cyan-700' : 'text-gray-400',
                active && checked ? 'ring ring-offset-2' : '',
                !active && checked ? 'ring-2 ring-offset-1' : '',
                option.key === 'custom'
                  ? 'border-dashed border-2 hover:text-gray-500'
                  : '',
                option.isBrand ? 'p-0' : 'p-0.5',
                'relative mb-3 -m-0.5 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full border border-black border-opacity-10 focus:outline-none',
              )
            }
          >
            <RadioGroup.Label as="span" className="sr-only">
              {option.label}
            </RadioGroup.Label>
            {option.isBrand ? (
              <img
                src={option.imageUrl}
                alt={option.label}
                className={classNames(
                  type === 'bot'
                    ? 'h-full w-full rounded-full object-contain p-2'
                    : 'h-9 w-9 object-contain p-1',
                )}
              />
            ) : option.key === 'none' ? (
              <span>None</span>
            ) : option.key === 'custom' && isCustomUploaded ? (
              <img src={icon} alt="icon" className="h-9 w-9 object-contain" />
            ) : (
              <FontAwesomeIcon icon={option.icon} size="xl" />
            )}
          </RadioGroup.Option>
        ))}
      </div>
    </RadioGroup>
  )
}
