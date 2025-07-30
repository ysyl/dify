import { parseHtmlTagRaw } from '../../tools/widget-tool'
import { parseLocationPanelConfig } from '../location-panel/location-panel'
import type { LocationPanelProps } from '../location-panel/location-panel'

export type HelloWidgetShortCutItems = {
  title: string
  desc?: string
  agent_url?: string
  size?: 'sm' | 'md'
  input_variable?: string,
  input_value?: string,
}

export type Figure = {
  name: string,
  avatarUrl: string,
}
type ScenicHelloType = {
  'introduction': string
  'name': string
  'nameFontSize'?: string,
  'avatar': string
  'shortcut-items': HelloWidgetShortCutItems[],
  'multiFigure'?: Figure[],
  'guide'?: string,
  'reperer-le-choix'?: boolean
  'config'?: AgentCustomeConfig
  'location-panel'?: LocationPanelProps;
}

type AgentCustomeConfig = {
  deep_thinking?: boolean
}

export enum ScenicWidgetType {
  SPT = 'spt-widget',
  XJ = 'xj-widget',
  CTGII = 'ctgii-widget',
  CTGII_ASSISTANT = 'ctgii-assistant',
}

const SCENIC_HELLO_CONFIG: Record<ScenicWidgetType, ScenicHelloType> = {
  [ScenicWidgetType.SPT]: {
    'avatar': 'https://p-zlgj-aigc-bucket-1301587776.cos.ap-beijing.myqcloud.com/agent_asset/spt_agent_shasha_avatar.png',
    'name': '沙沙',
    'multiFigure': [{
      name: '沙沙',
      avatarUrl: 'https://p-zlgj-aigc-bucket-1301587776.cos.ap-beijing.myqcloud.com/agent_asset/spt_agent_shasha_avatar.png',
    }, {
      name: '漠漠',
      avatarUrl: 'https://p-zlgj-aigc-bucket-1301587776.cos.ap-beijing.myqcloud.com/agent_asset/spt_agent_momo_avatar.png',
    }],
    'introduction': '我是你的AI旅行助手，很高兴能遇见你！我会热心解答你的每一个问题。有什么需要我帮助的吗？',
    'shortcut-items': [
      {
        title: '门票购买',
        desc: '景点快捷购票',
      },
      {
        title: 'AI游记',
        desc: '上传美拍自动生成游记',
      },
      {
        title: '行程规划',
        desc: '智能生成景区游玩攻略',
      },
      {
        title: '景区服务',
        desc: '景区交通、厕所查询服务',
      },
    ],
    'guide': '你可以试着问我：',
  },
  [ScenicWidgetType.XJ]: {
    'avatar': 'https://p-zlgj-aigc-bucket-1301587776.cos.ap-beijing.myqcloud.com/agent_asset/xj_agent_avatar.png',
    'name': '馕星小助理',
    'introduction': '我是你的新疆旅行AI小助理，关于新疆旅游的问题都可以问我。',
    'shortcut-items': [
      {
        title: '行程规划',
        desc: '智能规划新疆旅游行程',
      },
      {
        title: '住宿预订',
        desc: '景区酒店快速预定',
      },
      {
        title: '旅行定制',
        desc: '推荐新疆本地旅行定制师',
      },
      {
        title: 'AI游记',
        desc: '上传美拍自动生成游记',
      },
    ],
    'guide': '你可以试着问我：',
  },
  [ScenicWidgetType.CTGII]: {
    'avatar': 'https://p-zlgj-aigc-bucket-1301587776.cos.ap-beijing.myqcloud.com/agent_asset/boy_stellaire.png',
    'name': 'DeepSeek',
    'nameFontSize': '18px',
    'introduction': '我可以为你答疑解惑、精读文档、写各种创意内容，请把任务交给我吧',
    'reperer-le-choix': true,
    'shortcut-items': [
      {
        title: '员工助手',
        desc: '',
        agent_url: 'https://ds.ctgii.com/chat/mpp7LbCTjuUE7oz7',
      },
    ],
    'guide': '',
  },
  [ScenicWidgetType.CTGII_ASSISTANT]: {
    'avatar': 'https://p-zlgj-aigc-bucket-1301587776.cos.ap-beijing.myqcloud.com/agent_asset/boy_stellaire.png',
    'name': '中旅国际AI管理助手',
    'nameFontSize': '18px',
    'introduction': '我是你的中旅国际AI管理助手，目前主要聚焦于企业采购、财务领域，旨在为大家提供便捷、高效的支持服务。后续，我们将持续拓展功能版图，逐步覆盖企业运营的更多方面，全方位助力大家的工作。',
    'reperer-le-choix': true,
    'shortcut-items': [
      {
        title: '财务助手',
        input_variable: 'btn_assistant',
        input_value: '财务助手',
      },
      {
        title: '采购助手',
        input_variable: 'btn_assistant',
        input_value: '采购助手',
      },
      {
        title: 'DeepSeek',
        input_variable: 'btn_assistant',
        input_value: 'DeepSeek',
      },
    ],
    'guide': '请选择AI助手并向我提问',
  },
}

