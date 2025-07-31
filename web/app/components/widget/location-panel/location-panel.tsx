import React from 'react'
import type { LocationItemsProps, LocationSelectorProps } from './location-selector'
import LocationSelector, { parseLocationSelectorConfig } from './location-selector'
import { parseHtmlTagRaw } from '../../tools/widget-tool'
import { useState } from 'react'
import cn from '@/utils/classnames'
import getStyleConfig from '../product-preference/product-preference-config'
import { PhotoProvider, PhotoView } from 'react-photo-view'
import 'react-photo-view/dist/react-photo-view.css'

// 定义选择器组接口
type LocationSelectorGroup = {
  name: string; // 组名称
  key: string; // 组唯一标识
  selectors: LocationSelectorProps[]; // 组内选择器配置数组
  template?: string; // 组模板字段
  templateMap?: Record<string, string>; // 新增：模板映射，根据选择器标签组合选择模板
}

// 定义多选择器配置接口
export type LocationPanelProps = {
  header: string;
  groups: LocationSelectorGroup[];
  groupSwitchName?: string;
  widgetTag?: string;
  locationItemsList: LocationItemsProps[];
  mapSrc?: string; // 新增地图图片地址属性
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

  const header = tagEl?.attributes.getNamedItem('header')?.value || ''
  const groupSwitchName = tagEl?.attributes.getNamedItem('group-switch-name')?.value || ''
  const getUserLocation = tagEl?.attributes.getNamedItem('get-user-location')?.value === 'true'
  // 新增：解析template属性
  const template = tagEl?.attributes.getNamedItem('template')?.value || ''
  // 新增：解析map-src属性
  const mapSrc = tagEl?.attributes.getNamedItem('map-src')?.value || ''

  // 解析location-items元素
  const locationItemsEls = [...(tagEl?.querySelectorAll('location-items') || [])]
  const locationItemsList: LocationItemsProps[] = locationItemsEls.map((itemEl) => {
    // 如果有id，则该location-items定义了可被引用的location-item列表
    // 如果有ref, 则是引用之前已定义好的location-items，使用id关联；此处是panel下第一层，只有id，没有ref
    const id = itemEl.attributes.getNamedItem('id')?.value || ''

    const locationItems = [...(itemEl?.querySelectorAll('location-item') || [])]
    const locations = locationItems.map(itemEl => ({
      name: itemEl.attributes.getNamedItem('name')?.value || '',
      latitude: Number(itemEl.attributes.getNamedItem('latitude')?.value) || 0,
      longitude: Number(itemEl.attributes.getNamedItem('longitude')?.value) || 0,
      recommendLabel: itemEl.attributes.getNamedItem('recommend-label')?.value || '', // 解析推荐标签
    })).filter(item => item.name && !isNaN(item.latitude) && !isNaN(item.longitude))

    return { id, locationItems: locations }
  })

  // 解析多个location-selector-group子元素
  const groupEls = [...(tagEl?.querySelectorAll('location-selector-group') || [])]
  const groups = groupEls.map((groupEl) => {
    // 获取group的name和key属性
    const name = groupEl.attributes.getNamedItem('name')?.value || ''
    const template = groupEl.attributes.getNamedItem('template')?.value || ''
    const templateMapStr = groupEl.attributes.getNamedItem('template-map')?.value || '{}'
    const key = groupEl.attributes.getNamedItem('key_name')?.value || name || ''

    // 解析模板映射字符串为对象
    let templateMap: Record<string, string> = {}
    try {
      templateMap = JSON.parse(templateMapStr)
    }
    catch (e) {
      console.error('解析template-map失败', e)
    }

    // 解析group内的location-selector子元素
    const selectorEls = [...(groupEl.querySelectorAll('location-selector') || [])]
    const selectors = selectorEls.map((selEl) => {
      const selectorHtml = selEl.outerHTML
      return parseLocationSelectorConfig(selectorHtml, locationItemsList, (value) => {
        console.log(value)
      })
    })

    return {
      name,
      key,
      selectors,
      template,
      templateMap, // 添加模板映射
    }
  })

  // 保持向后兼容：如果没有groups，使用selectors创建一个默认group
  if (groups.length === 0) {
    const selectorEls = [...(tagEl?.querySelectorAll('location-selector') || [])]
    const selectors = selectorEls.map((selEl) => {
      const selectorHtml = selEl.outerHTML
      return parseLocationSelectorConfig(selectorHtml, locationItemsList, (value) => {
        console.log(value)
      })
    })
    groups.push({ name: 'default', key: 'default', selectors, template, templateMap: {} })
  }

  return {
    header,
    groups,
    groupSwitchName,
    locationItemsList,
    mapSrc, // 添加mapSrc属性
  }
}
/**
 * 多地点选择器容器组件
 * 支持包含多个地点选择器，并可自定义整体标题
 * @param widgetTagStr HTML格式的配置字符串
 */
