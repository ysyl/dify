import { parseHtmlTag } from '../../tools/widget-tool'

export type Option = {
  name: string
  value: string
}

export type OptionType = {
  key: string
  name: string
  type: 'Option'
  value: Option[]
}

export type ProductPreferenceConfigType = Record<string, OptionType>

export type StyleConfigType = {
  'card-bg': string,
  'body-bg': string,
  'header-text-color': string,
  'btn-text-color': string,
}

export enum ProductPreferenceTagType {
  SPT = 'spt-product-preference',
}
const STYLE_CONFIG: Record<ProductPreferenceTagType, StyleConfigType> = {
  [ProductPreferenceTagType.SPT]: {
    'header-text-color': 'text-white',
    'btn-text-color': 'text-white',
    'card-bg': 'bg-[#FCB770]',
    'body-bg': 'bg-[rgba(235,235,236,0.8)]',
  },
}

const WIDGET_CONFIG: Record<ProductPreferenceTagType, ProductPreferenceConfigType> = {
  [ProductPreferenceTagType.SPT]: {
    ticket_type: {
      key: 'ticket_type',
      name: '门票类型',
      type: 'Option',
      value: ['门票+交通', '优惠套票'].map(name => ({ name, value: name })),
    },
    attraction: {
      key: 'attraction',
      name: '游玩景区',
      type: 'Option',
      value: ['黄河区项目', '沙漠区项目'].map(name => ({ name, value: name })),
    },
  },
}

export function isProductPreference(widgetTagStr: string) {
  const index = Object.values(ProductPreferenceTagType).findIndex(name => widgetTagStr.startsWith(`<${name}`))
  return index >= 0
}

export function getTourismPreferenceConfig(widgetTagStr: string) {
  const index = Object.values(ProductPreferenceTagType).findIndex(name => widgetTagStr.startsWith(`<${name}`))
  if (index >= 0) {
    const tagItem = parseHtmlTag(widgetTagStr)
    return WIDGET_CONFIG[tagItem?.tagName as ProductPreferenceTagType]
  }
  throw new Error('illegal parametres')
}

export function getStyleConfig(widgetTagStr: string) {
  const index = Object.values(ProductPreferenceTagType).findIndex(name => widgetTagStr.startsWith(`<${name}`))
  if (index >= 0) {
    const tagItem = parseHtmlTag(widgetTagStr)
    return STYLE_CONFIG[tagItem?.tagName as ProductPreferenceTagType]
  }
  throw new Error('illegal parametres')
}

export default getTourismPreferenceConfig
