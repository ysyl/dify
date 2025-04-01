import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  RiMenuLine,
} from '@remixicon/react'
import { useChatWithHistoryContext } from './context'
import Operation from './header/operation'
import Sidebar from './sidebar'
import MobileOperationDropdown from './header/mobile-operation-dropdown'
import AppIcon from '@/app/components/base/app-icon'
import cn from '@/utils/classnames'
import ActionButton from '@/app/components/base/action-button'
import { Message3Fill } from '@/app/components/base/icons/src/public/other'
import InputsFormContent from '@/app/components/base/chat/chat-with-history/inputs-form/content'
import Confirm from '@/app/components/base/confirm'
import RenameModal from '@/app/components/base/chat/chat-with-history/sidebar/rename-modal'
import type { ConversationItem } from '@/models/share'
import type { DragEndEvent, Modifier } from '@dnd-kit/core'
import { DndContext, TouchSensor, useSensor, useSensors } from '@dnd-kit/core'

type HeaderInMobileProps = {
  sidebarOffsetX?: number
  setSidebarOffsetX?: (x: number) => void
  handleSidebarCollapse: (state: boolean) => void
}
const HeaderInMobile = ({ sidebarOffsetX, setSidebarOffsetX, handleSidebarCollapse }: HeaderInMobileProps) => {
  const {
    appData,
    currentConversationId,
    currentConversationItem,
    pinnedConversationList,
    handleNewConversation,
    handlePinConversation,
    handleUnpinConversation,
    handleDeleteConversation,
    handleRenameConversation,
    conversationRenaming,
    sidebarCollapseState,
  } = useChatWithHistoryContext()
  const { t } = useTranslation()
  const isPin = pinnedConversationList.some(item => item.id === currentConversationId)
  const [showConfirm, setShowConfirm] = useState<ConversationItem | null>(null)
  const [showRename, setShowRename] = useState<ConversationItem | null>(null)
  const handleOperate = useCallback((type: string) => {
    if (type === 'pin')
      handlePinConversation(currentConversationId)

    if (type === 'unpin')
      handleUnpinConversation(currentConversationId)

    if (type === 'delete')
      setShowConfirm(currentConversationItem as any)

    if (type === 'rename')
      setShowRename(currentConversationItem as any)
  }, [currentConversationId, currentConversationItem, handlePinConversation, handleUnpinConversation])
  const handleCancelConfirm = useCallback(() => {
    setShowConfirm(null)
  }, [])
  const handleDelete = useCallback(() => {
    if (showConfirm)
      handleDeleteConversation(showConfirm.id, { onSuccess: handleCancelConfirm })
  }, [showConfirm, handleDeleteConversation, handleCancelConfirm])
  const handleCancelRename = useCallback(() => {
    setShowRename(null)
  }, [])
  const handleRename = useCallback((newName: string) => {
    if (showRename)
      handleRenameConversation(showRename.id, newName, { onSuccess: handleCancelRename })
  }, [showRename, handleRenameConversation, handleCancelRename])
  const [showChatSettings, setShowChatSettings] = useState(false)

  const onDragEnd = (e: DragEndEvent) => {
    if (e.delta.x < -10)
      handleSidebarCollapse(true)
    else
      setSidebarOffsetX?.(0)
  }
  const restrictToLeft: Modifier = ({ transform }) => {
    // 当X轴偏移量超过0（向右）时强制归零
    return {
      ...transform,
      x: (transform.x > 0) ? 0 : transform.x,
    }
  }
  if (sidebarOffsetX && sidebarOffsetX > 0)
    handleSidebarCollapse(false)

  const sensors = useSensors(
    useSensor(TouchSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
  )

  return (
    <>
      <div className='shrink-0 flex items-center px-2 py-3 gap-1 bg-mask-top2bottom-gray-50-to-transparent'>
        <ActionButton size='l' className='shrink-0' onClick={() => handleSidebarCollapse(false)}>
          <RiMenuLine className='w-[18px] h-[18px]' />
        </ActionButton>
        <div className='flex grow items-center justify-center'>
          {!currentConversationId && (
            <>
              <AppIcon
                className='mr-2'
                size='tiny'
                icon={appData?.site.icon}
                iconType={appData?.site.icon_type}
                imageUrl={appData?.site.icon_url}
                background={appData?.site.icon_background}
              />
              <div className='system-md-semibold truncate text-text-secondary'>
                {appData?.site.title}
              </div>
            </>
          )}
          {currentConversationId && (
            <Operation
              title={currentConversationItem?.name || ''}
              isPinned={!!isPin}
              togglePin={() => handleOperate(isPin ? 'unpin' : 'pin')}
              isShowDelete
              isShowRenameConversation
              onRenameConversation={() => handleOperate('rename')}
              onDelete={() => handleOperate('delete')}
            />
          )}
        </div>
        <MobileOperationDropdown
          handleResetChat={handleNewConversation}
          handleViewChatSettings={() => setShowChatSettings(true)}
        />
      </div>
      <div className={cn('fixed inset-0 z-50 flex p-1 transition-transform duration-300 ease-in-out bg-transparent', sidebarCollapseState ? '-translate-x-full' : 'translate-x-0')}
        id='sidebar_wrap'
        onTouchEnd={(e) => {
          if (e.target instanceof HTMLElement && e.target.id === 'sidebar_wrap')
            handleSidebarCollapse(true)
        }}
        // onClick={() => handleSidebarCollapse(true)}
      >
        <div className='flex h-full w-[calc(100vw_-_120px)] '>
          <DndContext onDragEnd={onDragEnd} modifiers={[restrictToLeft]} onDragCancel={onDragEnd} sensors={sensors}>
            <Sidebar sidebarOffsetX={sidebarOffsetX} />
          </DndContext>
        </div>
      </div>
      {showChatSettings && (
        <div className='fixed inset-0 z-50 flex justify-end bg-background-overlay p-1'
          onClick={() => setShowChatSettings(false)}
        >
          <div className='flex h-full w-[calc(100vw_-_40px)] flex-col rounded-xl bg-components-panel-bg shadow-lg backdrop-blur-sm' onClick={e => e.stopPropagation()}>
            <div className='flex items-center gap-3 rounded-t-2xl border-b border-divider-subtle px-4 py-3'>
              <Message3Fill className='h-6 w-6 shrink-0' />
              <div className='system-xl-semibold grow text-text-secondary'>{t('share.chat.chatSettingsTitle')}</div>
            </div>
            <div className='p-4'>
              <InputsFormContent />
            </div>
          </div>
        </div>
      )}
      {!!showConfirm && (
        <Confirm
          title={t('share.chat.deleteConversation.title')}
          content={t('share.chat.deleteConversation.content') || ''}
          isShow
          onCancel={handleCancelConfirm}
          onConfirm={handleDelete}
        />
      )}
      {showRename && (
        <RenameModal
          isShow
          onClose={handleCancelRename}
          saveLoading={conversationRenaming}
          name={showRename?.name || ''}
          onSave={handleRename}
        />
      )}
    </>
  )
}

export default HeaderInMobile
