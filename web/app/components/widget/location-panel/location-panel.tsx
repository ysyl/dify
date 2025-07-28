import React from 'react'
import type { LocationSelectorProps } from './location-selector'
import LocationSelector, { parseLocationSelectorConfig } from './location-selector'
import { parseHtmlTagRaw } from '../../tools/widget-tool'
import { useState } from 'react'
import cn from '@/utils/classnames'
import getStyleConfig from '../product-preference/product-preference-config'

// 定义选择器组接口
type LocationSelectorGroup = {
  name: string; // 组名称
  key: string; // 组唯一标识
  selectors: LocationSelectorProps[]; // 组内选择器配置数组
}

// 定义多选择器配置接口
type LocationPanelProps = {
  header: string; // 整体header标题
  groups: LocationSelectorGroup[]; // 选择器组数组
  groupSwitchName?: string; // 切换单选框标签
  onSend?: (values: string) => void; // 提交回调
  widgetTag?: string; // 样式配置标签
}

/**
 * 解析整个多选择器容器的HTML配置
 * @param widgetTagStr 包含location-selectors的完整HTML字符串
 * @returns 解析后的LocationSelectorsProps对象
 * @example
 * // 输入HTML字符串
 * const html = `<location-panel header="Select Locations" group-switch-name="方向">
 *   <location-selector-group name="单向" key="one_way">
 *     <location-selector type="city" label="出发城市"></location-selector>
 *   </location-selector-group>
 *   <location-selector-group name="往返" key="round_trip">
 *     <location-selector type="city" label="出发城市"></location-selector>
 *     <location-selector type="city" label="到达城市"></location-selector>
 *   </location-selector-group>
 * </location-panel>`;
 * // 解析结果
 * {
 *   header: "Select Locations",
 *   groupSwitchName: "方向",
 *   groups: [
 *     {
 *       name: "单向",
 *       key: "one_way",
 *       selectors: [
 *         { type: "city", label: "出发城市", ... }
 *       ]
 *     },
 *     {
 *       name: "往返",
 *       key: "round_trip",
 *       selectors: [
 *         { type: "city", label: "出发城市", ... },
 *         { type: "city", label: "到达城市", ... }
 *       ]
 *     }
 *   ]
 * }
 */
/**
 * 判断是否为有效的location-selectors标签字符串
 * @param widgetTagStr 待验证的HTML字符串
 * @returns 如果是以<location-selectors开头且以>结尾的标签字符串则返回true，否则返回false
 */
export function isLocationPanelTag(widgetTagStr: string): boolean {
  const trimmed = widgetTagStr.trim()
  return trimmed.startsWith('<location-panel') && trimmed.endsWith('>')
}

export function parseLocationPanelConfig(widgetTagStr: string): LocationPanelProps {
  const tagEl = parseHtmlTagRaw(widgetTagStr)

  // 提取整体header标题
  const header = tagEl?.attributes.getNamedItem('header')?.value || ''
  // 提取group切换名称
  const groupSwitchName = tagEl?.attributes.getNamedItem('group-switch-name')?.value || ''

  // 解析多个location-selector-group子元素
  const groupEls = [...(tagEl?.querySelectorAll('location-selector-group') || [])]
  const groups = groupEls.map((groupEl) => {
    // 获取group的name和key属性
    const name = groupEl.attributes.getNamedItem('name')?.value || ''
    const key = groupEl.attributes.getNamedItem('key_name')?.value || ''

    // 解析group内的location-selector子元素
    const selectorEls = [...(groupEl.querySelectorAll('location-selector') || [])]
    const selectors = selectorEls.map((selEl) => {
      const selectorHtml = selEl.outerHTML
      return parseLocationSelectorConfig(selectorHtml, (value) => {
        console.log(value)
      })
    })

    return { name, key, selectors }
  })

  // 保持向后兼容：如果没有groups，使用selectors创建一个默认group
  if (groups.length === 0) {
    const selectorEls = [...(tagEl?.querySelectorAll('location-selector') || [])]
    const selectors = selectorEls.map((selEl) => {
      const selectorHtml = selEl.outerHTML
      return parseLocationSelectorConfig(selectorHtml, (value) => {
        console.log(value)
      })
    })
    groups.push({ name: 'default', key: 'default', selectors })
  }

  return { header, groups, groupSwitchName }
}

