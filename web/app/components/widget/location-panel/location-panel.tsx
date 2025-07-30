import React, { useEffect } from 'react'
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
export type LocationPanelProps = {
  header: string; // 整体header标题
  groups: LocationSelectorGroup[]; // 选择器组数组
  groupSwitchName?: string; // 切换单选框标签
  // 新增：获取定位的可选参数
  getUserLocation?: boolean;
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
  // 新增：解析get-user-location属性
  const getUserLocation = tagEl?.attributes.getNamedItem('get-user-location')?.value === 'true'

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

  return {
    header,
    groups,
    groupSwitchName,
    getUserLocation, // 新增getUserLocation配置
  }
}
/**
 * 多地点选择器容器组件
 * 支持包含多个地点选择器，并可自定义整体标题
 * @param widgetTagStr HTML格式的配置字符串
 */
const LocationPanel: React.FC<{ widgetTagStr: string, onSend?: (values: string) => void }> = ({ widgetTagStr, onSend }) => {
  // 解析HTML配置为实际参数
  const { header, groups, groupSwitchName, getUserLocation } = parseLocationPanelConfig(widgetTagStr)
  const styleConfig = getStyleConfig('')
  const [activeGroupKey, setActiveGroupKey] = useState<string>(groups[0]?.key || '')
  const [selectorValues, setSelectorValues] = useState<Record<string, string>>({})
  const [formAlert, setFormAlert] = useState('')
  // 添加经纬度状态存储
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)

  // 新增：定位逻辑实现
  useEffect(() => {
    if (!getUserLocation) return
    // H5环境：调用浏览器原生定位API
    if (navigator.geolocation) {
      // 业务需求：需要获取用户位置以提供附近景点推荐功能
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log('H5定位成功', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
          // 保存经纬度到状态
          setLatitude(position.coords.latitude)
          setLongitude(position.coords.longitude)
        },
        (error) => {
          console.error('H5定位失败', error)
        },
      )
    }
    else {
      console.error('浏览器不支持地理定位')
    }
  }, [getUserLocation])
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
    <div className="overflow-hidden rounded-lg border p-0 shadow-sm">
      {/* 自定义header标题 - 添加蓝色背景和图标 */}
      {header && (
        <div className="flex items-center bg-[#1E88E5] p-4 text-white">
          <svg className="mr-2 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="text-lg font-semibold">{header} 经纬度：{latitude}, {longitude}</h3>
        </div>
      )}

      {/* Group切换单选框 - 修改为蓝色切换样式 */}
      {groups.length > 1 && (
        <div className="flex items-center space-x-2 border-b p-4">
          {groupSwitchName && <span className="w-16 text-sm text-gray-600">{groupSwitchName}</span>}
          <div className='flex w-full justify-between gap-2'>
            {groups.map((group, index) => (
              <button
                key={group.key}
                className={
                  cn('rounded-md px-6 py-2 text-sm font-medium transition-colors duration-200',
                    activeGroupKey === group.key
                      ? 'bg-[#1E88E5] text-white'
                      : 'border border-blue-500 bg-white text-blue-500 hover:bg-blue-50',
                    index === 0 ? 'rounded-l-md' : index === groups.length - 1 ? 'rounded-r-md' : '',
                    'w-[47%]',
                  )}
                onClick={() => handleGroupChange(group.key)}
              >
                {group.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 渲染当前group的选择器 - 修改为两列布局 */}
      <div className="space-y-6 p-4">
        {activeGroup?.selectors.map((selector, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="w-16 text-sm text-gray-700">{selector.label}</label>
              <div className="flex-1">
                <LocationSelector
                  {...selector}
                  value={selectorValues[`${activeGroupKey}_${index}`] || ''}
                  onChange={value => handleSelectorChange(index, value)}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 错误提示 */}
      {formAlert && <p className="mt-1 text-center text-xs text-red-500">{formAlert}</p>}

      {/* 确认提交按钮 - 修改为纯蓝色背景 */}
      <div className="mb-4 mt-2 p-4">
        <button
          className={cn('btn text-md h-[44px] w-full cursor-pointer rounded-md px-5 py-1 leading-[44px] text-white',
            styleConfig['btn-text-color'])}
          style={{
            backgroundColor: '#1E88E5',
            backgroundImage: 'none',
          }}
          onClick={handleSubmit}
        >确认选择</button>
      </div>
    </div>
  )
}

export default LocationPanel
