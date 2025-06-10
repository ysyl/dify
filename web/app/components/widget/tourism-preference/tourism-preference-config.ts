import { parseHtmlTag, parseHtmlTagRaw } from '../../tools/widget-tool'

export type option = {
  name: string
  value: string
}

export type optionType = {
  key: string
  name: string
  type: 'option' | 'option-with-cnt'
  value: option[]
}

export type TourismPreferenceConfigType = Record<string, optionType>

export type StyleConfigType = {
  'card-bg'?: string,
  'card-bg-image'?: string,
  'body-bg'?: string,
  'body-border'?: string
  'body-bg-image'?: string,
  'header-text-color': string,
  'btn-text-color': string,
  'btn-bg-image'?: string,
  'active-bg'?: string
}

export enum TourismPreferenceTagType {
  XJ = 'xj-tourism-preference',
  SPT = 'spt-tourism-preference',
  CUSTOME = 'tourism-preference',
}
const STYLE_CONFIG: Record<TourismPreferenceTagType, StyleConfigType> = {
  [TourismPreferenceTagType.XJ]: {
    'header-text-color': 'text-white',
    'card-bg': 'bg-[#32ADE6]',
    'active-bg': 'bg-[#32ADE6]',
    'body-bg': 'bg-[rgba(235,235,236,0.8)]',
    'btn-text-color': 'btn-white',
  },
  [TourismPreferenceTagType.SPT]: {
    'header-text-color': 'text-white',
    'body-border': 'border border-white',
    'body-bg': 'bg-[rgba(235,235,236,0.8)]',
    'btn-bg-image': 'linear-gradient(to bottom, #F7CEA2, #FBC384, #FDB76E)',
    'card-bg-image': 'linear-gradient(to left, #F7CEA2, #FBC384, #FDB76E)',
    'btn-text-color': 'btn-white',
    'active-bg': 'bg-[#FDB76E]',
  },
  [TourismPreferenceTagType.CUSTOME]: {
    'header-text-color': 'text-white',
    'body-border': 'border border-white',
    'body-bg': 'bg-[rgba(235,235,236,0.8)]',
    'btn-bg-image': 'linear-gradient(to bottom, #F7CEA2, #FBC384, #FDB76E)',
    'card-bg-image': 'linear-gradient(to left, #F7CEA2, #FBC384, #FDB76E)',
    'btn-text-color': 'btn-white',
    'active-bg': 'bg-[#FDB76E]',
  },
}

const WIDGET_CONFIG: Record<TourismPreferenceTagType, TourismPreferenceConfigType> = {
  [TourismPreferenceTagType.XJ]: {
    destination: {
      key: 'destination',
      name: '行程期待',
      type: 'option',
      value: ['北疆-伊犁', '北疆-阿勒泰', '南疆地区'].map(name => ({ name, value: name })),
    },
    days: {
      key: 'days',
      name: '出行天数',
      type: 'option',
      value: ['3天', '4天', '5天', '6天', '7天', '8天', '9天', '10天以上'].map(name => ({ name, value: name })),
    },
    months: {
      key: 'months',
      name: '出行时间',
      type: 'option',
      value: ['1-3月', '4-6月', '7-8月', '9-12月'].map(name => ({ name, value: name })),
    },
    personCnt: {
      key: 'personCnt',
      name: '出行人数',
      type: 'option-with-cnt',
      value: ['成人', '儿童', '老人'].map(name => ({ name, value: name })),
    },
  },
  [TourismPreferenceTagType.SPT]: {
    destination: {
      key: 'destination',
      name: '行程期待',
      type: 'option',
      value: ['亲子', '情侣', '拍照打卡', '特种兵', '夕阳红'].map(name => ({ name, value: name })),
    },
    play_time: {
      key: 'play_time',
      name: '游玩时间',
      type: 'option',
      value: ['上午入园', '下午入园'].map(name => ({ name, value: name })),
    },
    entree_de_zone_touristique: {
      key: 'entree_de_zone_touristique',
      name: '景区入口',
      type: 'option',
      value: ['黄河区入口', '沙漠区入口'].map(name => ({ name, value: name })),
    },
  },
  [TourismPreferenceTagType.CUSTOME]: {},
}

function parseCustomConfig(widgetTagStr: string) {
  const tagEl = parseHtmlTagRaw(widgetTagStr)
  const options = [...(tagEl?.querySelectorAll('option') || [])]
  const customConfig = options.map(optionEl => ({
    name: optionEl.attributes.getNamedItem('name')?.value || '',
    key: optionEl.attributes.getNamedItem('key')?.value || '',
    type: optionEl.attributes.getNamedItem('type')?.value || '',
    value: [...(optionEl?.querySelectorAll('value') || [])].map(valueEl =>
      ({ name: valueEl.textContent?.trim(), value: valueEl.textContent?.trim() })),

  })).reduce((map: Record<string, any>, cur) => {
    map[cur.key] = cur
    return map
  }, {})

  return customConfig
}
export function isTourismPreference(widgetTagStr: string) {
  const index = Object.values(TourismPreferenceTagType).findIndex(name => widgetTagStr.trim().startsWith(`<${name}`))
  return index >= 0
}

export function getTourismPreferenceConfig(widgetTagStr: string) {
  const index = Object.values(TourismPreferenceTagType).findIndex(name => widgetTagStr.trim().startsWith(`<${name}`))
  if (index < 0) return {}
  const tagItem = parseHtmlTag(widgetTagStr)
  const defaultConfig = WIDGET_CONFIG[tagItem?.tagName as TourismPreferenceTagType]
  const customConfig = parseCustomConfig(widgetTagStr)
  const mergedConfig = {
    ...defaultConfig,
    ...customConfig,
  }
  return mergedConfig
}

export function getStyleConfig(widgetTagStr: string) {
  const index = Object.values(TourismPreferenceTagType).findIndex(name => widgetTagStr.trim().startsWith(`<${name}`))
  if (index >= 0) {
    const tagItem = parseHtmlTag(widgetTagStr)
    return STYLE_CONFIG[tagItem?.tagName as TourismPreferenceTagType]
  }
  throw new Error('illegal parametres')
}

export default getTourismPreferenceConfig
