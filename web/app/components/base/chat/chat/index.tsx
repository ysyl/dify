import type {
  FC,
  ReactNode,
} from 'react'
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { debounce } from 'lodash-es'
import { useShallow } from 'zustand/react/shallow'
import type {
  ChatConfig,
  ChatItem,
  Feedback,
  OnRegenerate,
  OnSend,
} from '../types'
import type { ThemeBuilder } from '../embedded-chatbot/theme/theme-context'
import Question from './question'
import Answer from './answer'
import ChatInputArea from './chat-input-area'
import TryToAsk from './try-to-ask'
import { ChatContextProvider } from './context'
import type { InputForm } from './type'
import cn from '@/utils/classnames'
import type { Emoji } from '@/app/components/tools/types'
import Button from '@/app/components/base/button'
import { StopCircle } from '@/app/components/base/icons/src/vender/solid/mediaAndDevices'
import AgentLogModal from '@/app/components/base/agent-log-modal'
import PromptLogModal from '@/app/components/base/prompt-log-modal'
import { useStore as useAppStore } from '@/app/components/app/store'
import type { AppData } from '@/models/share'
import { isScenicHelloWidget } from '@/app/components/widget/hello/scenic-hello-config'
import { isTourismPreference } from '@/app/components/widget/tourism-preference/tourism-preference-config'
import TourismPreference from '@/app/components/widget/tourism-preference/tourism-preference'
import { isProductPreference } from '@/app/components/widget/product-preference/product-preference-config'
import ProductPreference from '@/app/components/widget/product-preference/product-preference'
import LocationPanel, { isLocationPanelTag } from '@/app/components/widget/location-panel/location-panel'
import ProductList, { isProductList } from '@/app/components/widget/product_list/product_list'
import ServiceList, { isServiceList } from '@/app/components/widget/service_list/service_list'
import type { AgentVersion, DigitalHuman, ShortcutBarBtn } from '../chat-with-history/agent-config'
import type { Option } from '../../tab-slider-ctg'
import TabSliderCtg from '../../tab-slider-ctg'
import ShowList, { isShowList } from '@/app/components/widget/show_list/show_list'
import type { FileEntity } from '../../file-uploader/types'

type OptionEnum = '发现' | '对话'

export type ChatProps = {
  appData?: AppData
  chatList: ChatItem[]
  config?: ChatConfig
  isResponding?: boolean
  noStopResponding?: boolean
  onStopResponding?: () => void
  noChatInput?: boolean
  onSend?: OnSend
  inputs?: Record<string, any>
  inputsForm?: InputForm[]
  onRegenerate?: OnRegenerate
  chatContainerClassName?: string
  chatContainerInnerClassName?: string
  chatFooterClassName?: string
  chatFooterInnerClassName?: string
  suggestedQuestions?: string[]
  showPromptLog?: boolean
  questionIcon?: ReactNode
  answerIcon?: ReactNode
  allToolIcons?: Record<string, string | Emoji>
  onAnnotationEdited?: (question: string, answer: string, index: number) => void
  onAnnotationAdded?: (annotationId: string, authorName: string, question: string, answer: string, index: number) => void
  onAnnotationRemoved?: (index: number) => void
  chatNode?: ReactNode
  chatNodeWithParam?: (onSend: OnSend, hiddenSuggestedQuestions?: boolean, hiddenShortcutItems?: boolean) => ReactNode
  onFeedback?: (messageId: string, feedback: Feedback) => void
  chatAnswerContainerInner?: string
  hideProcessDetail?: boolean
  hideLogModal?: boolean
  themeBuilder?: ThemeBuilder
  switchSibling?: (siblingMessageId: string) => void
  showFeatureBar?: boolean
  showFileUpload?: boolean
  onFeatureBarClick?: (state: boolean) => void
  noSpacing?: boolean
  inputDisabled?: boolean
  isMobile?: boolean
  sidebarCollapseState?: boolean
  onChangeInputs?: (a: any) => void
  activeDigitalHuman?: DigitalHuman
  shortcutBarBtnList?: ShortcutBarBtn[]
  agentVersion?: AgentVersion
}

