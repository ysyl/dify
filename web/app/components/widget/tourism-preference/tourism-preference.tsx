import { useEffect, useState } from 'react'
import type { TourismPreferenceConfigType } from './tourism-preference-config'
import getTourismPreferenceConfig, { getStyleConfig } from './tourism-preference-config'
import cn from '@/utils/classnames'

type TourismPreferenceProps = {
  widgetTag: string
  onSend?: (msg: string) => void
  handleScrollToBottom?: (args: {
    forceScroll: boolean,
    smooth: boolean
  }) => void
}

type SelectorValueType = {
  name: string
  value: string
}
type SelectorValueWithCntType = {
  name: string
  value: Record<string, number>
}

const TourismeIcon = () => <svg width="22" height="19" viewBox="0 0 22 19" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M17.5907 10.4765C18.9004 8.67466 19.9062 7.14524 19.9062 5.41499C19.9062 2.60474 17.688 0.328125 14.9489 0.328125C12.2097 0.328125 9.9915 2.6063 9.9915 5.41499C9.9915 6.96838 10.8537 8.45161 11.9807 10.0542L10.6246 10.5163L7.99626 9.63206C8.32104 9.05371 8.52913 8.4929 8.52913 7.88918C8.52913 6.29434 7.31667 5.00247 5.82288 5.00247C4.32756 5.00247 3.11677 6.29434 3.11677 7.88918C3.11677 8.55518 3.39062 9.20034 3.78735 9.86787L3.77537 9.86943L0.078125 18.6731L5.66416 16.4299L10.7473 18.6731L15.5191 16.4299L21.0333 18.6731L17.5906 10.4765L17.5907 10.4765ZM14.9503 2.94404C16.2795 2.94404 17.3573 4.04966 17.3573 5.41499C17.3573 6.78032 16.278 7.8876 14.9503 7.8876C13.6197 7.8876 12.5435 6.7803 12.5435 5.41499C12.5436 4.04968 13.6198 2.94404 14.9503 2.94404ZM5.82449 6.48718C6.5488 6.48718 7.13865 7.11494 7.13865 7.88921C7.13865 8.66187 6.5488 9.29114 5.82449 9.29114C5.09856 9.29114 4.5102 8.66187 4.5102 7.88921C4.51016 7.11494 5.09849 6.48718 5.82449 6.48718ZM15.4233 15.0966L10.7444 17.2537L5.7571 15.0966L2.03748 16.9L4.16899 11.0468L4.51628 10.9767C4.93982 11.5789 5.40232 12.2146 5.82451 12.9203C6.34978 12.0265 6.90217 11.2841 7.37358 10.6022L10.6277 11.7143L12.6647 11.0085C13.4102 12.0265 14.2125 13.1003 14.9489 14.284C15.6389 13.156 16.353 12.1715 17.022 11.2586L19.1713 16.9717L15.4233 15.0966Z" fill="white"/>
</svg>

const MinusIcon = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="9" cy="9" r="8" fill="#D9D9D9" stroke="white" strokeWidth="2" />
  <line x1="5" y1="9" x2="13" y2="9" stroke="black" strokeWidth="2" />
</svg>

const PlusIcon = () => <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="9" cy="9" r="8" fill="#D9D9D9" stroke="white" strokeWidth="2" />
  <line x1="5" y1="9" x2="13" y2="9" stroke="black" strokeWidth="2" />
  <line y1="-1" x2="8" y2="-1" transform="matrix(0.00894278 0.99996 -0.999959 0.00904443 8.1579 5)" stroke="black" strokeWidth="2" />
</svg>

type FieldType = keyof TourismPreferenceConfigType

function initAlert(formField: TourismPreferenceConfigType): Record<string, string> {
  const formFields = Object.keys(formField)
  const res: Record<string, string> = {}
  for (let index = 0; index < formFields.length; index++) {
    const element = formFields[index]
    res[element] = ''
  }
  return res
}