const LocationPanel: React.FC<{ widgetTagStr?: string, config?: LocationPanelProps, onSend?: (values: string) => void }> = ({ widgetTagStr, config, onSend }) => {
  // 解析HTML配置为实际参数
  if (!config && widgetTagStr) config = parseLocationPanelConfig(widgetTagStr)
  const { header, groups, groupSwitchName, mapSrc } = config || {} // 解构出mapSrc
  const styleConfig = getStyleConfig('')
  const [activeGroupKey, setActiveGroupKey] = useState<string>(groups?.[0]?.key || '')
  const [selectorValues, setSelectorValues] = useState<Record<string, string>>({})
  const [formAlert, setFormAlert] = useState('')
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')
  const [showMap, setShowMap] = useState(false) // 新增控制路线图显示的状态

  // 获取当前激活的group
  const activeGroup = groups?.find(group => group.key === activeGroupKey) || groups?.[0]

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
  const formatSelectorValues = (
    activeGroup: LocationSelectorGroup,
    selectorValues: Record<string, string>,
  ): Record<string, string> => {
    return activeGroup.selectors.reduce((result, selector, index) => {
      const selectorKey = `${activeGroup.key}_${index}`
      const key = selector.label || `位置选择${index + 1}`
      return {
        ...result,
        [key]: selectorValues[selectorKey],
      }
    }, {})
  }
  const formatToStr = (formattedValues: Record<string, string>, template?: string, templateMap?: Record<string, string>): string => {
    // 确定要使用的模板
    let finalTemplate = template

    // 如果有模板映射且选择器数量匹配某个映射键
    if (templateMap) {
      // 获取所有非空值的键
      const nonEmptyKeys = Object.keys(formattedValues).filter(key => !!formattedValues[key])
      const keyCount = nonEmptyKeys.length
      const keyNames = nonEmptyKeys.join(',')

      // 优先匹配键名组合
      if (templateMap[keyNames])
        finalTemplate = templateMap[keyNames]

      // 其次匹配键数量
      else if (templateMap[keyCount.toString()])
        finalTemplate = templateMap[keyCount.toString()]
    }

    if (finalTemplate) {
      // 修复：支持中文占位符匹配
      return finalTemplate.replace(/\{([\p{L}\d_]+)\}/gu, (match, key) => {
        // 调试信息：帮助确认键值对应关系
        console.log(`替换占位符: ${key} = ${formattedValues[key] || '未找到'}`)
        return formattedValues[key] || match
      })
    }
    // 默认格式化逻辑：key:value 形式用逗号连接
    return Object.entries(formattedValues)
      .map(([key, value]) => `${key}:${value}`)
      .join(',')
  }
  // 提交处理函数
  const handleSubmit = () => {
    // 验证当前group的所有选择器是否已选择
    if (!activeGroup || activeGroup.selectors.length === 0) {
      setFormAlert('没有可选择的位置选项')
      return
    }

    const allSelected = activeGroup.selectors.every((selector, index) => {
      const selectorKey = `${activeGroupKey}_${index}`
      // 仅对required=true的选择器进行校验
      if (selector.required !== false)
        return !!selectorValues[selectorKey]

      // required=false时不校验
      return true
    })

    if (!allSelected) {
      setFormAlert('请完成所有位置的选择后再提交')
      return
    }
    // 使用提取的格式化方法
    const formattedValues = formatSelectorValues(activeGroup, selectorValues)
    const formattedValuesStr = formatToStr(formattedValues, activeGroup.template, activeGroup.templateMap)

    // 调用提交回调
    onSend?.(formattedValuesStr)
  }

  // 新增切换路线图显示状态的函数
  const toggleMap = () => {
    setShowMap(!showMap)
  }

  return (
    <div className="rounded-[20.8px] border p-0 shadow-sm">
      {/* 自定义header标题 - 添加蓝色背景和图标 */}
      {header && (
        <div className="flex items-center rounded-t-[20.8px] bg-[#1E88E5] p-4 text-white">
          <svg className="mr-2 h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="text-lg font-semibold">{header}</h3>
        </div>
      )}

      {/* Group切换单选框 - 修改为蓝色切换样式 */}
      {(groups?.length || 0) > 1 && (
        <div className="mt-4 flex items-center space-x-2 border-b px-4">
          {groupSwitchName && <span className="w-16 text-sm text-gray-600">{groupSwitchName}</span>}
          <div className='flex w-full justify-between gap-2'>
            {groups?.map((group, index) => (
              <button
                key={group.key}
                className={
                  cn('rounded-lg px-6 py-2 text-sm font-medium transition-colors duration-200',
                    activeGroupKey === group.key
                      ? 'bg-[#1E88E5] text-white'
                      : 'border border-blue-500 bg-white text-gray-500 hover:bg-blue-50',
                    index === 0 ? 'rounded-l-lg' : index === groups.length - 1 ? 'rounded-r-lg' : '',
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
            <div className="mb-6 flex items-center justify-between">
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

      {/* 查看路线图按钮 */}
      {mapSrc && (
        <div className="mb-2 px-4">
          <button
            className="w-full rounded-[20.8px] border border-gray-300 bg-white px-5 py-2 text-sm text-gray-700 hover:bg-gray-50"
            onClick={toggleMap}
          >
            {showMap ? '收起路线图' : '查看路线图'}
          </button>
        </div>
      )}

      {/* 路线图图片 */}
      {showMap && mapSrc && (
        <div className="mb-4 px-4">
          <PhotoProvider>
            <PhotoView src={mapSrc}>
              <img
                src={mapSrc}
                alt="路线图"
                className="w-full rounded-[20.8px] border border-gray-200"
                style={{ objectFit: 'contain' }}
                onClick={() => setImagePreviewUrl(mapSrc)}
              />
            </PhotoView>
          </PhotoProvider>
        </div>
      )}
      {/* 确认提交按钮 */}
      <div className="mb-4 px-4">
        <button
          className={cn('btn text-md h-[44px] w-full cursor-pointer rounded-[20.8px] px-5 py-1 leading-[44px] text-white',
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
