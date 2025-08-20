import { memo, useCallback, useEffect, useImperativeHandle, useMemo } from 'react'
import { useNodes } from 'reactflow'
import { BlockEnum } from '../../types'
import {
  useStore,
  useWorkflowStore,
} from '../../store'
import type { StartNodeType } from '../../nodes/start/types'
import Empty from './empty'
import UserInput from './user-input'
import ConversationVariableModal from './conversation-variable-modal'
import { useChat } from './hooks'
import type { ChatWrapperRefType } from './index'
import Chat from '@/app/components/base/chat/chat'
import type { ChatItem, ChatItemInTree, OnSend } from '@/app/components/base/chat/types'
import { useFeatures } from '@/app/components/base/features/hooks'
import {
  fetchSuggestedQuestions,
  stopChatMessageResponding,
} from '@/service/debug'
import { useStore as useAppStore } from '@/app/components/app/store'
import cn from '@/utils/classnames'
import { getLastAnswer, isValidGeneratedAnswer } from '@/app/components/base/chat/utils'
import type { FileEntity } from '@/app/components/base/file-uploader/types'
import { useEventEmitterContextContext } from '@/context/event-emitter'
import { EVENT_WORKFLOW_STOP } from '@/app/components/workflow/variable-inspect/types'
import { isScenicHelloWidget } from '@/app/components/widget/hello/scenic-hello-config'
import HelloWidget from '@/app/components/widget/hello/scenic-hello'

type ChatWrapperProps = {
  showConversationVariableModal: boolean
  onConversationModalHide: () => void
  showInputsFieldsPanel: boolean
  onHide: () => void
}

