import React, { useMemo } from 'react'
import { SimpleSelect } from '@/app/components/base/select'
import { parseHtmlTagRaw } from '../../tools/widget-tool'

// 定义地点数据类型接口
export type LocationItem = {
  name: string;
  latitude: number;
  longitude: number;
  recommendLabel?: string; // 新增推荐标签属性
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
  required?: boolean; // 新增必填校验属性，默认true
  showLocationButton?: boolean; // 新增定位按钮可选属性
}

const LocationSelector: React.FC<LocationSelectorProps> = ({
  label, type, locations, value, onChange, placeholder, showLocationButton = false,
}) => {
  // 新增：根据当前选中值找到对应的location-item
  const selectedLocation = useMemo(() => {
    return locations.find(loc => loc.name === value)
  }, [locations, value])

  // 新增：定位按钮点击事件处理函数
  const handleLocationButtonClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords
          console.log('定位成功', { latitude, longitude })

          // 这里可以根据获取到的经纬度查找匹配的地点
          // 简单实现：选择第一个地点（实际应用中可能需要更复杂的匹配逻辑）
          if (locations.length > 0)
            onChange(locations[0].name)
        },
        (error) => {
          console.error('定位失败', error)
        },
      )
    }
 else {
      console.error('浏览器不支持地理定位')
    }
  }

  return (
    <div className="relative w-full">
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

      {/* 新增：定位按钮 */}
      {showLocationButton && (
        <button
          onClick={handleLocationButtonClick}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-gray-100 p-2 hover:bg-gray-200"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      )}

      {/* 自定义热门推荐文本 */}
      {selectedLocation?.recommendLabel && (
        <p className="absolute mt-1 text-xs text-gray-500">热门推荐：{selectedLocation.recommendLabel}</p>
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
  const required = tagEl?.attributes.getNamedItem('required')?.value !== 'false'
  const showLocationButton = tagEl?.attributes.getNamedItem('show-location-button')?.value === 'true'
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
    required,
    showLocationButton,
    onChange,
  }
}
export default LocationSelector
