import { parseHtmlTag, parseHtmlTagRaw } from '../../tools/widget-tool'

export type Option = {
  name: string
  value: string
}

export type OptionType = {
  key: string
  name: string
  type: 'option'
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
  CUSTOME = 'product-preference',
}
const STYLE_CONFIG: Record<ProductPreferenceTagType, StyleConfigType> = {
  [ProductPreferenceTagType.SPT]: {
    'header-text-color': 'text-white',
    'btn-text-color': 'text-white',
    'card-bg': 'bg-[#FCB770]',
    'body-bg': 'bg-[rgba(235,235,236,0.8)]',
  },
  [ProductPreferenceTagType.CUSTOME]: {
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
      type: 'option',
      value: ['门票+交通', '优惠套票'].map(name => ({ name, value: name })),
    },
    attraction: {
      key: 'attraction',
      name: '游玩景区',
      type: 'option',
      value: ['黄河区项目', '沙漠区项目'].map(name => ({ name, value: name })),
    },
  },
  [ProductPreferenceTagType.CUSTOME]: {},
}

export function isProductPreference(widgetTagStr: string) {
  const index = Object.values(ProductPreferenceTagType).findIndex(name => widgetTagStr.trim().startsWith(`<${name}`))
  return index >= 0
}

/**
 * @param widgetTagStr xml
 * 格式：
 * <product-preference>
 *   <option key="ticket_type" type="option" name="门票类型">
 *      <value>门票+交通</value>
 *      <value>优惠套票</value>
 *   </option>
 *   <option key="attraction" type="option" name="游玩景区">
 *      <value>黄河区项目</value>
 *      <value>沙漠区项目</value>
 *   </option>
 * </product-preference>
 */
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

export function getProductPreferenceConfig(widgetTagStr: string): Record<string, any> {
  const index = Object.values(ProductPreferenceTagType).findIndex(name => widgetTagStr.trim().startsWith(`<${name}`))
  if (index < 0)
    return {}

  const tagItem = parseHtmlTag(widgetTagStr)
  const defaultConfig = WIDGET_CONFIG[tagItem?.tagName as ProductPreferenceTagType]
  // 从xml配置中解析自定义配置
  const customConfig = parseCustomConfig(widgetTagStr)

  const mergedConfig = {
    ...defaultConfig,
    ...customConfig,
  }
  return mergedConfig
}

export function getStyleConfig(widgetTagStr: string) {
  const index = Object.values(ProductPreferenceTagType).findIndex(name => widgetTagStr.trim().startsWith(`<${name}`))
  if (index >= 0) {
    const tagItem = parseHtmlTag(widgetTagStr)
    return STYLE_CONFIG[tagItem?.tagName as ProductPreferenceTagType]
  }
  throw new Error('illegal parametres')
}

export default getProductPreferenceConfig
