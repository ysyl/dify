import React from 'react'
import type { LocationSelectorProps } from './location-selector'
import LocationSelector, { parseLocationSelectorConfig } from './location-selector'
import { parseHtmlTagRaw } from '../../tools/widget-tool'
import { useState } from 'react'
import cn from '@/utils/classnames'
import getStyleConfig from '../product-preference/product-preference-config'

// 定义多选择器配置接口
type LocationSelectorsProps = {
  header: string; // 整体header标题
  selectors: LocationSelectorProps[]; // 多个选择器配置数组
  onSend?: (values: string) => void; // 新增: 提交回调
  widgetTag?: string; // 新增: 样式配置标签
}

/**
 * 解析整个多选择器容器的HTML配置
 * @param widgetTagStr 包含location-selectors的完整HTML字符串
 * @returns 解析后的LocationSelectorsProps对象
 * @example
 * // 输入HTML字符串
 * const html = `<location-selectors header="Select Locations">
 *   <location-selector type="city" label="City"></location-selector>
 *   <location-selector type="country" label="Country"></location-selector>
 * </location-selectors>`;
 * // 解析结果
 * {
 *   header: "Select Locations",
 *   selectors: [
 *     { type: "city", label: "City", ... },
 *     { type: "country", label: "Country", ... }
 *   ]
 * }
 */
/**
 * 判断是否为有效的location-selectors标签字符串
 * @param widgetTagStr 待验证的HTML字符串
 * @returns 如果是以<location-selectors开头且以>结尾的标签字符串则返回true，否则返回false
 */
export function isLocationSelectorsTag(widgetTagStr: string): boolean {
  const trimmed = widgetTagStr.trim()
  return trimmed.startsWith('<location-selectors') && trimmed.endsWith('>')
}

export function parseLocationSelectorsConfig(widgetTagStr: string): LocationSelectorsProps {
  const tagEl = parseHtmlTagRaw(widgetTagStr)

  // 提取整体header标题
  const header = tagEl?.attributes.getNamedItem('header')?.value || ''

  // 解析多个location-selector子元素
  const selectorEls = [...(tagEl?.querySelectorAll('location-selector') || [])]
  const selectors = selectorEls.map((selEl) => {
    // 将DOM元素转换为HTML字符串并调用内层解析函数
    const selectorHtml = selEl.outerHTML
    return parseLocationSelectorConfig(selectorHtml, (value) => {
      console.log(value)
    })
  })

  return { header, selectors }
}

/**
 * 多地点选择器容器组件
 * 支持包含多个地点选择器，并可自定义整体标题
 * @param widgetTagStr HTML格式的配置字符串
 */
const LocationSelectors: React.FC<{ widgetTagStr: string, onSend?: (values: string) => void }> = ({ widgetTagStr, onSend }) => {
  // 解析HTML配置为实际参数
  const { header, selectors } = parseLocationSelectorsConfig(widgetTagStr)
  const styleConfig = getStyleConfig('')
  const [selectorValues, setSelectorValues] = useState<Record<string, string>>({})
  const [formAlert, setFormAlert] = useState('')

  // 处理单个选择器值变化
  const handleSelectorChange = (index: number, value: string) => {
    const selectorKey = `selector_${index}`
    setSelectorValues(prev => ({
      ...prev,
      [selectorKey]: value,
    }))
    // 清除错误提示
    if (formAlert) setFormAlert('')
  }

  // 提交处理函数
  const handleSubmit = () => {
    // 验证所有选择器是否已选择
    if (selectors.length !== Object.keys(selectorValues).length
      || selectors.some((_, index) => !selectorValues[`selector_${index}`])) {
      setFormAlert('请完成所有位置的选择后再提交')
      console.log('请完成所有位置的选择后再提交')
      return
    }

    // 格式化提交数据 { 选择器标题: 值 }
    const formattedValues = selectors.reduce((result, selector, index) => {
      const key = selector.label || `位置选择${index + 1}`
      return {
        ...result,
        [key]: selectorValues[`selector_${index}`],
      }
    }, {})

    const formattedValuesStr = Object.entries(formattedValues).map(([key, value]) => `${key}:${value}`).join(',')

    // 调用提交回调
    onSend?.(formattedValuesStr)
  }

  return (
    <div className="space-y-6 rounded-lg border p-4">
      {/* 自定义header标题 */}
      {header && <h3 className="text-lg font-semibold text-gray-800">{header}</h3>}

      {/* 渲染多个选择器 */}
      <div className="space-y-4">
        {selectors.map((selector, index) => (
          <div key={index} className="rounded bg-gray-50 p-3">
            <LocationSelector
              {...selector}
              value={selectorValues[`selector_${index}`] || ''}
              onChange={value => handleSelectorChange(index, value)}
            />
          </div>
        ))}
      </div>

      {/* 错误提示 */}
      {formAlert && <p className="mt-1 text-center text-xs text-red-500">{formAlert}</p>}

      {/* 新增: 确认提交按钮 */}
      <div className="mb-1 mt-8 flex justify-center">
        <button
          className={cn('btn text-md h-[44px] w-full cursor-pointer rounded-md px-5 py-1 leading-[44px]',
            styleConfig['btn-text-color'])}
          style={{
            backgroundImage: 'linear-gradient(to bottom, #F7CEA2, #FBC384, #FDB76E)',
          }}
          onClick={handleSubmit}
        >确认选择</button>
      </div>
    </div>
  )
}

export default LocationSelectors
