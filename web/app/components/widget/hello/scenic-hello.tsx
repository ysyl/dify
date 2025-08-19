import { useEffect, useState } from 'react'
import type { Figure, HelloWidgetShortCutItems } from './scenic-hello-config'
import getScenicHelloConfig from './scenic-hello-config'
import cn from '@/utils/classnames'
import LocationPanel from '../location-panel/location-panel'

type HelloWidgetProps = {
  widgetTag: string
  onSend?: (msg: string) => void
  input: Record<string, any>,
  onChangeInput?: (variable: string, value: string) => void
  suggestedQuestions?: string[]
  // 有值则说明有数字人形象，卡片中的静态形象和切换按钮不展示
  activeFigure?: Figure
  handleScrollToBottom?: (
    args: {
      forceScroll: boolean,
      smooth: boolean
    }
  ) => void
  // 为true则屏蔽快捷按钮，只展示推荐提问
  hiddenShortcutItems?: boolean
  // 为true则屏蔽推荐提问，只展示快捷按钮
  hiddenSuggestedQuestions?: boolean
}

const ARROW_ICON = () => (
  <svg width="17" height="18" viewBox="0 0 17 18" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.320312" y="0.519531" width="16.64" height="16.64" rx="8.32" fill="#DFECFC" />
    <path d="M7.41005 5.10087L10.53 8.48087C10.5519 8.50453 10.5714 8.52988 10.5885 8.55692C10.6057 8.58508 10.62 8.61438 10.6314 8.6448C10.6434 8.67578 10.6522 8.70761 10.658 8.74028C10.6642 8.77296 10.6673 8.80591 10.6673 8.83915C10.6673 8.87295 10.6642 8.9059 10.658 8.93801C10.6522 8.97069 10.6434 9.00251 10.6314 9.0335C10.62 9.06392 10.6057 9.09293 10.5885 9.12053C10.5714 9.1487 10.5519 9.17433 10.53 9.19743L7.41005 12.5774C7.36637 12.6253 7.31593 12.6619 7.25873 12.6873C7.20153 12.7132 7.14173 12.7261 7.07933 12.7261C7.04813 12.7261 7.01771 12.7228 6.98807 12.716C6.95791 12.7098 6.92853 12.7002 6.89993 12.6873C6.87185 12.6749 6.84507 12.6594 6.81959 12.6408C6.79359 12.6222 6.76993 12.6011 6.74861 12.5774C6.72677 12.5538 6.70727 12.5284 6.69011 12.5014C6.67295 12.4732 6.65865 12.4439 6.64721 12.4135C6.63525 12.3825 6.62641 12.3507 6.62069 12.318C6.61445 12.2859 6.61133 12.2529 6.61133 12.2191C6.61133 12.1515 6.62329 12.0868 6.64721 12.0248C6.67061 11.9628 6.70441 11.9082 6.74861 11.8609L9.53633 8.83915L6.74861 5.81743C6.70441 5.77011 6.67061 5.71547 6.64721 5.6535C6.62329 5.59153 6.61133 5.52675 6.61133 5.45915C6.61133 5.42535 6.61445 5.39239 6.62069 5.36028C6.62641 5.32761 6.63525 5.29578 6.64721 5.2648C6.65865 5.23438 6.67295 5.20537 6.69011 5.17776C6.70727 5.1496 6.72677 5.12396 6.74861 5.10087C6.77045 5.07721 6.79385 5.05608 6.81881 5.03749C6.84481 5.0189 6.87185 5.00341 6.89993 4.99102C6.92853 4.97806 6.95791 4.96848 6.98807 4.96229C7.01771 4.95553 7.04813 4.95215 7.07933 4.95215C7.14173 4.95215 7.20153 4.96511 7.25873 4.99102C7.31593 5.01637 7.36637 5.05298 7.41005 5.10087Z" fill="#87ABD3" />
  </svg>
)

type FigureSwitchProps = {
  figures: Figure[],
  active: string,
  onSwitch: (figure: Figure) => void
}
export const FigureSwitch = ({ figures, active, onSwitch }: FigureSwitchProps) => {
  const activeStyle = {
    backgroundImage: 'linear-gradient(to bottom, #F7CEA2, #FBC384, #FDB76E)',
  }
  const desactiveStyle = {
    background: 'white',
    width: '32px',
    overflow: 'hidden',
  }
  return <ul className='flex gap-3'>
    {
      figures.length > 1 && figures.map(figure => (<li key={figure.name} className='flex cursor-pointer items-center rounded-3xl p-1' style={{
        ...(active === figure.name ? activeStyle : desactiveStyle),
      }}
        onClick={() => onSwitch(figure)}
      >
        <div className='flex h-[26px] w-[26px] justify-center rounded-full bg-white'>
          <img className='h-[95%]' src={figure.avatarUrl} />
        </div>
        {active === figure.name && <h1 className='ml-4 mr-4 text-white'>{figure.name}</h1>}
      </li>))
    }
  </ul>
}
const ShortcutListItem = ({
  size,
  shortcutItem,
  repererLeChoix,
  onSend,
  onChangeInput,
  btnBg,
}: {
  shortcutItem: HelloWidgetShortCutItems,
  size: 'md' | 'sm',
  repererLeChoix: boolean,
  selectedShortcut: string,
  onSend?: (msg: string) => void,
  onChangeInput?: (variable: string, value: string) => void
  btnBg?: string
}) => {
  return (
    <div className=
      {cn('cursor-pointer rounded-xl',
        size === 'sm' ? 'p-1' : 'min-h-[80px] p-[12px]',
      )}
      onClick={() => {
        if (shortcutItem.agent_url)
          window.location.href = shortcutItem.agent_url
        else if (shortcutItem.input_variable)
          onChangeInput?.(shortcutItem.input_variable, shortcutItem.input_value || shortcutItem.title)
        else
          onSend?.(shortcutItem.title)
      }}
      style={{
        ...(btnBg ? {
          backgroundImage: `url("${btnBg}")`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: 'contain',
          border: 'none',
          padding: '16px',
        } : {
          border: (repererLeChoix) ? '2px solid #c0dafa' : '2px solid white',
          background: 'white',
        }),
      }}>
      <div className='flex w-full items-center justify-between'>
        <h1 className={cn('w-full text-base font-bold', size === 'sm' ? 'text-center' : '')}>{shortcutItem.title}</h1>
        {
          // 有背景图片时不渲染箭头
          !btnBg && <ARROW_ICON />
        }
      </div>
      <h2 className='mt-0.5 text-[10px] text-[#A7B3C2]'>{shortcutItem.desc}</h2>
    </div>
  )
}

