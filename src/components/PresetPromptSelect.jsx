import { Listbox } from '@headlessui/react'
import { ChevronUpDownIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { CheckIcon } from '@heroicons/react/20/solid'
import { PRESET_PROMPTS } from '@/constants/prompts.constants'
import clsx from 'clsx'

export default function PresetPromptSelect({ 
  value, 
  onChange, 
  disabled = false,
  className = '',
  label = 'Choose a preset prompt',
  defaultOptionLabel = 'Custom prompt',
  defaultOptionDescription = 'Start with an empty prompt',
}) {
  const presetOptions = [
    ...Object.entries(PRESET_PROMPTS).map(([key, value]) => ({
      id: key,
      ...value,
    })),
  ]

  return (
    <Listbox 
      value={value} 
      onChange={onChange}
      disabled={disabled}
    >
      <Listbox.Label className="block text-sm font-medium text-gray-700">
        {label}
      </Listbox.Label>
      <div className={clsx("relative mt-2", className)}>
        <Listbox.Button className="grid overflow-hidden w-full cursor-default grid-cols-1 rounded-md bg-white py-1.5 pl-3 pr-2 text-left text-gray-900 outline outline-1 -outline-offset-1 outline-gray-300 focus:outline focus:outline-2 focus:-outline-offset-2 focus:outline-cyan-600 sm:text-sm/6">
          <span className="col-start-1 row-start-1 flex items-center gap-3 pr-6">
            {value ? (
              <>
                {(() => {
                  const Icon = PRESET_PROMPTS[value]?.icon
                  return Icon ? <Icon className="h-6 w-6 text-gray-400 flex-shrink-0" aria-hidden="true" /> : null
                })()}
                <div className="flex flex-col">
                  <span className="block truncate font-medium">
                    {PRESET_PROMPTS[value]?.label || defaultOptionLabel}
                  </span>
                  <span className="block text-sm text-gray-500 break-normal">
                    {PRESET_PROMPTS[value]?.description || defaultOptionDescription}
                  </span>
                </div>
              </>
            ) : (
              <>
                <UserGroupIcon className="h-6 w-6 text-gray-300 flex-shrink-0" aria-hidden="true" />
                <div className="flex flex-col">
                  <span className="block truncate font-medium text-gray-500">{defaultOptionLabel}</span>
                  <span className="block text-sm text-gray-500 break-normal">{defaultOptionDescription}</span>
                </div>
              </>
            )}
          </span>
          <ChevronUpDownIcon
            aria-hidden="true"
            className="col-start-1 row-start-1 h-5 w-5 self-center justify-self-end text-gray-500"
          />
        </Listbox.Button>

        <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm">
          {presetOptions.map((preset) => (
            <Listbox.Option
              key={preset.id}
              value={preset.id}
              className={({ active }) =>
                clsx(
                  'relative cursor-default select-none py-2 pl-3 pr-9',
                  active ? 'bg-cyan-600 text-white' : 'text-gray-900'
                )
              }
            >
              {({ selected, active }) => (
                <>
                  <div className="flex items-center gap-3">
                    {(() => {
                      const Icon = preset.icon
                      return Icon ? (
                        <Icon 
                          className={clsx(
                            'h-6 w-6 flex-shrink-0 mt-0.5',
                            active ? 'text-white' : 'text-gray-400'
                          )} 
                          aria-hidden="true" 
                        />
                      ) : null
                    })()}
                    <div className="flex flex-col">
                      <span className={clsx(
                        'block truncate',
                        selected && 'font-semibold'
                      )}>
                        {preset.label}
                      </span>
                      <span className={clsx(
                        'block text-sm',
                        active ? 'text-white/90' : 'text-gray-500'
                      )}>
                        {preset.description}
                      </span>
                    </div>
                  </div>

                  {selected && (
                    <span className={clsx(
                      'absolute inset-y-0 right-0 flex items-center pr-4',
                      active ? 'text-white' : 'text-cyan-600'
                    )}>
                      <CheckIcon className="h-5 w-5" aria-hidden="true" />
                    </span>
                  )}
                </>
              )}
            </Listbox.Option>
          ))}
        </Listbox.Options>
      </div>
    </Listbox>
  )
} 