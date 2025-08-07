'use client'
import type { FC } from 'react'
import {
  useEffect,
  useState,
} from 'react'
import { useAsyncEffect } from 'ahooks'
import { useThemeContext } from '../embedded-chatbot/theme/theme-context'
import {
  ChatWithHistoryContext,
  useChatWithHistoryContext,
} from './context'
import { useChatWithHistory } from './hooks'
import Sidebar from './sidebar'
import Header from './header'
import HeaderInMobile from './header-in-mobile'
import ChatWrapper from './chat-wrapper'
import type { InstalledApp } from '@/models/explore'
import Loading from '@/app/components/base/loading'
import useBreakpoints, { MediaType } from '@/hooks/use-breakpoints'
import { checkOrSetAccessToken } from '@/app/components/share/utils'
import AppUnavailable from '@/app/components/base/app-unavailable'
import cn from '@/utils/classnames'
import type { DigitalHuman } from './agent-config'
import { parseAgentConfig } from './agent-config'
import { FigureSwitch } from '@/app/components/widget/hello/scenic-hello'
import type { Figure } from '@/app/components/widget/hello/scenic-hello-config'
import parse from 'inline-style-parser'
import useDocumentTitle from '@/hooks/use-document-title'

type ChatWithHistoryProps = {
  className?: string
}
const ChatWithHistory: FC<ChatWithHistoryProps> = ({
  className,
}) => {
  const {
    appData,
    appChatListDataLoading,
    chatShouldReloadKey,
    isMobile,
    themeBuilder,
    sidebarCollapseState,
    handleSidebarCollapse,
    isInstalledApp,
  } = useChatWithHistoryContext()
  const isSidebarCollapsed = sidebarCollapseState
  const customConfig = appData?.custom_config
  const site = appData?.site
  const agentConfig = parseAgentConfig(site?.description)
  const [showSidePanel, setShowSidePanel] = useState(false)
  const [sidebarOffsetX, setSideOffsetX] = useState(0)
  const [chatState, setChatState] = useState<'static' | 'thinking' | 'talking'>('static')
  const [activeDigitalHuman, setActiveDigitalHuman] = useState<DigitalHuman>()

  useEffect(() => {
    if (agentConfig?.digitalHumans && !activeDigitalHuman)
      setActiveDigitalHuman(agentConfig?.digitalHumans[0])
  }, [agentConfig?.digitalHumans])

  useEffect(() => {
    themeBuilder?.buildTheme(site?.chat_color_theme, site?.chat_color_theme_inverted)
    if (site)
      document.title = `${site.title}`
  }, [site, customConfig, themeBuilder])

  function onSwitchFigure(figure: Figure) {
    setActiveDigitalHuman(agentConfig?.digitalHumans?.find(dh => dh.name === figure.name))
  }

  useDocumentTitle(site?.title || 'Chat')

  return (
    <div className={cn(
      'flex h-full bg-background-default-burn',
      isMobile && 'flex-col',
      className,
    )}>
      {!isMobile && (
        <div className={cn(
          'flex w-[236px] flex-col p-1 pr-0 transition-all duration-200 ease-in-out',
          isSidebarCollapsed && 'w-0 overflow-hidden !p-0',
        )}>
          <Sidebar />
        </div>
      )}
      {isMobile && (
        <HeaderInMobile sidebarOffsetX={sidebarOffsetX} handleSidebarCollapse={(state) => {
          handleSidebarCollapse(state)
          setSideOffsetX(0)
        }} setSidebarOffsetX={setSideOffsetX} />
      )}
      <div className={cn('relative grow overflow-y-auto p-2', isMobile && 'h-[calc(100%_-_56px)] p-0')}>
        {isSidebarCollapsed && (
          <div
            className={cn(
              'absolute top-0 z-20 flex h-full w-[256px] flex-col p-2 transition-all duration-500 ease-in-out',
              showSidePanel ? 'left-0' : 'left-[-248px]',
            )}
            onMouseEnter={() => setShowSidePanel(true)}
            onMouseLeave={() => setShowSidePanel(false)}
          >
            <Sidebar isPanel />
          </div>
        )}
        <div className={cn('flex h-full flex-col overflow-hidden border-[0,5px] border-components-panel-border-subtle bg-chatbot-bg', isMobile ? 'rounded-t-2xl' : 'rounded-2xl')}>
          {!isMobile && <Header />}
          {appChatListDataLoading && (
            <Loading type='app' />
          )}
          {/* 数字人形象切换按钮 */}
          {
            (agentConfig?.digitalHumans && agentConfig?.digitalHumans?.length > 1)
            && <div className='my-2 flex w-full justify-center'>
              <FigureSwitch figures={agentConfig.digitalHumans.map(dh => ({ name: dh.name, avatarUrl: dh.avatar }))}
                active={activeDigitalHuman?.name || ''} onSwitch={onSwitchFigure} />
            </div>
          }
          {/* 数字人形象 */}
          {
            isMobile && agentConfig?.digitalHumans && activeDigitalHuman
            && <DigitalFigure activeDigitalHuman={activeDigitalHuman} chatState={chatState} />
          }
          {!appChatListDataLoading && (
            <ChatWrapper key={chatShouldReloadKey}
              chatState={chatState}
              setChatState={setChatState}
              activeDigitalHuman={activeDigitalHuman}
              shortcutBarBtnList={agentConfig?.shortcutBarBtnList}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export type ChatWithHistoryWrapProps = {
  installedAppInfo?: InstalledApp
  className?: string
}
const ChatWithHistoryWrap: FC<ChatWithHistoryWrapProps> = ({
  installedAppInfo,
  className,
}) => {
  const media = useBreakpoints()
  const isMobile = media === MediaType.mobile
  const themeBuilder = useThemeContext()

  const {
    appData,
    appParams,
    appMeta,
    appChatListDataLoading,
    currentConversationId,
    currentConversationItem,
    appPrevChatTree,
    pinnedConversationList,
    conversationList,
    newConversationInputs,
    newConversationInputsRef,
    handleNewConversationInputsChange,
    inputsForms,
    handleNewConversation,
    handleStartChat,
    handleChangeConversation,
    handlePinConversation,
    handleUnpinConversation,
    handleDeleteConversation,
    conversationRenaming,
    handleRenameConversation,
    handleNewConversationCompleted,
    chatShouldReloadKey,
    isInstalledApp,
    appId,
    handleFeedback,
    currentChatInstanceRef,
    sidebarCollapseState,
    handleSidebarCollapse,
    clearChatList,
    setClearChatList,
    isResponding,
    setIsResponding,
    currentConversationInputs,
    setCurrentConversationInputs,
    allInputsHidden,
    initUserVariables,
  } = useChatWithHistory(installedAppInfo)

  return (
    <ChatWithHistoryContext.Provider value={{
      appData,
      appParams,
      appMeta,
      appChatListDataLoading,
      currentConversationId,
      currentConversationItem,
      appPrevChatTree,
      pinnedConversationList,
      conversationList,
      newConversationInputs,
      newConversationInputsRef,
      handleNewConversationInputsChange,
      inputsForms,
      handleNewConversation,
      handleStartChat,
      handleChangeConversation,
      handlePinConversation,
      handleUnpinConversation,
      handleDeleteConversation,
      conversationRenaming,
      handleRenameConversation,
      handleNewConversationCompleted,
      chatShouldReloadKey,
      isMobile,
      isInstalledApp,
      appId,
      handleFeedback,
      currentChatInstanceRef,
      themeBuilder,
      sidebarCollapseState,
      handleSidebarCollapse,
      clearChatList,
      setClearChatList,
      isResponding,
      setIsResponding,
      currentConversationInputs,
      setCurrentConversationInputs,
      allInputsHidden,
      initUserVariables,
    }}>
      <ChatWithHistory className={className} />
    </ChatWithHistoryContext.Provider>
  )
}

const ChatWithHistoryWrapWithCheckToken: FC<ChatWithHistoryWrapProps> = ({
  installedAppInfo,
  className,
}) => {
  const [initialized, setInitialized] = useState(false)
  const [appUnavailable, setAppUnavailable] = useState<boolean>(false)
  const [isUnknownReason, setIsUnknownReason] = useState<boolean>(false)

  useAsyncEffect(async () => {
    if (!initialized) {
      if (!installedAppInfo) {
        try {
          await checkOrSetAccessToken()
        }
        catch (e: any) {
          if (e.status === 404) {
            setAppUnavailable(true)
          }
          else {
            setIsUnknownReason(true)
            setAppUnavailable(true)
          }
        }
      }
      setInitialized(true)
    }
  }, [])

  if (!initialized)
    return null

  if (appUnavailable)
    return <AppUnavailable isUnknownReason={isUnknownReason} />

  return (
    <ChatWithHistoryWrap
      installedAppInfo={installedAppInfo}
      className={className}
    />
  )
}

export default ChatWithHistoryWrapWithCheckToken

type DigitalFigureProps = {
  activeDigitalHuman: DigitalHuman
  chatState: string
}

function DigitalFigure({ activeDigitalHuman, chatState }: DigitalFigureProps) {
  // 创建一个渲染媒体元素的辅助函数
  const renderMediaElement = (media:
    {
      static?: string;
      thinking?: string;
      talking?: string
    } | undefined,
    type: 'image' | 'video', state: 'static' | 'thinking' | 'talking') => {
    if (!media) return null

    const mediaSource = media[state]
    if (!mediaSource) return null

    const isActive = chatState === state
    const className = cn('relative -top-3', !isActive && 'hidden')

    if (type === 'image')
      return <img key={`${mediaSource}image${state}`} className={className} src={mediaSource} />

    // 视频处理
    return (
      <video
        key={mediaSource + state}
        autoPlay
        muted
        loop
        playsInline
        webkit-playsInline
        className={className}
      >
        <source src={mediaSource} />
      </video>
    )
  }

  const globalStyle = parse(activeDigitalHuman.humanImage?.globalStyles || '{}')
    .filter(field => field.type === 'declaration')
    .reduce((map: Record<string, string>, cur) => {
      map[cur.property] = cur.value
      return map
    }, {})

  return (
    <div
      className={cn('-mb-[200px] flex w-full justify-center overflow-hidden',
        activeDigitalHuman.humanVideo?.static
          ? 'h-[80%]'
          : activeDigitalHuman.humanImage?.globalClasses)}
      style={{
        ...(activeDigitalHuman.backgroundImage ? {
          backgroundImage: `url('${activeDigitalHuman.backgroundImage.src}')`,
          backgroundPositionY: activeDigitalHuman.backgroundImage.positionY,
          backgroundPositionX: activeDigitalHuman.backgroundImage.positionX,
        } : {}),
        ...globalStyle,
      }}
    >
      {/* 渲染图片状态 */}
      {renderMediaElement(activeDigitalHuman.humanImage, 'image', 'static')}
      {renderMediaElement(activeDigitalHuman.humanImage, 'image', 'thinking')}
      {renderMediaElement(activeDigitalHuman.humanImage, 'image', 'talking')}

      {/* 渲染视频状态 */}
      {renderMediaElement(activeDigitalHuman.humanVideo, 'video', 'static')}
      {renderMediaElement(activeDigitalHuman.humanVideo, 'video', 'thinking')}
      {renderMediaElement(activeDigitalHuman.humanVideo, 'video', 'talking')}
    </div>
  )
}
