import { useEffect, useState } from 'react'
import type { ProductPreferenceConfigType } from './product-preference-config'
import getProductPreferenceConfig, { getStyleConfig } from './product-preference-config'
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
  value: string[]
}

const TourismeIcon = () => <svg width="22" height="19" viewBox="0 0 22 19" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M17.5907 10.4765C18.9004 8.67466 19.9062 7.14524 19.9062 5.41499C19.9062 2.60474 17.688 0.328125 14.9489 0.328125C12.2097 0.328125 9.9915 2.6063 9.9915 5.41499C9.9915 6.96838 10.8537 8.45161 11.9807 10.0542L10.6246 10.5163L7.99626 9.63206C8.32104 9.05371 8.52913 8.4929 8.52913 7.88918C8.52913 6.29434 7.31667 5.00247 5.82288 5.00247C4.32756 5.00247 3.11677 6.29434 3.11677 7.88918C3.11677 8.55518 3.39062 9.20034 3.78735 9.86787L3.77537 9.86943L0.078125 18.6731L5.66416 16.4299L10.7473 18.6731L15.5191 16.4299L21.0333 18.6731L17.5906 10.4765L17.5907 10.4765ZM14.9503 2.94404C16.2795 2.94404 17.3573 4.04966 17.3573 5.41499C17.3573 6.78032 16.278 7.8876 14.9503 7.8876C13.6197 7.8876 12.5435 6.7803 12.5435 5.41499C12.5436 4.04968 13.6198 2.94404 14.9503 2.94404ZM5.82449 6.48718C6.5488 6.48718 7.13865 7.11494 7.13865 7.88921C7.13865 8.66187 6.5488 9.29114 5.82449 9.29114C5.09856 9.29114 4.5102 8.66187 4.5102 7.88921C4.51016 7.11494 5.09849 6.48718 5.82449 6.48718ZM15.4233 15.0966L10.7444 17.2537L5.7571 15.0966L2.03748 16.9L4.16899 11.0468L4.51628 10.9767C4.93982 11.5789 5.40232 12.2146 5.82451 12.9203C6.34978 12.0265 6.90217 11.2841 7.37358 10.6022L10.6277 11.7143L12.6647 11.0085C13.4102 12.0265 14.2125 13.1003 14.9489 14.284C15.6389 13.156 16.353 12.1715 17.022 11.2586L19.1713 16.9717L15.4233 15.0966Z" fill="white" />
</svg>

type FieldType = keyof ProductPreferenceConfigType

function initAlert(formField: ProductPreferenceConfigType): Record<string, string> {
  const formFields = Object.keys(formField)
  const res: Record<string, string> = {}
  for (let index = 0; index < formFields.length; index++) {
    const element = formFields[index]
    res[element] = ''
  }
  return res
}

const ProductPreference = ({ widgetTag, onSend, handleScrollToBottom }: TourismPreferenceProps) => {
  const selectorConfigObj = getProductPreferenceConfig(widgetTag)
  const styleConfig = getStyleConfig(widgetTag)

  const initValues: Record<string, SelectorValueType> = Object.keys(selectorConfigObj).reduce((obj: any, cur: any) => {
    const config = selectorConfigObj[cur as keyof ProductPreferenceConfigType]
    if (config?.type === 'option')
      obj[cur as FieldType] = { name: selectorConfigObj[cur as FieldType]?.name, value: [] }

    return obj
  }, {})
  const [formValues, setFormValues] = useState(initValues)
  const [formAlert, setFormAlert] = useState(initAlert(selectorConfigObj))
  const [show, setShow] = useState(false)
  // 组件每行显示几个按钮
  const col = selectorConfigObj?.col

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
    // 预定偏好组件是多选
    setFormValues((pre) => {
      const oldValue = pre[key]
      let newValues
      // 已选当前值，需要剔除当前值
      if (oldValue.value.includes(value)) {
        newValues = {
          name: oldValue.name,
          value: oldValue.value.filter(v => v !== value),
        }
      }
      else {
        // 未选当前值，需要添加当前值
        newValues = {
          name: oldValue.name,
          value: [...oldValue.value, value],
        }
      }
      return {
        ...pre,
        [key]: newValues,
      }
    })
  }

  // 校验输入
  // 只校验全为空的情况
  const valideFormValues: () => boolean = () => {
    const alert: Record<string, string> = {}
    if (Object.values(formValues).flatMap(v => v.value).length === 0)
      alert.global = '请至少选择一项预定偏好'

    Object.keys(formValues).forEach((key) => {
      const valueItem = formValues[key]
      const value = valueItem.value
      if (typeof value === 'object') {
        if (!value)
          alert[key] = `请填写${selectorConfigObj[key as keyof ProductPreferenceConfigType]?.name}`
      }
    })
    setFormAlert(alert)
    return Object.values(alert).every(alert => !alert)
  }

  const handleSubmit = () => {
    // 校验
    if (!valideFormValues()) return
    // 从formValue转换到文字
    const promptPrefix = '预订偏好\n'
    const transformPrompt = Object.values(formValues).filter(v => v.value && v.value.length > 0).map((perValue) => {
      const cntValues = perValue.value
      const cntText = cntValues.join(',')
      return `${perValue.name}: ${cntText}`
    }).join('\n')
    onSend?.(promptPrefix + transformPrompt)
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
      <div className={cn('rounded-3xl rounded-b-[26px]')} style={{
        backgroundImage: 'linear-gradient(to left, #F7CEA3, #FBC384, #FDB770)',
      }}>
        <div className="flex h-[45px] items-center justify-start pl-4 text-lg leading-[45px] text-white">
          <TourismeIcon />
          <h1 className={cn('pl-2')}
          >预订偏好</h1>
        </div>
        <div className={cn('rounded-3xl border border-white p-[16px]', styleConfig['body-bg'])}>
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
                  config.type === 'option'
                  && <ul className={cn('mb-5 grid gap-2', `grid-cols-${col || Math.min(config.value.length, 4)}`)}>
                    {
                      config.value.map((option: { name: string, value: string }) => {
                        return (
                          <li key={option.value}>
                            {
                              <div className={cn('mt-[10px] rounded-[20px] px-1 text-center text-sm leading-8',
                                formValues[config.key].value.includes(option.value) ? `${styleConfig['card-bg']} text-white` : 'bg-white text-black',
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
              </div>)
            })
          }
          {formAlert.global && <h1 className='ml-4 text-xs text-red-500'>* {formAlert.global}</h1>}
          <div className="mb-1 mt-8 flex justify-center">
            <button className={cn('btn text-md h-[44px] w-full cursor-pointer rounded-md px-5 py-1 leading-[44px]',
              styleConfig['btn-text-color'])}
              style={{
                backgroundImage: 'linear-gradient(to bottom, #F7CEA2, #FBC384, #FDB76E)',
              }}
              onClick={handleSubmit}
            >确认选择</button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductPreference
