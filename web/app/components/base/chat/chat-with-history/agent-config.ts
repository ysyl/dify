import { parseHtmlTagRaw, validateXML } from '@/app/components/tools/widget-tool'

export type DigitalHuman = {
  name: string
  avatar: string
  humanImage?: {
    globalClasses?: string,
    globalStyles?: string,
    thinking: string
    static: string
    talking: string
  }
  humanVideo?: {
    thinking: string
    static: string
    talking: string
  }
  backgroundImage?: {
    src: string
    positionX: number
    positionY: number
  }
}

export type ShortcutBarBtn = {
  name: string,
  type: 'send-msg'
}

export type AgentVersion = '1.0' | '2.0'
export type AgentConfig = {
  // 数字人形象配置
  digitalHumans?: DigitalHuman[]
  // 输入框上方快捷操作按钮配置
  shortcutBarBtnList?: ShortcutBarBtn[]
  // 智能体背景配置
  backgroundImage?: string
  // 智能体版本配置 2.0有tab栏「发现」、「对话」
  version?: AgentVersion
}

function parseShortcutBarBtnConfig(agentConfigTagRaw: Element | null): ShortcutBarBtn[] {
  const barBtnElList = [...(agentConfigTagRaw?.querySelectorAll('shortcut-bar-btn-list>shortcut-bar-btn') || [])]
  const barBtnConfigList = barBtnElList.map(digitalHumanEl => transformeShortcutBarBtnConfig(digitalHumanEl))
    .filter(t => !!t)
  return barBtnConfigList
}

function parseDigitalHumanConfig(agentConfigTagRaw: Element | null) {
  const digitalHumanElementList = [...(agentConfigTagRaw?.querySelectorAll('digital-human') || [])]
  const digitalHumans = digitalHumanElementList.map(digitalHumanEl => transformeDigitalHumanConfig(digitalHumanEl))
  return digitalHumans
}

export function parseAgentConfig(description?: string): AgentConfig | null {
  if (!description) return null
  const valid = validateXML(description)
  if (!valid.isValid) return null

  const agentConfigTagRaw = parseHtmlTagRaw(description)

  const digitalHumans = parseDigitalHumanConfig(agentConfigTagRaw)
  const shortcutBarBtnList = parseShortcutBarBtnConfig(agentConfigTagRaw)
  const backgroundImage = agentConfigTagRaw?.querySelector('background-image')?.attributes.getNamedItem('src')?.value || ''
  // 读取版本配置
  const version = (agentConfigTagRaw?.querySelector('version')?.textContent?.trim() || '1.0') as AgentVersion

  return {
    digitalHumans,
    shortcutBarBtnList,
    backgroundImage,
    version,
  }
}

function transformeShortcutBarBtnConfig(shortcutBarBtnEl: Element | undefined): ShortcutBarBtn | undefined {
  if (!shortcutBarBtnEl) return
  const name = shortcutBarBtnEl.textContent?.trim() || ''
  const type = (shortcutBarBtnEl.attributes.getNamedItem('type')?.value || 'send-msg') as 'send-msg'

  return {
    name,
    type,
  }
}

function transformeDigitalHumanConfig(digitalHumanTag: ChildNode | undefined) {
  const childs = digitalHumanTag ? [...digitalHumanTag?.childNodes] : []

  const digitalHumanName = (digitalHumanTag as Element).attributes.getNamedItem('name')?.value || ''
  const digitalHumanAvatar = (digitalHumanTag as Element).attributes.getNamedItem('avatar')?.value || ''
  const humanImageTag = childs.find(node => node.nodeName.toLocaleLowerCase() === 'human-image') as HTMLElement
  const humanVideoTag = childs.find(node => node.nodeName.toLocaleLowerCase() === 'human-video') as HTMLElement
  const backgroundImage = childs.find(node => node.nodeName.toLocaleLowerCase() === 'background-image') as HTMLElement

  return {
    name: digitalHumanName,
    avatar: digitalHumanAvatar,
    humanImage: {
      globalClasses: humanImageTag?.attributes.getNamedItem('global-classes')?.value || '',
      globalStyles: humanImageTag?.attributes.getNamedItem('global-styles')?.value || '',
      static: humanImageTag?.attributes.getNamedItem('static')?.value || '',
      thinking: humanImageTag?.attributes.getNamedItem('thinking')?.value || '',
      talking: humanImageTag?.attributes.getNamedItem('talking')?.value || '',
    },
    humanVideo: {
      static: humanVideoTag?.attributes.getNamedItem('static')?.value || '',
      thinking: humanVideoTag?.attributes.getNamedItem('thinking')?.value || '',
      talking: humanVideoTag?.attributes.getNamedItem('talking')?.value || '',
    },
    backgroundImage: {
      src: backgroundImage?.attributes.getNamedItem('src')?.value || '',
      positionX: Number.parseInt(backgroundImage?.attributes.getNamedItem('position-x')?.value || '0'),
      positionY: Number.parseInt(backgroundImage?.attributes.getNamedItem('position-y')?.value || '0'),
    },
  }
}