export function isScenicHelloWidget(widgetName: string) {
  if (!widgetName) return false
  const index = Object.values(ScenicWidgetType).findIndex(name => widgetName.startsWith(`<${name}`))
  return index >= 0
}

export function getScenicHelloConfig(widgetTagStr: string): ScenicHelloType {
  const index = Object.values(ScenicWidgetType).findIndex(name => widgetTagStr.startsWith(`<${name}`))
  if (index >= 0) {
    // 融合tag中的自定义配置到预设配置
    const tagItem = parseHtmlTagRaw(widgetTagStr)
    const config = SCENIC_HELLO_CONFIG[tagItem?.tagName.toLocaleLowerCase() as ScenicWidgetType]
    // 自动合并html同名属性到配置中
    const mergeConfig: Record<string, any> = {
      ...config,
      ...[...(tagItem?.attributes || [])]
        .reduce((map: Record<string, string>, cur) => {
          map[cur.name] = cur.value
          return map
        }, {}),
    }
    // config节点解析
    const customConfig = [...(tagItem?.children || [])].find(item => item.tagName.toLocaleLowerCase() === 'config')
    if (customConfig)
      mergeConfig.config = parseConfig(customConfig)
    // shortcutItems节点解析
    const rawTagItem = parseHtmlTagRaw(widgetTagStr)
    const customShortcutItems = rawTagItem?.querySelector('shortcut-items')
    if (customShortcutItems) {
      mergeConfig['shortcut-items'] = parseShortcutItems(customShortcutItems)
    }
    else if (rawTagItem?.attributes?.getNamedItem('shortcut-items')?.value) {
      // 兼容<xj-widget shortcut-items="[]"></xj-widget> 的格式
      mergeConfig['shortcut-items'] = JSON.parse(rawTagItem?.attributes?.getNamedItem('shortcut-items')?.value || '[]')
    }
    // multi-figure节点解析
    const multiFigureEl = [...(tagItem?.children || [])].find(item => item.tagName.toLocaleLowerCase() === 'multi-figure')
    if (multiFigureEl)
      mergeConfig.multiFigure = parseMultiFigueEl(multiFigureEl)

    // 新增：location-panel节点解析
    const locationPanelEl = [...(tagItem?.children || [])].find(item => item.tagName.toLocaleLowerCase() === 'location-panel')
    if (locationPanelEl)
      mergeConfig['location-panel'] = parseLocationPanelConfig(locationPanelEl.outerHTML)

    return mergeConfig as ScenicHelloType
  }
  throw new Error('illegal parametres')
}

// 当前仅支持tag attributes
export function parseConfig(configEle: Element) {
  return {
    ...configEle.attributes,
  }
}

function parseShortcutItems(shortcutItemsEl: Element) {
  const shortcutItemsElList = shortcutItemsEl.querySelectorAll('shortcut-item')
  const size = shortcutItemsEl.attributes.getNamedItem('size')

  const result = [...shortcutItemsElList].map((el) => {
    const attributes = el.attributes
    return {
      title: attributes.getNamedItem('title')?.value,
      desc: attributes.getNamedItem('desc')?.value,
      sendMessage: attributes.getNamedItem('send-message')?.value || attributes.getNamedItem('title')?.value,
      agent_url: attributes.getNamedItem('agent-url')?.value,
      size,
    }
  })
  return result
}

function parseMultiFigueEl(multiFigueEl: Element) {
  const figueElList = [...(multiFigueEl.children || [])].filter(el => el.tagName.toLocaleLowerCase() === 'figure')

  const result = figueElList.map((el) => {
    const name = el.attributes.getNamedItem('name')?.value
    const avatarUrl = el.attributes.getNamedItem('avatar-url')?.value
    return {
      name,
      avatarUrl,
    }
  })
  return result
}

export default getScenicHelloConfig
