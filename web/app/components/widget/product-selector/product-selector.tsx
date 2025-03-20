import { useState } from "react"
import getProductSelector, { ProductSelectorConfigType } from "./product-config"
import cn from '@/utils/classnames'
import { OptionType } from "dayjs"
import { values } from "lodash-es"

type ProductSelectorProps = {
    widgetTag: string
    onSend?: (msg: string) => void
}

type SelectorValueType = {
    name: string
    value: string
}
type SelectorValueWithCntType = {
    name: string
    value: Record<string, number>
}

type FieldType = keyof ProductSelectorConfigType

const ProductSelector = ({ widgetTag, onSend }: ProductSelectorProps) => {
    const selectorConfigObj = getProductSelector(widgetTag)
    const initValues: Record<string, SelectorValueType | SelectorValueWithCntType> = Object.keys(selectorConfigObj).reduce((obj: any, cur: any) => {
        const config = selectorConfigObj[cur as keyof ProductSelectorConfigType]
        if (config?.type === 'Option') {
            obj[cur as FieldType] = { name: selectorConfigObj[cur as FieldType]?.name, value: config.value[0].value }
        } else if (config?.type === 'OptionWithCnt') {
            obj[cur as FieldType] = {
                name: selectorConfigObj[cur as FieldType]?.name,
                value: config.value.reduce((obj: Record<string, number>, key) => {
                    obj[key.name] = 0
                    return obj
                }, {})
            }
        }
        return obj
    }, {})
    const [formValues, setFormValues] = useState(initValues)

    const handleClickOption = (key: string, value: string) => {
        console.log(key, value)
        setFormValues(pre => ({
            ...pre,
            [key]: {
                ...pre[key],
                value: value
            }
        }))
    }

    const handleClickCntBtn = (type: 'minus' | 'plus', formKey: string, subKey: string) => {
        const value = formValues[formKey].value
        if (typeof value === 'string') return;
        value[subKey] += type === 'minus' ? -1 : 1
        if (value[subKey] < 0) value[subKey] = 0
        setFormValues(JSON.parse(JSON.stringify(formValues)))
    }

    const handleSubmit = () => {
        // 从formValue转换到文字
        const transformPrompt = Object.values(formValues).map(perValue => {
            if (typeof perValue.value === 'string')
                return `${perValue.name}: ${perValue.value}`
            const cntValues = perValue.value
            const cntText = Object.entries(cntValues).map(entry => {
                return `${entry[0]}: ${entry[1]}`
            }).join(",")
            return `${perValue.name}: ${cntText}`
        }).join('\n')
        onSend?.(transformPrompt)
    }

    return (
        <div className='border border-green-50 rounded-[20.8px] mb-[30px] mt-[13px] overflow-hidden pb-5' style={{
            backgroundColor: 'rgb(235,235,236,0.4)'
        }}>
            <div className="flex justify-start text-xl text-white font-bold bg-[#32ADE6] h-[45px] leading-[45px] items-center pl-3">
                <TourismeIcon />
                <h1 className="pl-2">旅行偏好</h1>
            </div>
            <div className="p-[12px]">
                {
                    Object.values(selectorConfigObj).map(config => {
                        return (<div key={config.name}>
                            <h1 className="text-xl">
                                {config.name}
                            </h1>
                            {
                                config.type === 'Option' &&
                                <ul className={cn("grid gap-1 mb-5", `grid-cols-${Math.min(config.value.length, 4)}`)}>
                                    {
                                        config.value.map(option => {
                                            return (
                                                <li key={option.value}>
                                                    {
                                                        <div className={cn(`rounded-[20px] px-1 text-sm leading-8 text-center mt-[10px]`,
                                                            formValues[config.key].value === option.value ? 'bg-[#32ADE6] text-white' : 'bg-white text-black'
                                                        )} style={{
                                                            boxShadow: '0px 4px 10px 0px #0000001F'
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
                                config.type === 'OptionWithCnt' &&
                                <div className="rounded-[20px] bg-white py-3 px-4 mt-[10px]" style={{
                                    boxShadow: '0px 4px 10px 0px #0000001F'
                                }}>
                                    <ul>
                                        {
                                            config.value.map(option => {
                                                const curValue = formValues[config.key].value as Record<string, number>
                                                return (<li key={option.name}>
                                                    <div className="flex justify-between w-full leading-10">
                                                        <div>{option.name}</div>
                                                        <div className="flex justify-around items-center w-20">
                                                            <div onClick={() => handleClickCntBtn('minus', config.key, option.name)}>
                                                                <MinusIcon />
                                                            </div>
                                                            {
                                                                curValue[option.name]
                                                            }
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
            </div>
            <div className="flex justify-center">
                <button className="btn rounded-[20px] leading-[35px] text-xl text-white bg-[#32ADE6] cursor-pointer px-5 py-1" onClick={handleSubmit}>确认选择</button>
            </div>
        </div>
    )
}

const TourismeIcon = () => <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12.6487 16.5231C13.7 18.1642 14.6667 19.4492 14.6667 19.4492C14.6667 19.4492 15.632 18.1642 16.6847 16.5231C17.9467 14.556 19.3334 12.0766 19.3334 10.6789C19.3334 8.11493 17.244 6.03587 14.6667 6.03587C12.0894 6.03587 10 8.11493 10 10.6789C10 12.0772 11.3867 14.556 12.6487 16.5231ZM2.55869 8.01165C3.31002 9.1605 4.00002 10.0599 4.00002 10.0599C4.00002 10.0599 4.69002 9.1605 5.44135 8.01165C6.34269 6.63477 7.33335 4.89976 7.33335 3.92058C7.33335 2.12588 5.84069 0.670532 4.00002 0.670532C2.15935 0.670532 0.666687 2.12588 0.666687 3.92058C0.666687 4.89976 1.65735 6.63477 2.55869 8.01165Z" fill="white" />
    <path d="M14.6667 5.36533C11.726 5.36533 9.33333 7.74888 9.33333 10.679C9.33333 11.9479 10.26 14.0371 12.0887 16.8874C12.4994 17.5266 12.9233 18.1572 13.36 18.7787H3.61C2.722 18.7787 2 18.0262 2 17.102C2 16.1778 2.722 15.4253 3.61 15.4253H4.91067C6.53333 15.4253 7.85333 14.0713 7.85333 12.4073C7.85333 10.8749 6.73 9.62004 5.28667 9.42823C5.502 9.12174 5.74467 8.7683 5.998 8.38065C8 5.32375 8 4.26812 8 3.92072C8 1.75916 6.206 0 4 0C1.794 0 0 1.75916 0 3.92072C0 4.26812 -1.58946e-07 5.32375 2.002 8.38065C2.46812 9.09373 2.95841 9.79051 3.472 10.4698C3.48 10.4798 3.49267 10.4839 3.50133 10.4939C3.54578 10.5435 3.59748 10.5861 3.65467 10.62C3.67867 10.6348 3.69733 10.6535 3.72267 10.6656C3.80927 10.7074 3.90394 10.7297 4 10.7307H4.91067C5.798 10.7307 6.52 11.4832 6.52 12.4073C6.52 13.3315 5.798 14.084 4.91067 14.084H3.61C1.98667 14.084 0.666667 15.4381 0.666667 17.102C0.666667 18.7659 1.98667 20.12 3.61 20.12H14.6667C14.7673 20.12 14.86 20.0938 14.946 20.0536C14.9713 20.0422 14.99 20.0228 15.0133 20.008C15.0712 19.9733 15.1233 19.9299 15.168 19.8792C15.1767 19.8692 15.19 19.8645 15.1987 19.8537C15.2387 19.8001 16.1907 18.5299 17.2453 16.8867C19.072 14.0371 20 11.9479 20 10.679C20 7.74888 17.6073 5.36533 14.6667 5.36533ZM4.88467 7.64292C4.59857 8.07885 4.30362 8.50884 4 8.93261C3.69616 8.509 3.4012 8.079 3.11533 7.64292C1.50667 5.18694 1.33333 4.22185 1.33333 3.92072C1.33333 2.4989 2.52933 1.34133 4 1.34133C5.47067 1.34133 6.66667 2.4989 6.66667 3.92072C6.66667 4.22185 6.49333 5.18694 4.88467 7.64292ZM16.1247 16.1597C15.6556 16.8888 15.1694 17.6066 14.6667 18.3126C14.1637 17.6065 13.6774 16.8887 13.208 16.1597C10.9967 12.7118 10.6667 11.2457 10.6667 10.679C10.6667 8.48863 12.4607 6.70667 14.6667 6.70667C16.8727 6.70667 18.6667 8.48863 18.6667 10.679C18.6667 11.2457 18.3367 12.7111 16.1247 16.1597Z" fill="#F9C33E" />
    <path d="M14.6666 8.71862C13.564 8.71862 12.6666 9.62133 12.6666 10.7306C12.6666 11.8399 13.564 12.7426 14.6666 12.7426C15.7693 12.7426 16.6666 11.8399 16.6666 10.7306C16.6666 9.62133 15.7693 8.71862 14.6666 8.71862ZM14.6666 12.0719C13.9313 12.0719 13.3333 11.4704 13.3333 10.7306C13.3333 9.99087 13.9313 9.38928 14.6666 9.38928C15.402 9.38928 16 9.99087 16 10.7306C16 11.4704 15.402 12.0719 14.6666 12.0719ZM3.99996 2.68262C3.26463 2.68262 2.66663 3.28421 2.66663 4.02395C2.66663 4.7637 3.26463 5.36528 3.99996 5.36528C4.73529 5.36528 5.33329 4.7637 5.33329 4.02395C5.33329 3.28421 4.73529 2.68262 3.99996 2.68262ZM3.99996 4.69462C3.82831 4.68689 3.66623 4.61286 3.54748 4.48793C3.42872 4.363 3.36245 4.19681 3.36245 4.02395C3.36245 3.85109 3.42872 3.6849 3.54748 3.55997C3.66623 3.43504 3.82831 3.36101 3.99996 3.35328C4.17161 3.36101 4.33369 3.43504 4.45244 3.55997C4.57119 3.6849 4.63747 3.85109 4.63747 4.02395C4.63747 4.19681 4.57119 4.363 4.45244 4.48793C4.33369 4.61286 4.17161 4.68689 3.99996 4.69462Z" fill="#F9C33E" />
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




export default ProductSelector