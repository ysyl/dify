import React from 'react'
import { SimpleSelect } from '@/app/components/base/select'
import { parseHtmlTagRaw } from '../../tools/widget-tool'

// 定义地点数据类型接口
export type LocationItem = {
  name: string;
  latitude: number;
  longitude: number;
}
// 定义LocationItems的Props接口
export type LocationItemsProps = {
  id: string;
  refs?: React.RefObject<HTMLDivElement>;
  locationItems: LocationItem[];
}
// 定义组件属性接口
export type LocationSelectorProps = {
  label: string; // 选择器label
  type: string;
  locations: LocationItem[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  recommendLabel?: string; // 热门推荐文本
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  label, type, locations, value, onChange, placeholder, recommendLabel,
}) => {
  return (
    <div className="w-full">
      {/* 选择器label */}
      <SimpleSelect
        key={type}
        className='w-full'
        defaultValue={value}
        placeholder={placeholder}
        onSelect={i => onChange(i.value as string)}
        items={locations.map(loc => ({ name: loc.name, value: loc.name }))}
        allowSearch={false}
      />

      {/* 自定义热门推荐文本 */}
      {recommendLabel && (
        <p className="mt-1 text-xs text-gray-500">{recommendLabel}</p>
      )}
    </div>
  )
}
export function isLocationSelector(widgetTagStr?: string) {
  if (!widgetTagStr) return false
  return widgetTagStr.startsWith('<location-selector') && widgetTagStr.endsWith('</location-selector>')
}

/**
 * 解析单个地点选择器的HTML配置
 * @param selectorHtml 单个location-selector的HTML片段
 * @returns 解析后的LocationSelectorProps对象
 * @example
 * // 输入HTML片段
 * const html = `<location-selector title="City Selector" placeholder="Choose a city">
 *   <location-items>
 *     <location-item name="Beijing" latitude="39.9042" longitude="116.4074"></location-item>
 *     <location-item name="Shanghai" latitude="31.2304" longitude="121.4737"></location-item>
 *   </location-items>
 * </location-selector>`;
 * // 解析结果
 * {
 *   title: "City Selector",
 *   selectorHeader: undefined,
 *   locations: [
 *     { name: "Beijing", latitude: 39.9042, longitude: 116.4074 },
 *     { name: "Shanghai", latitude: 31.2304, longitude: 121.4737 }
 *   ],
 *   value: "",
 *   placeholder: "Choose a city",
 *   recommendLabel: undefined,
 *   onChange: () => {}
 * }
 */
export function parseLocationSelectorConfig(selectorHtml: string,
  locationItemsList: LocationItemsProps[],
  onChange: (value: string) => void): LocationSelectorProps {
  const tagEl = parseHtmlTagRaw(selectorHtml)

  // 提取单个selector的属性
  const label = tagEl?.attributes.getNamedItem('label')?.value || ''
  const type = tagEl?.attributes.getNamedItem('type')?.value || ''
  const placeholder = tagEl?.attributes.getNamedItem('placeholder')?.value || ''
  const recommendLabel = tagEl?.attributes.getNamedItem('recommend-label')?.value
  const value = tagEl?.attributes.getNamedItem('value')?.value || ''

  // 解析location-items下的location-item元素
  const locationItemsEl = tagEl?.querySelector('location-items')
  const ref = locationItemsEl?.attributes.getNamedItem('ref')?.value

  let locations: LocationItem[] = []
  if (ref) {
    locations = locationItemsList.find(item => item.id === ref)?.locationItems || []
  }
 else {
    const locationItems = [...(locationItemsEl?.querySelectorAll('location-item') || [])]
    locations = locationItems.map((itemEl) => {
      return ({
        name: itemEl.attributes.getNamedItem('name')?.value || '',
        latitude: Number(itemEl.attributes.getNamedItem('latitude')?.value) || 0,
        longitude: Number(itemEl.attributes.getNamedItem('longitude')?.value) || 0,
      })
    }).filter(item => item.name && !isNaN(item.latitude) && !isNaN(item.longitude))
  }

  return {
    label,
    type,
    locations,
    value,
    placeholder,
    recommendLabel,
    onChange,
  }
}
export default LocationSelector
