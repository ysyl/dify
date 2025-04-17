import type { MouseEventHandler } from 'react'
import {
  useCallback,
  useRef,
  useState,
} from 'react'
import Textarea from 'react-textarea-autosize'
import { useTranslation } from 'react-i18next'
import Recorder from 'js-audio-recorder'
import type {
  EnableType,
  OnSend,
} from '../../types'
import type { Theme } from '../../embedded-chatbot/theme/theme-context'
import type { InputForm } from '../type'
import { useCheckInputsForms } from '../check-input-forms-hooks'
import { useTextAreaHeight } from './hooks'
import Operation from './operation'
import cn from '@/utils/classnames'
import { FileListInChatInput } from '@/app/components/base/file-uploader'
import { useFile } from '@/app/components/base/file-uploader/hooks'
import {
  FileContextProvider,
  useFileStore,
} from '@/app/components/base/file-uploader/store'
import VoiceInput from '@/app/components/base/voice-input'
import { useToastContext } from '@/app/components/base/toast'
import FeatureBar from '@/app/components/base/features/new-feature-panel/feature-bar'
import type { FileUpload } from '@/app/components/base/features/types'
import { TransferMethod } from '@/types/app'
import { useChatWithHistoryContext } from '../../chat-with-history/context'
import Button from '../../../button'
import type { TextAreaRef } from 'rc-textarea'
import SimpleSelect from '../../../select_bar'

type CustomeButtonProps = {
  input: any
  onClick: MouseEventHandler<HTMLButtonElement>
  onChange?: (option: string) => void
  isActive: boolean
  type: 'number' | 'select'
  value: Record<string, any> | null
}
const CustomeButton = ({ type, input, onClick, onChange, isActive, value }: CustomeButtonProps) => {
  if (type === 'number') {
    return <Button key={input.variable} className={cn('btn-primary rounded-xl uppercase text-text-tertiary', isActive ? 'btn-active ' : '')} size='large'
      onClick={onClick}>{input.label}</Button>
  }
  if (type === 'select' && onChange) {
    return <SimpleSelect
      className="w-26"
      defaultValue={value?.[input.variable] || input.default || ''}
      items={input.options?.map((option: any) => ({ name: option, value: option })) || []}
      onSelect={i => onChange(`${i.value}`)}
      allowSearch={false}
    />
  }
  return <div></div>
}

