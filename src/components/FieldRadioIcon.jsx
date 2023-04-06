import { useState } from 'react'
import { RadioGroup } from '@headlessui/react'
import {
  faComment,
  faComments,
  faRobot,
  faLifeRing,
  faQuestion,
  faInfo,
  faBook,
} from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import classNames from '@/utils/classNames'

//icon can be default, robot, life-ring, or question-circle
const iconMap = {
  default: { icon: faComment, label: 'Comment' },
  comments: { icon: faComments, label: 'Comments' },
  robot: { icon: faRobot, label: 'Robot' },
  'life-ring': { icon: faLifeRing, label: 'Life Ring' },
  question: { icon: faQuestion, label: 'Question Mark' },
  book: { icon: faBook, label: 'Book' },
}

export default function FieldRadioIcon({ label, icon, disabled, setIcon, props }) {

  return (
    <RadioGroup value={icon} onChange={setIcon} {...{props}}>
      <RadioGroup.Label className="block text-sm font-medium leading-6 text-gray-900">
        {label}
      </RadioGroup.Label>
      <div className="mt-4 flex items-center space-x-3">
        {iconMap && Object.keys(iconMap).map((key) => (
          <RadioGroup.Option
            key={key}
            value={key}
            disabled={disabled}
            className={({ active, checked }) =>
              classNames(
                'ring-cyan-700',
                checked ? 'text-cyan-700' : 'text-gray-400',
                active && checked ? 'ring ring-offset-1' : '',
                !active && checked ? 'ring-2' : '',
                'relative -m-0.5 flex cursor-pointer items-center border border-black border-opacity-10 justify-center rounded-full p-0.5 focus:outline-none h-14 w-14'
              )
            }
          >
            <RadioGroup.Label as="span" className="sr-only">
              {iconMap[key].label}
            </RadioGroup.Label>
            <FontAwesomeIcon icon={iconMap[key].icon} size="xl" />
          </RadioGroup.Option>
        ))}
      </div>
    </RadioGroup>
  )
}
