'use client'
import type { FC, ReactNode } from 'react'
import React from 'react'
import cn from '@/utils/classnames'

type Props = {
  title: string
  limitHeight?: boolean
  content: ReactNode
}

const InfoPanel: FC<Props> = ({
  title,
  limitHeight,
  content,
}) => {
  return (
    <div>
      <div className='flex flex-col gap-y-0.5 rounded-md bg-workflow-block-parma-bg px-[5px] py-[3px]'>
        <div className='system-2xs-semibold-uppercase uppercase text-text-secondary'>
          {title}
        </div>
        <div className={cn('system-xs-regular break-words text-text-tertiary', limitHeight ? 'max-h-[200px] overflow-y-auto' : '')}>
          {content}
        </div>
      </div>
    </div>
  )
}
export default React.memo(InfoPanel)
