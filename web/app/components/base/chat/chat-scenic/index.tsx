import type {
  FC,
  ReactNode,
} from 'react'
import {
  memo,
  useCallback,
  useEffect,
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
import useBreakpoints, { MediaType } from '@/hooks/use-breakpoints'
import Title from '@/app/components/plugins/card/base/title'

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
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const chatContainerInnerRef = useRef<HTMLDivElement>(null)
  const chatFooterRef = useRef<HTMLDivElement>(null)
  const chatFooterInnerRef = useRef<HTMLDivElement>(null)
  const userScrolledRef = useRef(false)
  const media = useBreakpoints()
  const isMobile = media === MediaType.mobile

  const handleScrollToBottom = useCallback(() => {
    if (chatList.length > 1 && chatContainerRef.current && !userScrolledRef.current)
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
  }, [chatList.length])

  const handleWindowResize = useCallback(() => {
    if (chatContainerRef.current)
      setWidth(document.body.clientWidth - (chatContainerRef.current?.clientWidth + 16) - 8)

    if (chatContainerRef.current && chatFooterRef.current)
      chatFooterRef.current.style.width = `${chatContainerRef.current.clientWidth}px`

    if (chatContainerInnerRef.current && chatFooterInnerRef.current)
      chatFooterInnerRef.current.style.width = `${chatContainerInnerRef.current.clientWidth}px`
  }, [])

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
      const resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { blockSize } = entry.borderBoxSize[0]

          chatContainerRef.current!.style.paddingBottom = `${blockSize}px`
          handleScrollToBottom()
        }
      })

      resizeObserver.observe(chatFooterRef.current)

      return () => {
        resizeObserver.disconnect()
      }
    }
  }, [handleScrollToBottom])

  useEffect(() => {
    const chatContainer = chatContainerRef.current
    if (chatContainer) {
      const setUserScrolled = () => {
        if (chatContainer)
          userScrolledRef.current = chatContainer.scrollHeight - chatContainer.scrollTop >= chatContainer.clientHeight + 300
      }
      chatContainer.addEventListener('scroll', setUserScrolled)
      return () => chatContainer.removeEventListener('scroll', setUserScrolled)
    }
  }, [])

  const hasTryToAsk = config?.suggested_questions_after_answer?.enabled && !!suggestedQuestions?.length && onSend

  const getShortcutListItem = (title: string, subTitle: string) => (
    <li>
      <div className='w-40 h-16 p-3 bg-white rounded-xl'>
        <div className='w-full flex justify-between items-center'>
          <h1 className='text-base font-bold'>{title}</h1>
          <ARROW_ICON />
        </div>
        <h2 className='text-[10px] text-[#A7B3C2] mt-0.5'>{subTitle}</h2>
      </div>
    </li>)

  const getPreconfigQueryItem = (title: string) => (
    <div className='flex w-full h-10 rounded-3xl bg-white p-0.5 px-4 items-center justify-between'>
      <span className='leading-10 text-[#7B8295]' onClick={() => onSend?.(title)}>
        {title}
      </span>
      <ARROW_ICON />
    </div>)

  return (
    <ChatContextProvider
      config={config}
      chatList={chatList}
      isResponding={isResponding}
      showPromptLog={showPromptLog}
      questionIcon={questionIcon}
      answerIcon={answerIcon}
      onSend={onSend}
      onRegenerate={onRegenerate}
      onAnnotationAdded={onAnnotationAdded}
      onAnnotationEdited={onAnnotationEdited}
      onAnnotationRemoved={onAnnotationRemoved}
      onFeedback={onFeedback}
    >
      <div className='relative h-full'>
        <div
          ref={chatContainerRef}
          className={cn('relative h-full overflow-y-auto overflow-x-hidden', chatContainerClassName)}
        >
          {chatNode}
          <div
            ref={chatContainerInnerRef}
            className={cn('w-full', !noSpacing && 'px-8', chatContainerInnerClassName)}
          >
            {
              chatList.map((item, index) => {
                if (item.isAnswer) {
                  const isLast = item.id === chatList[chatList.length - 1]?.id
                  // 如果Answer中涉及自定义组件，则按需渲染自定义组件
                  if (item.content === '<spt-widget />')
                    return (
                      <div className='border border-green-50 rounded-[20.8px] p-[16px]' style={{
                        backgroundColor: 'rgba(244, 245, 250, 0.4)'
                      }}>
                        <div className='flex justify-between w-full'>
                          <div>
                            <h1 className='text-[25px] mt-1'>Hi,下午好</h1>
                            <h1 className='text-[25px]'>我是星仔</h1>
                          </div>
                          <img className='mr-7' width={81} src='https://p-zlgj-aigc-bucket-1301587776.cos.ap-beijing.myqcloud.com/agent_asset/boy_stellaire.png' />
                        </div>
                        <section className='text-[17px] text-[#7C879B] mt-6'>
                          我是你的AI旅行助手，很高兴能遇见你！我会热心解答你的每一个问题。有什么需要我帮助的吗？
                        </section>
                        <section className='mt-4'>
                          <ul className='flex w-full flex-wrap justify-between gap-3'>
                            <li>
                              {getShortcutListItem('门票购买', '景点快捷购票')}
                            </li>
                            <li>
                              {getShortcutListItem('酒店预定', '景区酒店快捷预定')}
                            </li>
                            <li>
                              {getShortcutListItem('行程规划', '智能生成景区游玩攻略')}
                            </li>
                            <li>
                              {getShortcutListItem('公共服务', '景区交通、厕所查询服务')}
                            </li>
                          </ul>
                        </section>
                        <section className='mt-9'>
                          <h1 className='text-base text-[#7C879B]'>你可以试着问我：</h1>
                          <ul className='mt-4 flex gap-2 flex-col'>
                            {
                              item.suggestedQuestions?.map(question => (<li>
                                {getPreconfigQueryItem(question)}
                              </li>))
                            }
                          </ul>
                        </section>
                      </div>
                    )
                  else return (
                    <Answer
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
                  />
                )
              })
            }
          </div>
        </div>
        <div
          className={`absolute bottom-[env(safe-area-inset-bottom)] bg-chat-input-mask px-[16px] ${(hasTryToAsk || !noChatInput || !noStopResponding) && chatFooterClassName}`}
          ref={chatFooterRef}
        >
          <div
            ref={chatFooterInnerRef}
            className={cn('relative', chatFooterInnerClassName)}
          >
            {
              !noStopResponding && isResponding && (
                <div className='flex justify-center mb-2'>
                  <Button onClick={onStopResponding}>
                    <StopCircle className='mr-[5px] w-3.5 h-3.5 text-gray-500' />
                    <span className='text-xs text-gray-500 font-normal'>{t('appDebug.operation.stopResponding')}</span>
                  </Button>
                </div>
              )
            }
            {
              hasTryToAsk && (
                <TryToAsk
                  suggestedQuestions={suggestedQuestions}
                  onSend={onSend}
                />
              )
            }
            {
              !noChatInput && (
                <ChatInputArea
                  showFeatureBar={showFeatureBar}
                  showFileUpload={showFileUpload}
                  featureBarDisabled={isResponding}
                  onFeatureBarClick={onFeatureBarClick}
                  visionConfig={config?.file_upload}
                  speechToTextConfig={config?.speech_to_text}
                  // 移动端只有聊天记录超过1条才自动聚焦
                  autofocus={!isMobile || chatList.length <= 1}
                  onSend={onSend}
                  inputs={inputs}
                  inputsForm={inputsForm}
                  theme={themeBuilder?.theme}
                  isResponding={isResponding}
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

// 需要替换chatList中自定义组件的内容
function replaceCustomeWidget(chatList: ChatItem[]): ChatItem[] {
  chatList.forEach(chat => {
    console.log(chat.content)
    if (chat.content.includes('spt-widget')) {
      chat.content = ""
    }
  })
  return chatList
}

const ARROW_ICON = () => (
  <svg width="17" height="18" viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.320312" y="0.519531" width="16.64" height="16.64" rx="8.32" fill="#DFECFC" />
    <path d="M7.41005 5.10087L10.53 8.48087C10.5519 8.50453 10.5714 8.52988 10.5885 8.55692C10.6057 8.58508 10.62 8.61438 10.6314 8.6448C10.6434 8.67578 10.6522 8.70761 10.658 8.74028C10.6642 8.77296 10.6673 8.80591 10.6673 8.83915C10.6673 8.87295 10.6642 8.9059 10.658 8.93801C10.6522 8.97069 10.6434 9.00251 10.6314 9.0335C10.62 9.06392 10.6057 9.09293 10.5885 9.12053C10.5714 9.1487 10.5519 9.17433 10.53 9.19743L7.41005 12.5774C7.36637 12.6253 7.31593 12.6619 7.25873 12.6873C7.20153 12.7132 7.14173 12.7261 7.07933 12.7261C7.04813 12.7261 7.01771 12.7228 6.98807 12.716C6.95791 12.7098 6.92853 12.7002 6.89993 12.6873C6.87185 12.6749 6.84507 12.6594 6.81959 12.6408C6.79359 12.6222 6.76993 12.6011 6.74861 12.5774C6.72677 12.5538 6.70727 12.5284 6.69011 12.5014C6.67295 12.4732 6.65865 12.4439 6.64721 12.4135C6.63525 12.3825 6.62641 12.3507 6.62069 12.318C6.61445 12.2859 6.61133 12.2529 6.61133 12.2191C6.61133 12.1515 6.62329 12.0868 6.64721 12.0248C6.67061 11.9628 6.70441 11.9082 6.74861 11.8609L9.53633 8.83915L6.74861 5.81743C6.70441 5.77011 6.67061 5.71547 6.64721 5.6535C6.62329 5.59153 6.61133 5.52675 6.61133 5.45915C6.61133 5.42535 6.61445 5.39239 6.62069 5.36028C6.62641 5.32761 6.63525 5.29578 6.64721 5.2648C6.65865 5.23438 6.67295 5.20537 6.69011 5.17776C6.70727 5.1496 6.72677 5.12396 6.74861 5.10087C6.77045 5.07721 6.79385 5.05608 6.81881 5.03749C6.84481 5.0189 6.87185 5.00341 6.89993 4.99102C6.92853 4.97806 6.95791 4.96848 6.98807 4.96229C7.01771 4.95553 7.04813 4.95215 7.07933 4.95215C7.14173 4.95215 7.20153 4.96511 7.25873 4.99102C7.31593 5.01637 7.36637 5.05298 7.41005 5.10087Z" fill="#87ABD3" />
  </svg>
)

export default memo(Chat)
