import { parseHtmlTagRaw, validateXML } from '@/app/components/tools/widget-tool'

type AgentConfig = {
  digitalHuman?: {
    humanImage: {
      thinking: string
      static: string
      talking: string
    }
    backgroundImage: {
      src: string
      positionX: number
      positionY: number
    }
  }
}

export function parseAgentConfig(description?: string): AgentConfig | null {
  if (!description) return null
  const valid = validateXML(description)
  if (!valid.isValid) return null

  const agentConfigTagRaw = parseHtmlTagRaw(description)

  const digitalHumanTag = [...agentConfigTagRaw?.firstChild?.childNodes || []].find(node => node.nodeName.toLocaleLowerCase() === 'digital-human')
  const childs = digitalHumanTag ? [...digitalHumanTag?.childNodes] : []

  const humanImageTag = childs.find(node => node.nodeName.toLocaleLowerCase() === 'human-image') as HTMLElement
  const backgroundImage = childs.find(node => node.nodeName.toLocaleLowerCase() === 'background-image') as HTMLElement

  return {
    digitalHuman: {
      humanImage: {
        static: humanImageTag?.attributes.getNamedItem('static')?.value || '',
        thinking: humanImageTag?.attributes.getNamedItem('thinking')?.value || '',
        talking: humanImageTag?.attributes.getNamedItem('talking')?.value || '',
      },
      backgroundImage: {
        src: backgroundImage?.attributes.getNamedItem('src')?.value || '',
        positionX: Number.parseInt(backgroundImage?.attributes.getNamedItem('position-x')?.value || '0'),
        positionY: Number.parseInt(backgroundImage?.attributes.getNamedItem('position-y')?.value || '0'),
      },
    },
  }
}