const getPreconfigQueryItem = (title: string, onSend?: (msg: string) => void) => (
  <div className='flex h-10 w-full items-center justify-between rounded-3xl bg-white p-0.5 px-4' onClick={() => onSend?.(title)}>
    <span className='leading-10 text-[#7B8295]'>
      {title}
    </span>
    <ARROW_ICON />
  </div>)

const HelloWidget = ({
  widgetTag,
  onSend,
  input,
  onChangeInput,
  activeFigure: activeFigureInput,
  suggestedQuestions,
  handleScrollToBottom,
  hiddenShortcutItems,
  hiddenSuggestedQuestions,
}: HelloWidgetProps) => {
  const {
    introduction: introduce,
    name,
    nameFontSize = '25px',
    avatar,
    'shortcut-items': shortcutItems,
    guide,
    locationPanel,
    multiFigure: multiFigue,
    shortcutItemsBg,
  } = getScenicHelloConfig(widgetTag)
  const [selectedShortcut, setSelecedShortcut] = useState('')
  const shortcutSize = shortcutItems?.find((item: any) => item.size === 'sm') ? 'sm' : 'md'
  const [activeFigure, setActiveFigure] = useState<Figure>(activeFigureInput || (multiFigue ? multiFigue[0] : { name, avatarUrl: avatar }))

  function handleSend(msg: string) {
    setSelecedShortcut(msg)
    onSend?.(msg)
    handleScrollToBottom?.({
      forceScroll: true,
      smooth: false,
    })
  }
  useEffect(() => {
    if (activeFigureInput)
      setActiveFigure(activeFigureInput)
  }, [activeFigureInput])

  function onSwitchFigure(figure: Figure) {
    setActiveFigure(figure)
  }

  return (
    <div style={{ cursor: 'default' }}>
      <div className='flex w-full justify-center'>
        {
          multiFigue && !activeFigureInput && <FigureSwitch figures={multiFigue} active={activeFigure?.name || ''} onSwitch={onSwitchFigure} />
        }
      </div>
      <div key="WidgetComponent" className='mb-[30px] rounded-[20.8px] border border-green-50 p-[14px]' style={{
        backgroundColor: 'rgb(235,235,236,0.4)',
        maxWidth: 'calc(720px - 4rem)',
      }}>
        <div className='flex'>
          <div>
            <div className='flex w-full justify-between'>
              <div>
                <h1 className='mt-1 text-[25px]'>Hi,你好</h1>
                <h1 className={`text-[${nameFontSize}]`}>我是{activeFigure.name}</h1>
              </div>
            </div>
            <section className='mt-6 text-[17px] text-[#7C879B]'>
              {introduce}
            </section>
          </div>
          {!activeFigureInput && <img alt='智能体头像' className='max-w-[121px]' src={activeFigure.avatarUrl} />}
        </div>
        {
          !hiddenShortcutItems && shortcutItems && shortcutItems.length > 0 && <section className='mt-4'>
            <ul className={cn('grid w-full flex-wrap justify-between gap-3',
              `md:grid-cols-${Math.min(shortcutItems.length, 4)}`,
              shortcutSize === 'sm' ? 'grid-cols-3' : 'grid-cols-2')}>
              {
                shortcutItems.map((item: HelloWidgetShortCutItems) => (
                  <li key={item.title} className="">
                    <ShortcutListItem
                      size={item.size || 'md'}
                      shortcutItem={item}
                      repererLeChoix={item.input_variable ? input[item.input_variable] === item.input_value : false}
                      selectedShortcut={selectedShortcut}
                      onSend={handleSend}
                      onChangeInput={onChangeInput}
                      btnBg={shortcutItemsBg}
                    />
                  </li>
                ))
              }
            </ul>
          </section>
        }
        {
          locationPanel && <div className='mt-2'>
            <LocationPanel config={locationPanel} onSend={onSend} />
          </div>
        }
        {
          !hiddenSuggestedQuestions && guide && <section className={cn(hiddenShortcutItems ? 'mt-2' : 'mt-4')}>
            <h1 className='text-base text-[#7C879B]'>{guide}</h1>
            <ul className='mt-4 flex flex-col gap-2'>
              {
                suggestedQuestions?.map(question => (<li key={question}>
                  {getPreconfigQueryItem(question, handleSend)}
                </li>))
              }
            </ul>
          </section>
        }
      </div>
    </div>
  )
}

export default HelloWidget
