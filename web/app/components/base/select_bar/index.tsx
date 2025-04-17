'use client'
import type { FC } from 'react'
import React, { useEffect, useState } from 'react'
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import { RiCheckLine } from '@remixicon/react'
import { useTranslation } from 'react-i18next'
import classNames from '@/utils/classnames'

const defaultItems = [
  { value: 1, name: 'option1' },
  { value: 2, name: 'option2' },
  { value: 3, name: 'option3' },
  { value: 4, name: 'option4' },
  { value: 5, name: 'option5' },
  { value: 6, name: 'option6' },
  { value: 7, name: 'option7' },
]

export type Item = {
  value: number | string
  name: string
} & Record<string, any>

export type ISelectProps = {
  className?: string
  wrapperClassName?: string
  renderTrigger?: (value: Item | null) => React.JSX.Element | null
  items?: Item[]
  defaultValue?: number | string
  disabled?: boolean
  onSelect: (value: Item) => void
  allowSearch?: boolean
  bgClassName?: string
  placeholder?: string
  overlayClassName?: string
  optionWrapClassName?: string
  optionClassName?: string
  hideChecked?: boolean
  notClearable?: boolean
  renderOption?: ({
    item,
    selected,
  }: {
    item: Item
    selected: boolean
  }) => React.ReactNode
}

const SimpleSelect: FC<ISelectProps> = ({
  className,
  wrapperClassName = '',
  renderTrigger,
  items = defaultItems,
  defaultValue = 1,
  disabled = false,
  onSelect,
  placeholder,
  optionWrapClassName,
  optionClassName,
  hideChecked,
  notClearable,
  renderOption,
}) => {
  const { t } = useTranslation()
  const localPlaceholder = placeholder || t('common.placeholder.select')

  const [selectedItem, setSelectedItem] = useState<Item | null>(null)

  useEffect(() => {
    let defaultSelect = null
    const existed = items.find((item: Item) => item.value === defaultValue)
    if (existed)
      defaultSelect = existed

    setSelectedItem(defaultSelect)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultValue])

  return (
    <Listbox
      value={selectedItem}
      onChange={(value: Item) => {
        if (!disabled) {
          setSelectedItem(value)
          onSelect(value)
        }
      }}
    >
      <div className={classNames('relative', wrapperClassName)}>
        {renderTrigger && <ListboxButton className='w-full'>{renderTrigger(selectedItem)}</ListboxButton>}
        {!renderTrigger && (
          <ListboxButton className={classNames(`flex btn-secondary btn-large btn-primary items-center w-full rounded-xl border bg-white pl-3 pr-6 sm:text-sm sm:leading-6 focus-visible:outline-none focus-visible:bg-state-base-hover-alt group-hover/simple-select:bg-state-base-hover-alt ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}`, className)}>
            <span className={classNames('block truncate text-left system-sm-regular text-components-input-text-filled', !selectedItem?.name && 'text-components-input-text-placeholder')}>{selectedItem?.name ?? localPlaceholder}</span>
            <span className="absolute inset-y-0 right-0 flex items-center pr-2">
              <ChevronDownIcon
                className="h-4 w-4 text-text-quaternary group-hover/simple-select:text-text-secondary"
                aria-hidden="true"
              />
            </span>
          </ListboxButton>
        )}

        {!disabled && (
          <ListboxOptions className={classNames('absolute z-10 mt-1 px-1 max-h-60 overflow-auto rounded-xl bg-components-panel-bg-blur backdrop-blur-sm py-1 text-x shadow-lg border-components-panel-border border-[0.5px] focus:outline-none sm:text-sm', optionWrapClassName,
            'transition duration-100 ease-in data-[leave]:data-[closed]:opacity-0',
          )}
          transition
          anchor='top'
          >
            {items.map((item: Item) => (
              <ListboxOption
                key={item.value}
                className={
                  classNames(
                    'relative cursor-pointer select-none py-2 pl-3 pr-9 rounded-lg hover:bg-state-base-hover text-text-secondary',
                    optionClassName,
                  )
                }
                value={item}
                disabled={disabled}
              >
                {({ /* active, */ selected }) => (
                  <>
                    {renderOption
                      ? renderOption({ item, selected })
                      : (<>
                        <span className={classNames('block', selected && 'font-normal')}>{item.name}</span>
                        {selected && !hideChecked && (
                          <span
                            className={classNames(
                              'absolute inset-y-0 right-0 flex items-center pr-4 text-text-accent',
                            )}
                          >
                            <RiCheckLine className="h-4 w-4" aria-hidden="true" />
                          </span>
                        )}
                      </>)}
                  </>
                )}
              </ListboxOption>
            ))}
          </ListboxOptions>
        )}
      </div>
    </Listbox>
  )
}

export default React.memo(SimpleSelect)
