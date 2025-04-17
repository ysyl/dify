import { useCallback, useEffect, useMemo, useState } from 'react'
import Chat from '../chat'
import type {
  ChatConfig,
  ChatItem,
  ChatItemInTree,
  OnSend,
} from '../types'
import { useChat } from '../chat/hooks'
import { getLastAnswer, isValidGeneratedAnswer } from '../utils'
import { useChatWithHistoryContext } from './context'
import { InputVarType } from '@/app/components/workflow/types'
import { TransferMethod } from '@/types/app'
import InputsForm from '@/app/components/base/chat/chat-with-history/inputs-form'
import {
  fetchSuggestedQuestions,
  getUrl,
  stopChatMessageResponding,
} from '@/service/share'
import AppIcon from '@/app/components/base/app-icon'
import AnswerIcon from '@/app/components/base/answer-icon'
import { Markdown } from '@/app/components/base/markdown'
import cn from '@/utils/classnames'
import HelloWidget from '@/app/components/widget/hello/scenic-hello'
import { isScenicHelloWidget } from '@/app/components/widget/hello/scenic-hello-config'
import SuggestedQuestions from '../chat/answer/suggested-questions'
import { useDraggable } from '@dnd-kit/core'

type Props = {
  chatState: 'static' | 'thinking' | 'talking'
  setChatState: (state: 'static' | 'thinking' | 'talking') => void
  hasDigitalHuman: boolean
}
const ChatWrapper = ({ chatState, setChatState, hasDigitalHuman }: Props) => {
  const {
    appParams,
    appPrevChatTree,
    currentConversationId,
    currentConversationItem,
    currentConversationInputs,
    inputsForms,
    newConversationInputs,
    newConversationInputsRef,
    handleNewConversationCompleted,
    isMobile,
    isInstalledApp,
    appId,
    appMeta,
    handleFeedback,
    currentChatInstanceRef,
    appData,
    themeBuilder,
    sidebarCollapseState,
    clearChatList,
    setClearChatList,
    setIsResponding,
  } = useChatWithHistoryContext()
  const appConfig = useMemo(() => {
    const config = appParams || {}

    return {
      ...config,
      file_upload: {
        ...(config as any).file_upload,
        fileUploadConfig: (config as any).system_parameters,
      },
      supportFeedback: true,
      opening_statement: currentConversationId ? currentConversationItem?.introduction : (config as any).opening_statement,
    } as ChatConfig
  }, [appParams, currentConversationItem?.introduction, currentConversationId])
  const {
    chatList,
    setTargetMessageId,
    handleSend,
    handleStop,
    isResponding: respondingState,
    suggestedQuestions,
  } = useChat(
    appConfig,
    {
      inputs: (currentConversationId ? currentConversationInputs : newConversationInputs) as any,
      inputsForm: inputsForms,
    },
    appPrevChatTree,
    taskId => stopChatMessageResponding('', taskId, isInstalledApp, appId),
    clearChatList,
    setClearChatList,
  )
  const inputsFormValue = currentConversationId ? currentConversationInputs : newConversationInputsRef?.current
  const inputDisabled = useMemo(() => {
    let hasEmptyInput = ''
    let fileIsUploading = false
    // 过滤掉特殊变量（btn_开头的以输入框上方按钮组
    const requiredVars = inputsForms.filter(input => !input.variable.startsWith('btn_'))
      .filter(({ required }) => required)
    if (requiredVars.length) {
      requiredVars.forEach(({ variable, label, type }) => {
        if (hasEmptyInput)
          return

        if (fileIsUploading)
          return

        if (!inputsFormValue?.[variable])
          hasEmptyInput = label as string

        if ((type === InputVarType.singleFile || type === InputVarType.multiFiles) && inputsFormValue?.[variable]) {
          const files = inputsFormValue[variable]
          if (Array.isArray(files))
            fileIsUploading = files.find(item => item.transferMethod === TransferMethod.local_file && !item.uploadedId)
          else
            fileIsUploading = files.transferMethod === TransferMethod.local_file && !files.uploadedId
        }
      })
    }
    if (hasEmptyInput)
      return true

    if (fileIsUploading)
      return true
    return false
  }, [inputsFormValue, inputsForms])

  useEffect(() => {
    if (currentChatInstanceRef.current)
      currentChatInstanceRef.current.handleStop = handleStop
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setIsResponding(respondingState)
    if (!respondingState) setChatState('static')
  }, [respondingState, setIsResponding])

  const doSend: OnSend = useCallback((message, files, isRegenerate = false, parentAnswer: ChatItem | null = null) => {
    const data: any = {
      query: message,
      files,
      inputs: currentConversationId ? newConversationInputsRef.current : newConversationInputs,
      conversation_id: currentConversationId,
      parent_message_id: (isRegenerate ? parentAnswer?.id : getLastAnswer(chatList)?.id) || null,
    }

    handleSend(
      getUrl('chat-messages', isInstalledApp, appId || ''),
      data,
      {
        onGetSuggestedQuestions: responseItemId => fetchSuggestedQuestions(responseItemId, isInstalledApp, appId),
        onConversationComplete: currentConversationId ? undefined : handleNewConversationCompleted,
        isPublicAPI: !isInstalledApp,
      },
    )
  }, [
    chatList,
    handleNewConversationCompleted,
    handleSend,
    currentConversationId,
    currentConversationItem,
    currentConversationInputs,
    newConversationInputs,
    isInstalledApp,
    appId,
  ])

  const doRegenerate = useCallback((chatItem: ChatItemInTree) => {
    const question = chatList.find(item => item.id === chatItem.parentMessageId)!
    const parentAnswer = chatList.find(item => item.id === question.parentMessageId)
    doSend(question.content, question.message_files, true, isValidGeneratedAnswer(parentAnswer) ? parentAnswer : null)
  }, [chatList, doSend])

  const messageList = useMemo(() => {
    if (currentConversationId)
      return chatList
    return chatList.filter(item => !item.isOpeningStatement)
  }, [chatList, currentConversationId])

  const [collapsed, setCollapsed] = useState(!!currentConversationId)

  const chatNode = useMemo(() => {
    if (!inputsForms.length)
      return null
    // 去掉特殊变量（btn_开头的变量以对话框上按钮组的形式展现，如「深度思考」)
    if (!inputsForms.filter(input => !input.variable.startsWith('btn_')).length)
      return null
    if (isMobile) {
      if (!currentConversationId)
        return <InputsForm collapsed={collapsed} setCollapsed={setCollapsed} />
      return null
    }
    else {
      return <InputsForm collapsed={collapsed} setCollapsed={setCollapsed} />
    }
  }, [inputsForms.length, isMobile, currentConversationId, collapsed])

  useEffect(() => {
    const markdownBodyList = document.querySelectorAll('.answer .markdown-body')
    if (markdownBodyList.length === 0) return

    const lastChild = markdownBodyList[markdownBodyList.length - 1].lastChild
    if (lastChild?.nodeName.toLocaleLowerCase() === 'details' && respondingState && chatState !== 'thinking')
      setChatState('thinking')
    else if (!['details', 'div'].includes(lastChild?.nodeName.toLocaleLowerCase() || '') && respondingState && chatState !== 'talking')
      setChatState('talking')
  }, [chatList])

  const welcome = useMemo(() => {
    const welcomeMessage = chatList.find(item => item.isOpeningStatement)
    if (respondingState)
      return null
    if (currentConversationId)
      return null
    if (!welcomeMessage)
      return null
    if (!collapsed && inputsForms.filter(input => !input.variable.startsWith('btn_')).length > 0)
      return null
    if (isScenicHelloWidget(welcomeMessage.content)) {
      return (
        <div className={cn('mx-2 flex flex-col items-center justify-center gap-3 py-0')}>
          <HelloWidget
            key="hello-widget"
            widgetTag={welcomeMessage.content}
            onSend={doSend}
            suggestedQuestions={welcomeMessage.suggestedQuestions}
          />
        </div>
      )
    }
    if (welcomeMessage.suggestedQuestions && welcomeMessage.suggestedQuestions?.length > 0) {
      return (
        <div className='flex min-h-[50vh] items-center justify-center px-4 py-12'>
          <div className='flex max-w-[720px] grow gap-4'>
            <AppIcon
              size='xl'
              iconType={appData?.site.icon_type}
              icon={appData?.site.icon}
              background={appData?.site.icon_background}
              imageUrl={appData?.site.icon_url}
            />
            <div className='w-0 grow'>
              <div className='body-lg-regular grow rounded-2xl bg-chat-bubble-bg px-4 py-3 text-text-primary'>
                <Markdown content={welcomeMessage.content} />
                <SuggestedQuestions item={welcomeMessage} />
              </div>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div className={cn('flex h-[50vh] flex-col items-center justify-center gap-3 py-12')}>
        <AppIcon
          size='xl'
          iconType={appData?.site.icon_type}
          icon={appData?.site.icon}
          background={appData?.site.icon_background}
          imageUrl={appData?.site.icon_url}
        />
        <div className='max-w-[768px] px-4'>
          <Markdown className='!body-2xl-regular !text-text-tertiary' content={welcomeMessage.content} />
        </div>
      </div>
    )
  }, [appData?.site.icon, appData?.site.icon_background, appData?.site.icon_type, appData?.site.icon_url, chatList, collapsed, currentConversationId, inputsForms.length, doSend])

  const answerIcon = (appData?.site && appData.site.use_icon_as_answer_icon)
    ? <AnswerIcon
      iconType={appData.site.icon_type}
      icon={appData.site.icon}
      background={appData.site.icon_background}
      imageUrl={appData.site.icon_url}
    />
    : null

  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: 'chat-body' })
  return (
    <div
      className='h-full overflow-hidden bg-chatbot-ctg-bg bg-center bg-no-repeat'
      ref={setNodeRef}
      id='chat-body'
      {...listeners} {...attributes}
    >
      <Chat
        appData={appData}
        config={appConfig}
        chatList={messageList}
        isResponding={respondingState}
        chatContainerInnerClassName={`mx-auto w-full max-w-[720px] ${isMobile && 'px-4'} ${hasDigitalHuman ? 'pt-2' : 'pt-6'} `}
        chatFooterClassName='pb-4'
        chatFooterInnerClassName={`mx-auto w-full max-w-[720px] ${isMobile ? 'px-2' : 'px-4'}`}
        onSend={doSend}
        inputs={newConversationInputsRef.current || undefined}
        inputsForm={inputsForms}
        onRegenerate={doRegenerate}
        onStopResponding={handleStop}
        chatNode={
          <>
            {chatNode}
            {welcome}
          </>
        }
        allToolIcons={appMeta?.tool_icons || {}}
        onFeedback={handleFeedback}
        suggestedQuestions={suggestedQuestions}
        answerIcon={answerIcon}
        hideProcessDetail
        themeBuilder={themeBuilder}
        switchSibling={siblingMessageId => setTargetMessageId(siblingMessageId)}
        inputDisabled={inputDisabled}
        isMobile={isMobile}
        sidebarCollapseState={sidebarCollapseState}
      />
    </div>
  )
}

export default ChatWrapper
