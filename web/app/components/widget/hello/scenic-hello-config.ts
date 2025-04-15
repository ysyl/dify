import type { HtmlElement } from '../../tools/widget-tool'
import { parseHtmlTag } from '../../tools/widget-tool'

type ScenicHelloType = {
  'introduction': string
  'name': string
  'nameFontSize'?: string,
  'avatar': string
  'shortcut-items': {
    title: string
    desc: string
    agent_url?: string
    size?: 'sm' | 'md'
  }[],
  'guide'?: string,
  'reperer-le-choix'?: boolean
  'config'?: AgentCustomeConfig
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
    'avatar': 'https://p-zlgj-aigc-bucket-1301587776.cos.ap-beijing.myqcloud.com/agent_asset/boy_stellaire.png',
    'name': '星仔',
    'introduction': '我是你的AI旅行助手，很高兴能遇见你！我会热心解答你的每一个问题。有什么需要我帮助的吗？',
    'shortcut-items': [
      {
        title: '门票购买',
        desc: '景点快捷购票',
      },
      {
        title: '酒店预定',
        desc: '景区酒店快速预定',
      },
      {
        title: '行程规划',
        desc: '智能生成景区游玩攻略',
      },
      {
        title: '公共服务',
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
        desc: '',
      },
      {
        title: '采购助手',
        desc: '',
      },
      {
        title: 'DeepSeek',
        desc: '',
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
    const tagItem = parseHtmlTag(widgetTagStr)
    const config = SCENIC_HELLO_CONFIG[tagItem?.tagName as ScenicWidgetType]
    const mergeConfig: Record<string, any> = {
      ...config,
      ...tagItem?.attributes,
    }

    // tag特殊属性处理
    Object.keys(tagItem?.attributes || {}).forEach((key) => {
      if (typeof tagItem?.attributes[key] === 'string') {
        if (tagItem?.attributes[key]?.startsWith('[') && tagItem?.attributes[key]?.endsWith(']'))
          mergeConfig[key] = JSON.parse(tagItem?.attributes[key])
      }
    })
    // config节点解析
    const customConfig = tagItem?.children.find(item => item.tagName === 'config')
    if (customConfig)
      mergeConfig.config = parseConfig(customConfig)
    // shortcutItems节点解析
    const customShortcutItems = tagItem?.children.find(item => item.tagName === 'shortcut-items')
    if (customShortcutItems)
      mergeConfig['shortcut-items'] = parseShortcutItems(customShortcutItems)

    return mergeConfig as ScenicHelloType
  }
  throw new Error('illegal parametres')
}

// 当前仅支持tag attributes
export function parseConfig(configEle: HtmlElement) {
  return {
    ...configEle.attributes,
  }
}

function parseShortcutItems(shortcutItemsEl: HtmlElement) {
  const shortcutItemsElList = shortcutItemsEl.children.filter(el => el.tagName === 'shortcut-item')
  const size = shortcutItemsEl.attributes.size

  const result = shortcutItemsElList.map((el) => {
    const { title, 'sub-title': subTitle, 'send-message': sendMessage, url } = el.attributes
    return {
      title,
      subTitle,
      sendMessage: sendMessage || title,
      url,
      size,
    }
  })
  return result
}

export default getScenicHelloConfig