const TourismPreference = ({ widgetTag, onSend, handleScrollToBottom }: TourismPreferenceProps) => {
  const selectorConfigObj = getTourismPreferenceConfig(widgetTag)
  const styleConfig = getStyleConfig(widgetTag)

  const initValues: Record<string, SelectorValueType | SelectorValueWithCntType> = Object.keys(selectorConfigObj).reduce((obj: any, cur: any) => {
    const config = selectorConfigObj[cur as keyof TourismPreferenceConfigType]
    if (config?.type === 'Option') {
      obj[cur as FieldType] = { name: selectorConfigObj[cur as FieldType]?.name, value: '' }
    }
    else if (config?.type === 'OptionWithCnt') {
      obj[cur as FieldType] = {
        name: selectorConfigObj[cur as FieldType]?.name,
        value: config.value.reduce((obj: Record<string, number>, key) => {
          obj[key.name] = 0
          return obj
        }, {}),
      }
    }
    return obj
  }, {})
  const [formValues, setFormValues] = useState(initValues)
  const [formAlert, setFormAlert] = useState(initAlert(selectorConfigObj))
  const [show, setShow] = useState(false)

  useEffect(() => {
    setTimeout(() => setShow(true), 0)
  }, [])

  useEffect(() => {
    if (show) {
      handleScrollToBottom?.({
        forceScroll: true,
        smooth: true,
      })
    }
  }, [show])

  const handleClickOption = (key: string, value: string) => {
    setFormValues(pre => ({
      ...pre,
      [key]: {
        ...pre[key],
        value,
      },
    }))
  }

  const handleClickCntBtn = (type: 'minus' | 'plus', formKey: string, subKey: string) => {
    const value = formValues[formKey].value
    if (typeof value === 'string') return
    value[subKey] += type === 'minus' ? -1 : 1
    if (value[subKey] < 0) value[subKey] = 0
    setFormValues(JSON.parse(JSON.stringify(formValues)))
  }

  // 校验输入
  const valideFormValues: () => boolean = () => {
    const alert: Record<string, string> = {}
    Object.keys(formValues).forEach((key) => {
      const valueItem = formValues[key]
      const value = valueItem.value
      if (typeof value === 'string') {
        if (!value)
          alert[key] = `请填写${selectorConfigObj[key as keyof TourismPreferenceConfigType]?.name}`
      }
      else {
        if (Object.values(value).reduce((sum, curV) => sum + curV, 0) === 0)
          alert[key] = `请填写${selectorConfigObj[key as keyof TourismPreferenceConfigType]?.name}`
      }
    })
    setFormAlert(alert)
    return Object.values(alert).every(alert => !alert)
  }

  const handleSubmit = () => {
    // 校验
    if (!valideFormValues()) return
    // 从formValue转换到文字
    const transformPrompt = Object.values(formValues).map((perValue) => {
      if (typeof perValue.value === 'string')
        return `${perValue.name}: ${perValue.value}`
      const cntValues = perValue.value
      const cntText = Object.entries(cntValues).map((entry) => {
        return `${entry[0]}: ${entry[1]}`
      }).join(',')
      return `${perValue.name}: ${cntText}`
    }).join('\n')
    onSend?.(transformPrompt)
  }

  return (
    <div className={cn('relative mb-[30px] mt-[13px] max-w-[720px] overflow-hidden rounded-[20.8px] border border-green-50',
      'transition duration-300 ease-in',
    )} style={{
      backgroundColor: 'rgb(235,235,236,0.4)',
      transition: 'all 0.2s ease-in',
      ...(show ? {
        opacity: 100,
        top: '0px',
      } : {
        opacity: 0,
        top: '1000px',
      }),
    }}>
      <div className={cn('rounded-3xl rounded-b-[26px]', styleConfig['card-bg'])} style={{
        ...(styleConfig['card-bg-image'] ? {
          backgroundImage: styleConfig['card-bg-image'],
        } : {}),
      }}>
        <div className="flex h-[45px] items-center justify-start pl-4 text-lg font-bold leading-[45px] text-white">
          <TourismeIcon />
          <h1 className={cn('pl-2', styleConfig['header-text-color'])}>旅行偏好</h1>
        </div>
        <div className={cn('rounded-3xl p-[16px]', styleConfig['body-bg'], styleConfig['body-border'])} style={{
          ...(styleConfig['body-bg-image'] ? {
            backgroundImage: styleConfig['body-bg-image'],
          } : {}),
        }}>
          {
            Object.values(selectorConfigObj).map((config) => {
              return (<div key={config.name}>
                <h1 className="text-md">
                  {config.name}
                  {
                    formAlert[config.key] && <span className='ml-4 text-xs text-red-500'>* {formAlert[config.key]}</span>
                  }
                </h1>
                {
                  config.type === 'Option'
                  && <ul className={cn('mb-5 grid gap-1', `grid-cols-${Math.min(config.value.length, 4)}`)}>
                    {
                      config.value.map((option) => {
                        return (
                          <li key={option.value}>
                            {
                              <div className={cn('mt-[10px] rounded-[20px] px-1 text-center text-sm leading-8',
                                formValues[config.key].value === option.value ? `${styleConfig['active-bg']} text-white` : 'bg-white text-black',
                              )} style={{
                                // boxShadow: '0px 4px 10px 0px #0000001F',
                              }} onClick={() => handleClickOption(config.key, option.value)}>
                                {option.name}
                              </div>
                            }
                          </li>
                        )
                      })
                    }
                  </ul>
                }
                {
                  config.type === 'OptionWithCnt'
                  && <div className="mt-[10px] rounded-[20px] bg-white px-4 py-3" style={{
                    boxShadow: '0px 4px 10px 0px #0000001F',
                  }}>
                    <ul>
                      {
                        config.value.map((option) => {
                          const curValue = formValues[config.key].value as Record<string, number>
                          return (<li key={option.name}>
                            <div className="flex w-full justify-between leading-10">
                              <div>{option.name}</div>
                              <div className="flex w-20 items-center justify-around">
                                <div onClick={() => handleClickCntBtn('minus', config.key, option.name)}>
                                  <MinusIcon />
                                </div>
                                <div className='w-3 text-center'>
                                  {
                                    curValue[option.name]
                                  }
                                </div>
                                <div onClick={() => handleClickCntBtn('plus', config.key, option.name)}>
                                  <PlusIcon />
                                </div>
                              </div>
                            </div>
                          </li>)
                        })
                      }
                    </ul>
                  </div>
                }
              </div>)
            })
          }
          <div className="mb-1 mt-8 flex justify-center">
            <button className={cn('btn text-md h-[44px] w-full cursor-pointer rounded-md px-5 py-1 leading-[35px]',
              styleConfig['card-bg'],
              styleConfig['header-text-color'])} onClick={handleSubmit}
              style={{
                ...(styleConfig['btn-bg-image'] ? {
                  backgroundImage: styleConfig['btn-bg-image'],
                } : {}),
              }}>确认选择</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TourismPreference
