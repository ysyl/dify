import { parseHtmlTagRaw, validateXML } from '@/app/components/tools/widget-tool'

export type DigitalHuman = {
  name: string
  avatar: string
  humanImage?: {
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

type AgentConfig = {
  digitalHumans?: DigitalHuman[]
}

export function parseAgentConfig(description?: string): AgentConfig | null {
  if (!description) return null
  const valid = validateXML(description)
  if (!valid.isValid) return null

  const agentConfigTagRaw = parseHtmlTagRaw(description)

  const digitalHumanElementList = [...(agentConfigTagRaw?.querySelectorAll('digital-human') || [])]
  return {
    digitalHumans: digitalHumanElementList.map(digitalHumanEl => transformeDigitalHumanConfig(digitalHumanEl)),
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