/**
 * 多地点选择器容器组件
 * 支持包含多个地点选择器，并可自定义整体标题
 * @param widgetTagStr HTML格式的配置字符串
 */
const LocationPanel: React.FC<{ widgetTagStr: string, onSend?: (values: string) => void }> = ({ widgetTagStr, onSend }) => {
  // 解析HTML配置为实际参数
  const { header, groups, groupSwitchName } = parseLocationPanelConfig(widgetTagStr)
  const styleConfig = getStyleConfig('')
  const [activeGroupKey, setActiveGroupKey] = useState<string>(groups[0]?.key || '')
  const [selectorValues, setSelectorValues] = useState<Record<string, string>>({})
  const [formAlert, setFormAlert] = useState('')

  // 获取当前激活的group
  const activeGroup = groups.find(group => group.key === activeGroupKey) || groups[0]

  // 处理单个选择器值变化
  const handleSelectorChange = (index: number, value: string) => {
    const selectorKey = `${activeGroupKey}_${index}`
    setSelectorValues(prev => ({
      ...prev,
      [selectorKey]: value,
    }))
    // 清除错误提示
    if (formAlert) setFormAlert('')
  }

  // 处理group切换
  const handleGroupChange = (groupKey: string) => {
    setActiveGroupKey(groupKey)
    // 清除当前group的选择值
    const newValues = { ...selectorValues }
    Object.keys(newValues).forEach((key) => {
      if (key.startsWith(groupKey))
        delete newValues[key]
    })
    setSelectorValues(newValues)
  }

  // 提交处理函数
  const handleSubmit = () => {
    // 验证当前group的所有选择器是否已选择
    if (!activeGroup || activeGroup.selectors.length === 0) {
      setFormAlert('没有可选择的位置选项')
      return
    }

    const allSelected = activeGroup.selectors.every((_, index) => {
      const selectorKey = `${activeGroupKey}_${index}`
      return !!selectorValues[selectorKey]
    })

    if (!allSelected) {
      setFormAlert('请完成所有位置的选择后再提交')
      return
    }

    // 格式化提交数据 { 选择器标题: 值 }
    const formattedValues: Record<string, string> = activeGroup.selectors.reduce((result, selector, index) => {
      const selectorKey = `${activeGroupKey}_${index}`
      const key = selector.label || `位置选择${index + 1}`
      return {
        ...result,
        [key]: selectorValues[selectorKey],
      }
    }, {})

    // 添加group名称到提交数据
    formattedValues.group = activeGroup.name

    const formattedValuesStr = Object.entries(formattedValues).map(([key, value]) => `${key}:${value}`).join(',')

    // 调用提交回调
    onSend?.(formattedValuesStr)
  }

  return (
    <div className="space-y-6 rounded-lg border p-4">
      {/* 自定义header标题 */}
      {header && <h3 className="text-lg font-semibold text-gray-800">{header}</h3>}

      {/* Group切换单选框 */}
      {groups.length > 1 && (
        <div className="flex items-center space-x-4 py-2">
          {groupSwitchName && <span className="text-sm text-gray-600">{groupSwitchName}:</span>}
          {groups.map(group => (
            <button
              key={group.key}
              className={`rounded-md px-4 py-2 text-sm ${activeGroupKey === group.key
                ? 'bg-primary'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              onClick={() => handleGroupChange(group.key)}
            >
              {group.name}
            </button>
          ))}
        </div>
      )}

      {/* 渲染当前group的选择器 */}
      <div className="space-y-4">
        {activeGroup?.selectors.map((selector, index) => (
          <div key={index} className="rounded bg-gray-50 p-3">
            <LocationSelector
              {...selector}
              value={selectorValues[`${activeGroupKey}_${index}`] || ''}
              onChange={value => handleSelectorChange(index, value)}
            />
          </div>
        ))}
      </div>

      {/* 错误提示 */}
      {formAlert && <p className="mt-1 text-center text-xs text-red-500">{formAlert}</p>}

      {/* 确认提交按钮 */}
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

export default LocationPanel
