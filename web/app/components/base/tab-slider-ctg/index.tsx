import type { FC } from 'react'
import cn from '@/utils/classnames'

export type Option = {
  value: string
  text: string
  icon?: React.ReactNode
}
type TabSliderProps = {
  className?: string
  value: string
  onChange: (v: string) => void
  options: Option[]
}
const TabSliderCtg: FC<TabSliderProps> = ({
  className,
  value,
  onChange,
  options,
}) => {
  return (
    <div className={cn(className, 'relative flex')}>
      {options.map(option => (
        <div
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            'mx-[7px] flex h-[40px] cursor-pointer items-center border-[0.5px] py-[7px] font-medium leading-[40px] text-text-tertiary',
            value === option.value
              ? 'border-0 border-b-[2px] border-[#BA6353] text-[20px] font-bold'
              : 'border-transparent text-[18px]',
          )}
        >
          {option.icon}
          {option.text}
        </div>
      ))}
    </div>
  )
}

export default TabSliderCtg