type ChatInputAreaProps = {
  showFeatureBar?: boolean
  showFileUpload?: boolean
  featureBarDisabled?: boolean
  onFeatureBarClick?: (state: boolean) => void
  visionConfig?: FileUpload
  speechToTextConfig?: EnableType
  onSend?: OnSend
  inputs?: Record<string, any>
  inputsForm?: InputForm[]
  autofocus?: boolean
  theme?: Theme | null
  isResponding?: boolean
  disabled?: boolean
}
const ChatInputArea = ({
  showFeatureBar,
  showFileUpload,
  featureBarDisabled,
  onFeatureBarClick,
  visionConfig,
  speechToTextConfig = { enabled: true },
  onSend,
  inputs = {},
  inputsForm = [],
  theme,
  isResponding,
  autofocus = true,
  disabled,
}: ChatInputAreaProps) => {
  const { t } = useTranslation()
  const { notify } = useToastContext()
  const {
    wrapperRef,
    textareaRef,
    textValueRef,
    holdSpaceRef,
    handleTextareaResize,
    isMultipleLine,
  } = useTextAreaHeight()
  const [query, setQuery] = useState('')
  const [showVoiceInput, setShowVoiceInput] = useState(false)
  const filesStore = useFileStore()
  const {
    handleDragFileEnter,
    handleDragFileLeave,
    handleDragFileOver,
    handleDropFile,
    handleClipboardPasteFile,
    isDragActive,
  } = useFile(visionConfig!)
  const { checkInputsForm } = useCheckInputsForms()
  const {
    inputsForms,
    newConversationInputs,
    newConversationInputsRef,
    handleNewConversationInputsChange,
  } = useChatWithHistoryContext()
  const historyRef = useRef([''])
  const [currentIndex, setCurrentIndex] = useState(-1)

  const handleChange = useCallback((variable: string, value?: string | number) => {
    const inputs: Record<string, number> = newConversationInputsRef.current || {}
    // 0代表未选中，1代表选中
    if (value === undefined)
      value = (!inputs[variable] || inputs[variable] === 0) ? 1 : 0

    handleNewConversationInputsChange({
      ...newConversationInputsRef.current,
      [variable]: value,
    })
  }, [newConversationInputsRef, handleNewConversationInputsChange])

  const isComposingRef = useRef(false)
  const handleSend = () => {
    if (isResponding) {
      notify({ type: 'info', message: t('appDebug.errorMessage.waitForResponse') })
      return
    }

    if (onSend) {
      const { files, setFiles } = filesStore.getState()
      if (files.find(item => item.transferMethod === TransferMethod.local_file && !item.uploadedId)) {
        notify({ type: 'info', message: t('appDebug.errorMessage.waitForFileUpload') })
        return
      }
      if (!query || !query.trim()) {
        notify({ type: 'info', message: t('appAnnotation.errorMessage.queryRequired') })
        return
      }
      if (checkInputsForm(inputs, inputsForm)) {
        onSend(query, files)
        setQuery('')
        setFiles([])
      }
    }
  }
  const handleCompositionStart = () => {
    // e: React.CompositionEvent<HTMLTextAreaElement>
    isComposingRef.current = true
  }
  const handleCompositionEnd = () => {
    // safari or some browsers will trigger compositionend before keydown.
    // delay 50ms for safari.
    setTimeout(() => {
      isComposingRef.current = false
    }, 50)
  }
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      // if isComposing, exit
      if (isComposingRef.current) return
      e.preventDefault()
      setQuery(query.replace(/\n$/, ''))
      historyRef.current.push(query)
      setCurrentIndex(historyRef.current.length)
      handleSend()
    }
    else if (e.key === 'ArrowUp' && !e.shiftKey && !e.nativeEvent.isComposing && e.metaKey) {
      // When the cmd + up key is pressed, output the previous element
      if (currentIndex > 0) {
        setCurrentIndex(currentIndex - 1)
        setQuery(historyRef.current[currentIndex - 1])
      }
    }
    else if (e.key === 'ArrowDown' && !e.shiftKey && !e.nativeEvent.isComposing && e.metaKey) {
      // When the cmd + down key is pressed, output the next element
      if (currentIndex < historyRef.current.length - 1) {
        setCurrentIndex(currentIndex + 1)
        setQuery(historyRef.current[currentIndex + 1])
      }
      else if (currentIndex === historyRef.current.length - 1) {
        // If it is the last element, clear the input box
        setCurrentIndex(historyRef.current.length)
        setQuery('')
      }
    }
  }

  const handleShowVoiceInput = useCallback(() => {
    (Recorder as any).getPermission().then(() => {
      setShowVoiceInput(true)
      setQuery('')
    }, () => {
      notify({ type: 'error', message: t('common.voiceInput.notAllow') })
    })
  }, [t, notify])

  const operation = (
    <Operation
      ref={holdSpaceRef}
      fileConfig={visionConfig}
      speechToTextConfig={speechToTextConfig}
      onShowVoiceInput={handleShowVoiceInput}
      onSend={handleSend}
      theme={theme}
    />
  )

  const inputFormBtnIsActivate = (variable: string) => {
    const currentFormValues: any = newConversationInputsRef.current
    return currentFormValues[variable] === 1
  }

  return (
    <>
      <FileListInChatInput fileConfig={visionConfig!} />
      {/* 自定义变量按钮区 */}
      <div className='my-1 flex gap-1'>
        {
          inputsForms.filter(input => input.variable.startsWith('btn_')).map(input => (
            <CustomeButton key={input.variable} type={input.type as 'number' | 'select'} input={input} isActive={inputFormBtnIsActivate(input.variable)}
              onClick={() => handleChange(input.variable)}
              value={newConversationInputsRef.current}
              onChange={(option) => { handleChange(input.variable, option) }}
            />
          ))
        }
      </div>
      <div
        className={cn(
          'relative z-10 mt-1 rounded-xl border border-components-chat-input-border bg-components-panel-bg-blur shadow-md',
          isDragActive && 'border border-dashed border-components-option-card-option-selected-border',
          disabled && 'pointer-events-none border-components-panel-border opacity-50 shadow-none',
        )}
      >
        <div className='relative max-h-[258px] overflow-y-auto overflow-x-hidden px-[9px]'>
          <div
            ref={wrapperRef}
            className='flex min-h-12 items-center justify-between'
          >
            <div className='relative flex w-full grow items-center'>
              <div
                ref={textValueRef}
                className='body-lg-regular pointer-events-none invisible absolute h-auto w-auto whitespace-pre p-1 leading-6'
              >
                {query}
              </div>
              <Textarea
                ref={(ref: TextAreaRef) => textareaRef.current = ref as any}
                className={cn(
                  'body-lg-regular w-full resize-none bg-transparent p-1 leading-6 text-text-tertiary outline-none',
                )}
                placeholder={t('common.chat.inputPlaceholder') || ''}
                autoFocus={autofocus}
                minRows={1}
                onResize={handleTextareaResize}
                value={query}
                onChange={(e: any) => {
                  setQuery(e.target.value)
                  setTimeout(handleTextareaResize, 0)
                }}
                onKeyDown={handleKeyDown}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
                onPaste={handleClipboardPasteFile}
                onDragEnter={handleDragFileEnter}
                onDragLeave={handleDragFileLeave}
                onDragOver={handleDragFileOver}
                onDrop={handleDropFile}
              />
            </div>
            {
              !isMultipleLine && !showVoiceInput && operation
            }
          </div>
          <VoiceInput
            show={showVoiceInput}
            onCancel={() => { setShowVoiceInput(false) }}
            onConverted={text => onSend?.(text)}
          />
        </div>
        {
          isMultipleLine && !showVoiceInput && (
            <div className='px-[9px]'>{operation}</div>
          )
        }
      </div>
      {showFeatureBar && <FeatureBar showFileUpload={showFileUpload} disabled={featureBarDisabled} onFeatureBarClick={onFeatureBarClick} />}
    </>
  )
}

const ChatInputAreaWrapper = (props: ChatInputAreaProps) => {
  return (
    <FileContextProvider>
      <ChatInputArea {...props} />
    </FileContextProvider>
  )
}

export default ChatInputAreaWrapper