const Chat: FC<ChatProps> = ({
  appData,
  config,
  onSend,
  inputs,
  inputsForm,
  onRegenerate,
  chatList,
  isResponding,
  noStopResponding,
  onStopResponding,
  noChatInput,
  chatContainerClassName,
  chatContainerInnerClassName,
  chatFooterClassName,
  chatFooterInnerClassName,
  suggestedQuestions,
  showPromptLog,
  questionIcon,
  answerIcon,
  onAnnotationAdded,
  onAnnotationEdited,
  onAnnotationRemoved,
  chatNode,
  onFeedback,
  chatAnswerContainerInner,
  hideProcessDetail,
  hideLogModal,
  themeBuilder,
  switchSibling,
  showFeatureBar,
  showFileUpload,
  onFeatureBarClick,
  noSpacing,
  inputDisabled,
  isMobile,
  sidebarCollapseState,
  onChangeInputs,
  activeDigitalHuman,
  shortcutBarBtnList,
  chatNodeWithParam,
  agentVersion = '1.0',
}) => {
  const { t } = useTranslation()
  const { currentLogItem, setCurrentLogItem, showPromptLogModal, setShowPromptLogModal, showAgentLogModal, setShowAgentLogModal } = useAppStore(useShallow(state => ({
    currentLogItem: state.currentLogItem,
    setCurrentLogItem: state.setCurrentLogItem,
    showPromptLogModal: state.showPromptLogModal,
    setShowPromptLogModal: state.setShowPromptLogModal,
    showAgentLogModal: state.showAgentLogModal,
    setShowAgentLogModal: state.setShowAgentLogModal,
  })))
  const [width, setWidth] = useState(0)
  // 旧版本或者有对话时默认选中对话tab
  const [activeTab, setActiveTab] = useState<OptionEnum>((agentVersion === '1.0' || chatList.length) ? '对话' : '发现')
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const chatContainerDiscoveryRef = useRef<HTMLDivElement>(null)
  const chatContainerInnerRef = useRef<HTMLDivElement>(null)
  const chatFooterRef = useRef<HTMLDivElement>(null)
  const chatFooterInnerRef = useRef<HTMLDivElement>(null)
  const userScrolledRef = useRef(false)

  // iOS safari在切换滚动位置时会有问题，需要强制回流
  function forceRepaint(el: HTMLDivElement | null) {
    if (!el) return
    el.style.display = 'none'
    const offHeight = el.offsetHeight // 强制回流
    console.debug(offHeight)
    el.style.display = ''
  }
  // chatNodeWithParam需要申明一个useMemo，避免重复渲染
  const chatNodeWithParamMemo = useMemo(() => {
    return chatNodeWithParam
  }, [width, activeTab])

  const handleScrollToBottom = useCallback(({
    forceScroll = false,
    smooth = false,
  } = {}) => {
    if (chatList.length > 1 && chatContainerRef.current && (forceScroll || !userScrolledRef.current)) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: smooth ? 'smooth' : 'instant', // 添加平滑滚动效果
      })
    }
  }, [chatList.length, activeTab])

  const handleWindowResize = useCallback(() => {
    if (chatContainerRef.current)
      setWidth(document.body.clientWidth - (chatContainerRef.current?.clientWidth + 16) - 8)

    if (chatContainerRef.current && chatFooterRef.current)
      chatFooterRef.current.style.width = `${chatContainerRef.current.clientWidth}px`

    if (chatContainerInnerRef.current && chatContainerInnerRef.current.clientWidth && chatFooterInnerRef.current)
      chatFooterInnerRef.current.style.width = `${chatContainerInnerRef.current.clientWidth}px`

    if (chatContainerDiscoveryRef.current && chatContainerDiscoveryRef.current.clientWidth && chatFooterInnerRef.current)
      chatFooterInnerRef.current.style.width = `${chatContainerDiscoveryRef.current.clientWidth}px`
  }, [])

  const handleSend = (msg: string, files?: FileEntity[]) => {
    setActiveTab('对话')
    onSend?.(msg, files)
  }
  // 切换tab时滚动到顶部
  useEffect(() => {
    activeTab === '发现' && forceRepaint(chatContainerRef.current)
  }, [activeTab])

  useEffect(() => {
    handleScrollToBottom()
    handleWindowResize()
  }, [handleScrollToBottom, handleWindowResize])

  useEffect(() => {
    if (chatContainerRef.current) {
      requestAnimationFrame(() => {
        handleScrollToBottom()
        handleWindowResize()
      })
    }
  })

  useEffect(() => {
    window.addEventListener('resize', debounce(handleWindowResize))
    return () => window.removeEventListener('resize', handleWindowResize)
  }, [handleWindowResize])

  useEffect(() => {
    if (chatFooterRef.current && chatContainerRef.current) {
      // container padding bottom
      const resizeContainerObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { blockSize } = entry.borderBoxSize[0]
          chatContainerRef.current!.style.paddingBottom = `${blockSize}px`
          handleScrollToBottom()
        }
      })
      resizeContainerObserver.observe(chatFooterRef.current)

      // footer width
      const resizeFooterObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { inlineSize } = entry.borderBoxSize[0]
          chatFooterRef.current!.style.width = `${inlineSize}px`
        }
      })
      resizeFooterObserver.observe(chatContainerRef.current)

      return () => {
        resizeContainerObserver.disconnect()
        resizeFooterObserver.disconnect()
      }
    }
  }, [handleScrollToBottom])

  useEffect(() => {
    const chatContainer = chatContainerRef.current
    if (chatContainer) {
      const setUserScrolled = () => {
        // eslint-disable-next-line sonarjs/no-gratuitous-expressions
        if (chatContainer) // its in event callback, chatContainer may be null
          userScrolledRef.current = chatContainer.scrollHeight - chatContainer.scrollTop > chatContainer.clientHeight
      }
      chatContainer.addEventListener('scroll', setUserScrolled)
      return () => chatContainer.removeEventListener('scroll', setUserScrolled)
    }
  }, [])

  useEffect(() => {
    if (!sidebarCollapseState)
      setTimeout(() => handleWindowResize(), 200)
  }, [handleWindowResize, sidebarCollapseState])

  const hasTryToAsk = config?.suggested_questions_after_answer?.enabled && !!suggestedQuestions?.length && onSend

  function getTabOptions(): Option[] {
    const optionsInConversation = ['发现', '对话']
    const optionsOldVersion = ['对话']
    const options = (agentVersion === '1.0' ? optionsOldVersion : optionsInConversation).map(item => ({
      text: item,
      value: item,
    }))
    return options
  }
  return (
    <ChatContextProvider
      config={config}
      chatList={chatList}
      isResponding={isResponding}
      showPromptLog={showPromptLog}
      questionIcon={questionIcon}
      answerIcon={answerIcon}
      onSend={handleSend}
      onRegenerate={onRegenerate}
      onAnnotationAdded={onAnnotationAdded}
      onAnnotationEdited={onAnnotationEdited}
      onAnnotationRemoved={onAnnotationRemoved}
      onFeedback={onFeedback}
    >
      <div className={cn('flex justify-center pt-2', agentVersion === '1.0' && 'hidden')}>
        <div className='w-[720px] px-8'>
          <TabSliderCtg
            value={activeTab}
            onChange={newActiveTab => setActiveTab(newActiveTab as OptionEnum)}
            options={getTabOptions()}
          />
        </div>
      </div>
      <div className='relative h-full' style={{ height: agentVersion !== '1.0' ? 'calc(100% - 48px)' : '100%' }}>
        <div
          ref={chatContainerRef}
          className={cn('relative h-full overflow-y-auto overflow-x-hidden', chatContainerClassName)}
        >
          {/* 发现tab页 */}
          <div className={cn(chatContainerInnerClassName, activeTab !== '发现' && 'hidden')}
            ref={chatContainerDiscoveryRef}
          >
            {chatNodeWithParamMemo?.(handleSend, true, false) || chatNode}
          </div>
          {/* 对话tab页 */}
          <div
            ref={chatContainerInnerRef}
            className={cn('w-full ', !noSpacing && 'px-8', chatContainerInnerClassName, activeTab !== '对话' && 'hidden')}
          >
            {/* 固定展示chatNodeWithParam */}
            <div key="chat-node-with-param-in-dialog-tab">
              {chatNodeWithParamMemo?.(handleSend, false, true)}
            </div>
            {
              chatList.map((item, index) => {
                if (item.isAnswer) {
                  if (isScenicHelloWidget(item.content)) {
                    // 不再根据对话内容展示开场白，而是固定在头部
                    return <div key={index}></div>
                  }
                  else if (isTourismPreference(item.content)) {
                    return <TourismPreference
                      key={index}
                      widgetTag={item.content}
                      handleScrollToBottom={handleScrollToBottom}
                      onSend={handleSend}
                    />
                  }
                  else if (isProductPreference(item.content)) {
                    return <ProductPreference
                      key={index}
                      widgetTag={item.content}
                      handleScrollToBottom={handleScrollToBottom}
                      onSend={handleSend}
                    />
                  }
                  else if (isServiceList(item.content)) {
                    return <ServiceList key={`service-list-${index}`} widgetTag={item.content} onSend={handleSend} />
                  }
                  else if (isProductList(item.content)) {
                    return <ProductList key={`product_list_${index}`} widgetTag={item.content} />
                  }
                  else if (isShowList(item.content)) {
                    return <ShowList key={`show_list_${index}`} widgetTag={item.content} />
                  }
                  else if (isLocationPanelTag(item.content)) {
                    return <LocationPanel
                      key={`location-panel-${index}`}
                      widgetTagStr={item.content}
                      onSend={handleSend}
                    />
                  }
                  const isLast = item.id === chatList[chatList.length - 1]?.id
                  return (
                    <Answer
                      handleScrollToBottom={handleScrollToBottom}
                      appData={appData}
                      key={item.id}
                      item={item}
                      question={chatList[index - 1]?.content}
                      index={index}
                      config={config}
                      answerIcon={answerIcon}
                      responding={isLast && isResponding}
                      showPromptLog={showPromptLog}
                      chatAnswerContainerInner={chatAnswerContainerInner}
                      hideProcessDetail={hideProcessDetail}
                      noChatInput={noChatInput}
                      switchSibling={switchSibling}
                    />
                  )
                }
                return (
                  <Question
                    key={item.id}
                    item={item}
                    questionIcon={questionIcon}
                    theme={themeBuilder?.theme}
                    enableEdit={config?.questionEditEnable}
                    switchSibling={switchSibling}
                  />
                )
              })
            }
          </div>
        </div>
        <div
          className={`absolute bottom-0 z-10 flex justify-center bg-chat-input-mask ${(hasTryToAsk || !noChatInput || !noStopResponding) && chatFooterClassName}`}
          ref={chatFooterRef}
        >
          <div
            ref={chatFooterInnerRef}
            className={cn('relative', chatFooterInnerClassName)}
          >
            {
              !noStopResponding && isResponding && (
                <div className='mb-2 flex justify-center'>
                  <Button className='border-components-panel-border bg-components-panel-bg text-components-button-secondary-text' onClick={onStopResponding}>
                    <StopCircle className='mr-[5px] h-3.5 w-3.5' />
                    <span className='text-xs font-normal'>{t('appDebug.operation.stopResponding')}</span>
                  </Button>
                </div>
              )
            }
            {
              hasTryToAsk && (
                <TryToAsk
                  suggestedQuestions={suggestedQuestions}
                  onSend={handleSend}
                  isMobile={isMobile}
                />
              )
            }
            {
              !noChatInput && (
                <ChatInputArea
                  botName={appData?.site.title || 'Bot'}
                  disabled={inputDisabled}
                  showFeatureBar={showFeatureBar}
                  showFileUpload={showFileUpload}
                  featureBarDisabled={isResponding}
                  onFeatureBarClick={onFeatureBarClick}
                  visionConfig={config?.file_upload}
                  speechToTextConfig={config?.speech_to_text}
                  // 移动端只有聊天记录超过1条才自动聚焦
                  autofocus={!isMobile}
                  onSend={handleSend}
                  inputs={inputs}
                  inputsForm={inputsForm}
                  theme={themeBuilder?.theme}
                  isResponding={isResponding}
                  onChangeInputs={onChangeInputs || ((a: any) => { console.log(a) })}
                  shortcutBarBtnList={shortcutBarBtnList}
                />
              )
            }
          </div>
        </div>
        {showPromptLogModal && !hideLogModal && (
          <PromptLogModal
            width={width}
            currentLogItem={currentLogItem}
            onCancel={() => {
              setCurrentLogItem()
              setShowPromptLogModal(false)
            }}
          />
        )}
        {showAgentLogModal && !hideLogModal && (
          <AgentLogModal
            width={width}
            currentLogItem={currentLogItem}
            onCancel={() => {
              setCurrentLogItem()
              setShowAgentLogModal(false)
            }}
          />
        )}
      </div>
    </ChatContextProvider>
  )
}

export default memo(Chat)
