import { useState } from 'react'
import getScenicHelloConfig from './scenic-hello-config'
import cn from '@/utils/classnames'

type HelloWidgetProps = {
  widgetTag: string
  onSend?: (msg: string) => void
  suggestedQuestions?: string[]
  handleScrollToBottom?: () => void
}

const ARROW_ICON = () => (
  <svg width="17" height="18" viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.320312" y="0.519531" width="16.64" height="16.64" rx="8.32" fill="#DFECFC" />
    <path d="M7.41005 5.10087L10.53 8.48087C10.5519 8.50453 10.5714 8.52988 10.5885 8.55692C10.6057 8.58508 10.62 8.61438 10.6314 8.6448C10.6434 8.67578 10.6522 8.70761 10.658 8.74028C10.6642 8.77296 10.6673 8.80591 10.6673 8.83915C10.6673 8.87295 10.6642 8.9059 10.658 8.93801C10.6522 8.97069 10.6434 9.00251 10.6314 9.0335C10.62 9.06392 10.6057 9.09293 10.5885 9.12053C10.5714 9.1487 10.5519 9.17433 10.53 9.19743L7.41005 12.5774C7.36637 12.6253 7.31593 12.6619 7.25873 12.6873C7.20153 12.7132 7.14173 12.7261 7.07933 12.7261C7.04813 12.7261 7.01771 12.7228 6.98807 12.716C6.95791 12.7098 6.92853 12.7002 6.89993 12.6873C6.87185 12.6749 6.84507 12.6594 6.81959 12.6408C6.79359 12.6222 6.76993 12.6011 6.74861 12.5774C6.72677 12.5538 6.70727 12.5284 6.69011 12.5014C6.67295 12.4732 6.65865 12.4439 6.64721 12.4135C6.63525 12.3825 6.62641 12.3507 6.62069 12.318C6.61445 12.2859 6.61133 12.2529 6.61133 12.2191C6.61133 12.1515 6.62329 12.0868 6.64721 12.0248C6.67061 11.9628 6.70441 11.9082 6.74861 11.8609L9.53633 8.83915L6.74861 5.81743C6.70441 5.77011 6.67061 5.71547 6.64721 5.6535C6.62329 5.59153 6.61133 5.52675 6.61133 5.45915C6.61133 5.42535 6.61445 5.39239 6.62069 5.36028C6.62641 5.32761 6.63525 5.29578 6.64721 5.2648C6.65865 5.23438 6.67295 5.20537 6.69011 5.17776C6.70727 5.1496 6.72677 5.12396 6.74861 5.10087C6.77045 5.07721 6.79385 5.05608 6.81881 5.03749C6.84481 5.0189 6.87185 5.00341 6.89993 4.99102C6.92853 4.97806 6.95791 4.96848 6.98807 4.96229C7.01771 4.95553 7.04813 4.95215 7.07933 4.95215C7.14173 4.95215 7.20153 4.96511 7.25873 4.99102C7.31593 5.01637 7.36637 5.05298 7.41005 5.10087Z" fill="#87ABD3" />
  </svg>
)

const getShortcutListItem = (title: string, subTitle: string, agentUrl: string, repererLeChoix: boolean, selectedShortcut: string, onSend?: (msg: string) => void) => (
  <div className='h-16 p-3 bg-white rounded-xl cursor-pointer' onClick={() => {
    if (agentUrl)
      window.location.href = agentUrl
    else
      onSend?.(title)
  }} style={{
    border: (repererLeChoix && selectedShortcut === title) ? '2px solid #c0dafa' : '2px solid white',
  }}>
    <div className='w-full flex justify-between items-center'>
      <h1 className='text-base font-bold'>{title}</h1>
      <ARROW_ICON />
    </div>
    <h2 className='text-[10px] text-[#A7B3C2] mt-0.5'>{subTitle}</h2>
  </div>
)

const getPreconfigQueryItem = (title: string, onSend?: (msg: string) => void) => (
  <div className='flex w-full h-10 rounded-3xl bg-white p-0.5 px-4 items-center justify-between' onClick={() => onSend?.(title)}>
    <span className='leading-10 text-[#7B8295]'>
      {title}
    </span>
    <ARROW_ICON />
  </div>)

const HelloWidget = ({
  widgetTag,
  onSend,
  suggestedQuestions,
  handleScrollToBottom,
}: HelloWidgetProps) => {
  const {
    introduction: introduce,
    name,
    nameFontSize = '25px',
    avatar,
    'shortcut-items': shortcutItems,
    guide,
    'reperer-le-choix': repererLeChoix = false,
  } = getScenicHelloConfig(widgetTag)
  const [selectedShortcut, setSelecedShortcut] = useState('')

  function handleSend(msg: string) {
    setSelecedShortcut(msg)
    onSend?.(msg)
    handleScrollToBottom?.()
  }

  return (
    <div key="WidgetComponent" className='border border-green-50 rounded-[20.8px] p-[12px] mb-[30px] mt-[13px]' style={{
      backgroundColor: 'rgb(235,235,236,0.4)',
      maxWidth: 'calc(720px - 4rem)',
    }}>
      <div className='flex justify-between w-full'>
        <div>
          <h1 className='text-[25px] mt-1'>Hi,你好</h1>
          <h1 className={`text-[${nameFontSize}]`}>我是{name}</h1>
        </div>
        <img alt='智能体头像' className='mr-7' width={81} src={avatar} />
      </div>
      <section className='text-[17px] text-[#7C879B] mt-6'>
        {introduce}
      </section>
      {
        shortcutItems && shortcutItems.length > 0 && <section className='mt-4'>
          <ul className={cn(`grid grid-cols-2 md:grid-cols-${Math.min(shortcutItems.length, 4)} w-full flex-wrap justify-between gap-1`)}>
            {
              shortcutItems.map((item: any) => (
                <li key={item.title} className="">
                  {getShortcutListItem(item.title, item.desc, item.agent_url, repererLeChoix, selectedShortcut, handleSend)}
                </li>
              ))
            }
          </ul>
        </section>
      }
      {
        guide && <section className='mt-9'>
          <h1 className='text-base text-[#7C879B]'>{guide}</h1>
          <ul className='mt-4 flex gap-2 flex-col'>
            {
              suggestedQuestions?.map(question => (<li key={question}>
                {getPreconfigQueryItem(question, onSend)}
              </li>))
            }
          </ul>
        </section>
      }
    </div>
  )
}

export default HelloWidget
