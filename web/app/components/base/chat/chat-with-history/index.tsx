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
import type { Modifier } from '@dnd-kit/core'
import { DndContext, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'
import { parseAgentConfig } from './agent-config'
import { FigureSwitch } from '@/app/components/widget/hello/scenic-hello'
import type { Figure } from '@/app/components/widget/hello/scenic-hello-config'

type ChatWithHistoryProps = {
  className?: string
}
const ChatWithHistory: FC<ChatWithHistoryProps> = ({
  className,
}) => {
  const {
    appInfoError,
    appData,
    appInfoLoading,
    appChatListDataLoading,
    chatShouldReloadKey,
    isMobile,
    themeBuilder,
    sidebarCollapseState,
    handleSidebarCollapse,
  } = useChatWithHistoryContext()
  const isSidebarCollapsed = sidebarCollapseState
  const customConfig = appData?.custom_config
  const site = appData?.site
  const agentConfig = parseAgentConfig(site?.description)

  const [showSidePanel, setShowSidePanel] = useState(false)
  const [sidebarOffsetX, setSideOffsetX] = useState(0)
  const [chatState, setChatState] = useState<'static' | 'thinking' | 'talking'>('static')
  const [activeDigitalHuman, setActiveDigitalHuman] = useState(agentConfig?.digitalHumans && agentConfig.digitalHumans[0])
  console.log('activeDigitalHuman')
  console.dir(activeDigitalHuman)

  useEffect(() => {
    themeBuilder?.buildTheme(site?.chat_color_theme, site?.chat_color_theme_inverted)
    if (site)
        document.title = `${site.title}`
  }, [site, customConfig, themeBuilder])

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  )

  function onSwitchFigure(figure: Figure) {
    setActiveDigitalHuman(agentConfig?.digitalHumans?.find(dh => dh.name === figure.name))
  }

  const restrictToRight: Modifier = ({ transform }) => {
    // 当X轴偏移量不超过40，且Y轴偏移量超过20时强制归零
    let x = 0
    if (!(transform.x < 40 || Math.abs(transform.y) > 20))
      x = transform.x

    return {
      ...transform,
      x,
    }
  }

  if (appInfoLoading) {
    return (
      <Loading type='app' />
    )
  }

  if (appInfoError) {
    return (
      <AppUnavailable />
    )
  }

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
          <div className='my-2 flex w-full justify-center'>
          {
            (agentConfig?.digitalHumans && agentConfig?.digitalHumans?.length > 1)
            && <FigureSwitch figures={agentConfig.digitalHumans.map(dh => ({ name: dh.name, avatarUrl: dh.avatar }))}
              active={activeDigitalHuman?.name || ''} onSwitch={onSwitchFigure} />
          }
          </div>
          {
            isMobile && activeDigitalHuman && <div className='-mb-[250px] flex h-[80%] w-full justify-center overflow-hidden' style={{
              ...(activeDigitalHuman.backgroundImage ? {
                backgroundImage: `url('${activeDigitalHuman.backgroundImage.src}')`,
                backgroundPositionY: activeDigitalHuman.backgroundImage.positionY,
                backgroundPositionX: activeDigitalHuman.backgroundImage.positionX,
              } : {}),
            }}>
              {
                activeDigitalHuman.humanImage?.static && <img
                  className={cn('relative -top-3 h-[180%]', chatState !== 'static' && 'hidden')}
                  src={activeDigitalHuman.humanImage.static} />
              }
              {
                activeDigitalHuman.humanImage?.thinking && <img
                  className={cn('relative -top-3 h-[180%]', chatState !== 'thinking' && 'hidden')}
                  src={activeDigitalHuman.humanImage.thinking} />
              }
              {
                activeDigitalHuman.humanImage?.talking && <img
                  className={cn('relative -top-3 h-[180%]', chatState !== 'talking' && 'hidden')}
                  src={activeDigitalHuman.humanImage.talking} />
              }
              {
                activeDigitalHuman.humanVideo?.static && <video autoPlay muted loop
                  className={cn('', chatState !== 'static' && 'hidden')}
                >
                  <source src={activeDigitalHuman.humanVideo.talking} />
                </video>
              }
              {
                activeDigitalHuman.humanVideo?.thinking && <video autoPlay muted loop
                  className={cn('', chatState !== 'thinking' && 'hidden')}
                >
                  <source src={activeDigitalHuman.humanVideo.talking} />
                </video>
              }
              {
                activeDigitalHuman.humanVideo?.talking && <video autoPlay muted loop
                  className={cn('', chatState !== 'talking' && 'hidden')}
                >
                  <source src={activeDigitalHuman.humanVideo.talking} />
                </video>
              }
            </div>
          }
          {!appChatListDataLoading && (
            <DndContext onDragMove={e => setSideOffsetX(e.delta.x)} modifiers={[restrictToRight]} sensors={sensors}>
              <ChatWrapper key={chatShouldReloadKey} chatState={chatState} setChatState={setChatState} activeDigitalHuman={activeDigitalHuman} />
            </DndContext>
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
    appInfoError,
    appInfoLoading,
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
  } = useChatWithHistory(installedAppInfo)

  return (
    <ChatWithHistoryContext.Provider value={{
      appInfoError,
      appInfoLoading,
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