const ChatWrapper = (
  {
    ref,
    showConversationVariableModal,
    onConversationModalHide,
    showInputsFieldsPanel,
    onHide,
  }: ChatWrapperProps & {
    ref: React.RefObject<ChatWrapperRefType>;
  },
) => {
  const nodes = useNodes<StartNodeType>()
  const startNode = nodes.find(node => node.data.type === BlockEnum.Start)
  const startVariables = startNode?.data.variables
  const appDetail = useAppStore(s => s.appDetail)
  const workflowStore = useWorkflowStore()
  // 直接选择需要的状态，避免创建新对象
  const inputs = useStore(s => s.inputs)
  const setInputs = useStore(s => s.setInputs)
  const initialInputs = useMemo(() => {
    const initInputs: Record<string, any> = {}
    if (startVariables) {
      startVariables.forEach((variable) => {
        if (variable.default)
          initInputs[variable.variable] = variable.default
      })
    }
    return initInputs
  }, [startVariables])

  const features = useFeatures(s => s.features)
  const config = useMemo(() => {
    return {
      opening_statement: features.opening?.enabled ? (features.opening?.opening_statement || '') : '',
      suggested_questions: features.opening?.enabled ? (features.opening?.suggested_questions || []) : [],
      suggested_questions_after_answer: features.suggested,
      text_to_speech: features.text2speech,
      speech_to_text: features.speech2text,
      retriever_resource: features.citation,
      sensitive_word_avoidance: features.moderation,
      file_upload: features.file,
    }
  }, [features.opening, features.suggested, features.text2speech, features.speech2text, features.citation, features.moderation, features.file])
  const setShowFeaturesPanel = useStore(s => s.setShowFeaturesPanel)

  const {
    conversationId,
    chatList,
    handleStop,
    isResponding,
    suggestedQuestions,
    handleSend,
    handleRestart,
    setTargetMessageId,
  } = useChat(
    config,
    {
      inputs,
      inputsForm: (startVariables || []) as any,
    },
    [],
    taskId => stopChatMessageResponding(appDetail!.id, taskId),
  )
  // 使用 React.memo 包装组件，避免不必要的重渲染
  const Welcome = memo(({
  onSend,
  hiddenSuggestedQuestions,
  hiddenShortcutItems,
}: {
  onSend?: OnSend,
  hiddenSuggestedQuestions?: boolean,
  hiddenShortcutItems?: boolean
}) => {
  // 使用 useMemo 缓存查找结果
  const welcomeMessage = useMemo(() => {
    return chatList.find(item => item.isOpeningStatement)
  }, [chatList]) // 仅在 chatList 变化时重新计算

  // 缓存 isScenicHelloWidget 的结果
  const isWidget = useMemo(() => {
    return isScenicHelloWidget(welcomeMessage?.content || '')
  }, [welcomeMessage?.content])

  if (!welcomeMessage || !isWidget)
    return <></>

  if (isWidget) {
    return (
      <div className={cn('mx-2 flex flex-col items-center justify-center gap-3 py-0')}>
        <HelloWidget
          key="hello-widget"
          widgetTag={welcomeMessage.content}
          input={{}} // 这个空对象每次都会创建新引用，可以考虑定义为常量
          onSend={onSend}
          suggestedQuestions={welcomeMessage.suggestedQuestions}
          hiddenSuggestedQuestions={hiddenSuggestedQuestions}
          hiddenShortcutItems={hiddenShortcutItems}
        />
      </div>
    )
  }

  // 如果不是 widget，确保返回有效的 JSX
  return <></>
})
  const handleRestartChat = useCallback(() => {
    handleRestart()
    setInputs(initialInputs)
  }, [handleRestart, setInputs, initialInputs])

  const doSend: OnSend = useCallback((message, files, isRegenerate = false, parentAnswer: ChatItem | null = null) => {
    handleSend(
      {
        query: message,
        files,
        inputs: workflowStore.getState().inputs,
        conversation_id: conversationId,
        parent_message_id: (isRegenerate ? parentAnswer?.id : getLastAnswer(chatList)?.id) || undefined,
      },
      {
        onGetSuggestedQuestions: (messageId, getAbortController) => fetchSuggestedQuestions(appDetail!.id, messageId, getAbortController),
      },
    )
  }, [handleSend, workflowStore, conversationId, chatList, appDetail])

  const doRegenerate = useCallback((chatItem: ChatItemInTree, editedQuestion?: { message: string, files?: FileEntity[] }) => {
    const question = editedQuestion ? chatItem : chatList.find(item => item.id === chatItem.parentMessageId)!
    const parentAnswer = chatList.find(item => item.id === question.parentMessageId)
    doSend(editedQuestion ? editedQuestion.message : question.content,
      editedQuestion ? editedQuestion.files : question.message_files,
      true,
      isValidGeneratedAnswer(parentAnswer) ? parentAnswer : null,
    )
  }, [chatList, doSend])

  const { eventEmitter } = useEventEmitterContextContext()
  eventEmitter?.useSubscription((v: any) => {
    if (v.type === EVENT_WORKFLOW_STOP)
      handleStop()
  })

  useImperativeHandle(ref, () => {
    return {
      handleRestart: handleRestartChat,
    }
  }, [handleRestartChat])

  useEffect(() => {
    if (Object.keys(initialInputs).length > 0) {
      setInputs({
        ...initialInputs,
        ...inputs,
      })
    }
  }, [initialInputs])

  useEffect(() => {
    if (isResponding)
      onHide()
  }, [isResponding, onHide])

  return (
    <>
      <Chat
        config={{
          ...config,
          supportCitationHitInfo: true,
        } as any}
        chatList={chatList}
        isResponding={isResponding}
        chatContainerClassName='px-3'
        chatContainerInnerClassName='pt-6 w-full max-w-full mx-auto'
        chatFooterClassName='px-4 rounded-bl-2xl'
        chatFooterInnerClassName='pb-0'
        showFileUpload
        showFeatureBar
        onFeatureBarClick={setShowFeaturesPanel}
        onSend={doSend}
        inputs={inputs}
        inputsForm={(startVariables || []) as any}
        onRegenerate={doRegenerate}
        onStopResponding={handleStop}
        // 与chat-with-history(用户端)需要保持一致, 也展示Welcome
        chatNodeWithParam={(onSend, hiddenSuggestedQuestions, hiddenShortcutItems) => (
          <>
            {showInputsFieldsPanel && <UserInput />}
            <Welcome onSend={doSend} hiddenSuggestedQuestions={hiddenSuggestedQuestions} hiddenShortcutItems={hiddenShortcutItems} />
            {
              !chatList.length && (
                <Empty />
              )
            }
          </>
        )}
        noSpacing
        suggestedQuestions={suggestedQuestions}
        showPromptLog
        chatAnswerContainerInner='!pr-2'
        switchSibling={setTargetMessageId}
      />
      {showConversationVariableModal && (
        <ConversationVariableModal
          conversationID={conversationId}
          onHide={onConversationModalHide}
        />
      )}
    </>
  )
}

ChatWrapper.displayName = 'ChatWrapper'

export default memo(ChatWrapper)
