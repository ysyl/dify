import { parseHtmlTag } from '../../tools/widget-tool'

export type Option = {
  name: string
  value: string
}

export type OptionType = {
  key: string
  name: string
  type: 'Option' | 'OptionWithCnt'
  value: Option[]
}

export type TourismPreferenceConfigType = Record<string, OptionType>

export enum TourismPreferenceTagType {
  XJ = 'xj-tourism-preference',
  SPT = 'spt-tourism-preference',
}

const WIDGET_CONFIG: Record<TourismPreferenceTagType, TourismPreferenceConfigType> = {
  [TourismPreferenceTagType.XJ]: {
    destination: {
      key: 'destination',
      name: '行程期待',
      type: 'Option',
      value: ['北疆-伊犁', '北疆-阿勒泰', '南疆地区'].map(name => ({ name, value: name })),
    },
    days: {
      key: 'days',
      name: '出行天数',
      type: 'Option',
      value: ['3天', '4天', '5天', '6天', '7天', '8天', '9天', '10天以上'].map(name => ({ name, value: name })),
    },
    months: {
      key: 'months',
      name: '出行时间',
      type: 'Option',
      value: ['1-3月', '4-6月', '7-8月', '9-12月'].map(name => ({ name, value: name })),
    },
    personCnt: {
      key: 'personCnt',
      name: '出行人数',
      type: 'OptionWithCnt',
      value: ['成人', '儿童', '老人'].map(name => ({ name, value: name })),
    },
  },
  [TourismPreferenceTagType.SPT]: {
    destination: {
      key: 'destination',
      name: '行程期待',
      type: 'Option',
      value: ['亲子', '情侣', '拍照打卡', '特种兵', '夕阳红'].map(name => ({ name, value: name })),
    },
    play_time: {
      key: 'play_time',
      name: '游玩时间',
      type: 'Option',
      value: ['上午入园', '下午入园'].map(name => ({ name, value: name })),
    },
    entree_de_zone_touristique: {
      key: 'entree_de_zone_touristique',
      name: '景区入口',
      type: 'Option',
      value: ['黄河区入口', '沙漠区入口'].map(name => ({ name, value: name })),
    },
    hotel: {
      key: 'hotel',
      name: '入住酒店',
      type: 'Option',
      value: ['沙漠星星酒店', '沙漠钻石酒店', '其他'].map(name => ({ name, value: name })),
    },
  },
}

export function isTourismPreference(widgetTagStr: string) {
  const index = Object.values(TourismPreferenceTagType).findIndex(name => widgetTagStr.startsWith(`<${name}`))
  return index >= 0
}

export function getTourismPreferenceConfig(widgetTagStr: string) {
  const index = Object.values(TourismPreferenceTagType).findIndex(name => widgetTagStr.startsWith(`<${name}`))
  if (index >= 0) {
    const tagItem = parseHtmlTag(widgetTagStr)
    return WIDGET_CONFIG[tagItem?.tagName as TourismPreferenceTagType]
  }
  throw new Error('illegal parametres')
}

export default getTourismPreferenceConfig
