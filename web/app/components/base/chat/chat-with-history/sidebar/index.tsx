import {
  useCallback,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import {
  RiEditBoxLine,
  RiExpandRightLine,
  RiLayoutLeft2Line,
} from '@remixicon/react'
import { useChatWithHistoryContext } from '../context'
import AppIcon from '@/app/components/base/app-icon'
import ActionButton from '@/app/components/base/action-button'
import Button from '@/app/components/base/button'
import List from '@/app/components/base/chat/chat-with-history/sidebar/list'
import MenuDropdown from '@/app/components/share/text-generation/menu-dropdown'
import Confirm from '@/app/components/base/confirm'
import RenameModal from '@/app/components/base/chat/chat-with-history/sidebar/rename-modal'
import LogoSite from '@/app/components/base/logo/logo-site'
import type { ConversationItem } from '@/models/share'
import cn from '@/utils/classnames'
import { useDraggable } from '@dnd-kit/core'
import { useEffect } from 'react'

type Props = {
  isPanel?: boolean
}

const Sidebar = ({ isPanel }: Props) => {
  const { t } = useTranslation()
  const {
    appData,
    handleNewConversation,
    pinnedConversationList,
    conversationList,
    currentConversationId,
    handleChangeConversation,
    handlePinConversation,
    handleUnpinConversation,
    conversationRenaming,
    handleRenameConversation,
    handleDeleteConversation,
    sidebarCollapseState,
    handleSidebarCollapse,
    isMobile,
    isResponding,
  } = useChatWithHistoryContext()
  const isSidebarCollapsed = sidebarCollapseState

  const [showConfirm, setShowConfirm] = useState<ConversationItem | null>(null)
  const [showRename, setShowRename] = useState<ConversationItem | null>(null)

  const handleOperate = useCallback((type: string, item: ConversationItem) => {
    if (type === 'pin')
      handlePinConversation(item.id)

    if (type === 'unpin')
      handleUnpinConversation(item.id)

    if (type === 'delete')
      setShowConfirm(item)

    if (type === 'rename')
      setShowRename(item)
  }, [handlePinConversation, handleUnpinConversation])
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
  // 切换对话时关闭侧边栏
  const aroundHandleChangeConversation = (conversationId: string) => {
    handleChangeConversation(conversationId)
    isMobile && handleSidebarCollapse(true)
  }
  const aroundHandleNewConversation = () => {
    handleNewConversation()
    isMobile && handleSidebarCollapse(true)
  }
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: 'sidebar' })
  const lastTransFormX = useRef(0)
  const style = { transform: `translate3d(${transform ? transform.x : lastTransFormX.current}px, 0px, 0)` }
  useEffect(() => {
    if (!transform) {
      if (lastTransFormX.current !== undefined)
        setTimeout(() => lastTransFormX.current = 0, 100)

      return
    };
    lastTransFormX.current = transform.x
  }, [transform])

  return (
    <div className={cn(
      'grow flex flex-col w-full relative',
      isPanel && 'rounded-xl bg-components-panel-bg border-[0.5px] border-components-panel-border-subtle shadow-lg',
      isMobile && 'bg-components-panel-bg rounded-xl shadow-lg',
    )}
    style={style}
    ref={setNodeRef}
    id='sidebar'
    {...listeners} {...attributes}
    >
      {
        isMobile && <div
          className='absolute right-0 top-[50%] w-10'
        >
          <div className='relative -right-7 w-1.5 h-10 rounded-lg bg-gray-300'>
          </div>
        </div>
      }
      <div className={cn(
        'shrink-0 flex items-center gap-3 p-3 pr-2',
      )}>
        <div className='shrink-0'>
          <AppIcon
            size='large'
            iconType={appData?.site.icon_type}
            icon={appData?.site.icon}
            background={appData?.site.icon_background}
            imageUrl={appData?.site.icon_url}
          />
        </div>
        <div className={cn('grow text-text-secondary system-md-semibold truncate')}>{appData?.site.title}</div>
        {!isMobile && isSidebarCollapsed && (
          <ActionButton size='l' onClick={() => handleSidebarCollapse(false)}>
            <RiExpandRightLine className='w-[18px] h-[18px]' />
          </ActionButton>
        )}
        {!isMobile && !isSidebarCollapsed && (
          <ActionButton size='l' onClick={() => handleSidebarCollapse(true)}>
            <RiLayoutLeft2Line className='w-[18px] h-[18px]' />
          </ActionButton>
        )}
      </div>
      <div className='shrink-0 px-3 py-4'>
        <Button variant='secondary-accent' disabled={isResponding} className='w-full justify-center' onClick={aroundHandleNewConversation}>
          <RiEditBoxLine className='w-4 h-4 mr-1' />
          {t('share.chat.newChat')}
        </Button>
      </div>
      <div className='grow h-0 pt-4 px-3 space-y-2 overflow-y-auto'>
        {/* pinned list */}
        {!!pinnedConversationList.length && (
          <div className='mb-4'>
            <List
              isPin
              title={t('share.chat.pinnedTitle') || ''}
              list={pinnedConversationList}
              onChangeConversation={aroundHandleChangeConversation}
              onOperate={handleOperate}
              currentConversationId={currentConversationId}
            />
          </div>
        )}
        {!!conversationList.length && (
          <List
            title={(pinnedConversationList.length && t('share.chat.unpinnedTitle')) || ''}
            list={conversationList}
            onChangeConversation={aroundHandleChangeConversation}
            onOperate={handleOperate}
            currentConversationId={currentConversationId}
          />
        )}
      </div>
      <div className='shrink-0 p-3 flex items-center justify-between'>
        <MenuDropdown placement='top-start' data={appData?.site} />
        {/* powered by */}
        <div className='shrink-0'>
          {!appData?.custom_config?.remove_webapp_brand && (
            <div className={cn(
              'shrink-0 px-2 flex items-center gap-1.5',
            )}>
              <div className='text-text-tertiary system-2xs-medium-uppercase'>{t('share.chat.poweredBy')}</div>
              {appData?.custom_config?.replace_webapp_logo && (
                <img src={appData?.custom_config?.replace_webapp_logo} alt='logo' className='block w-auto h-5' />
              )}
              {!appData?.custom_config?.replace_webapp_logo && (
                <LogoSite className='!h-5' />
              )}
            </div>
          )}
        </div>
      </div>
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
    </div>
  )
}

export default Sidebar
