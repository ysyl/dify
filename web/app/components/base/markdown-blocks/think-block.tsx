import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

const hasEndThink = (children: any): boolean => {
  if (typeof children === 'string')
    return children.includes('[ENDTHINKFLAG]')

  if (Array.isArray(children))
    return children.some(child => hasEndThink(child))

  if (children?.props?.children)
    return hasEndThink(children.props.children)

  return false
}

const removeEndThink = (children: any): any => {
  if (typeof children === 'string')
    return children.replace('[ENDTHINKFLAG]', '')

  if (Array.isArray(children))
    return children.map(child => removeEndThink(child))

  if (children?.props?.children) {
    return React.cloneElement(
      children,
      {
        ...children.props,
        children: removeEndThink(children.props.children),
      },
    )
  }

  return children
}

const useThinkTimer = (children: any) => {
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    if (hasEndThink(children))
      setIsComplete(true)
  }, [children])

  return { isComplete }
}

export const ThinkBlock = ({ children, ...props }: any) => {
  const { isComplete } = useThinkTimer(children)
  const displayContent = removeEndThink(children)
  const { t } = useTranslation()
  const openStatusInLocalStorage = localStorage.getItem('thinking_detail_open_status')
  const [isExpandedFull, setIsExpandedFull] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const DEBOUNCE_DELAY = 10 // 缩短防抖延迟以提高响应速度
  let open = true
  // 思考内容根据用户自定义
  if (openStatusInLocalStorage === 'false' || !openStatusInLocalStorage)
    open = false

  const debouncedScrollToBottom = useCallback(() => {
    let timeoutId: number | undefined
    if (timeoutId) window.clearTimeout(timeoutId)
    timeoutId = window.setTimeout(() => {
      if (contentRef.current) {
        const { scrollHeight, clientHeight } = contentRef.current
        // 直接滚动到底部，移除阈值判断
        contentRef.current.scrollTop = scrollHeight - clientHeight
      }
    }, DEBOUNCE_DELAY)
  }, [DEBOUNCE_DELAY])

  // 内容变化时自动滚动到底部（带防抖）
  useLayoutEffect(() => {
    if (contentRef.current && !isComplete) {
      // 确保DOM已更新后再滚动
      debouncedScrollToBottom()
    }
  }, [displayContent, debouncedScrollToBottom, DEBOUNCE_DELAY])

  // 组件挂载时初始化滚动位置
  useLayoutEffect(() => {
    if (contentRef.current)
      contentRef.current.scrollTop = contentRef.current.scrollHeight
  }, [])

  if (!(props['data-think'] ?? false))
    return (<details {...props}>{children}</details>)

  return (
    <details {...(!isComplete && { open: true })} className="group relative">
      <summary className="flex cursor-pointer select-none list-none items-center whitespace-nowrap pl-2 font-bold text-text-secondary">
        <div className="flex shrink-0 items-center">
          <svg
            className="mr-2 h-3 w-3 transition-transform duration-500 group-open:rotate-90"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          {isComplete ? `${t('common.chat.thought')}` : `${t('common.chat.thinking')}`}
        </div>
      </summary>
      <div ref={contentRef} className={`ml-2 border-l border-components-panel-border bg-components-panel-bg-alt p-3 text-text-secondary ${!isExpandedFull ? 'max-h-[200px] overflow-auto' : ''}`}
        style={{
          maskImage: `linear-gradient(to top, transparent 0%, rgba(0,0,0,0.6) 60px, rgba(0,0,0,1) 100px, rgba(0,0,0,0.6) 180px)
          `,
        }}
      >
        {displayContent}
      </div>
      <div className='flex w-full justify-center'>
        {!isExpandedFull && (
          <button
            onClick={() => setIsExpandedFull(true)}
            className="text-primary text-sm hover:underline"
          >
            展开全部
          </button>
        )}
      </div>
    </details>
  )
}

export default ThinkBlock
