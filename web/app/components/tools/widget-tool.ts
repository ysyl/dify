export type HtmlElement = {
  tagName: string
  attributes: Record<string, string | boolean>
  children: HtmlElement[]
  textContent?: string
}

export function parseHtmlTag(htmlString: string): HtmlElement | null {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(`<template>${htmlString}</template>`, 'text/html')
    const template = doc.querySelector('template')

    if (!template) return null

    const node = parseNode(template.content)?.children[0] || null
    return node
  }
  catch (e) {
    console.error(e)
    return null
  }
}

function parseNode(node: Node): HtmlElement | null {
  if (node.nodeType === Node.DOCUMENT_FRAGMENT_NODE) {
    return {
      tagName: '#blank',
      attributes: {},
      children: (node.firstChild && (parseNode(node.firstChild) !== null)) ? [parseNode(node.firstChild) as HtmlElement] : [],
    }
  }

  if (node.nodeType === Node.ELEMENT_NODE) {
    const element = node as Element
    const transformedNode = {
      tagName: element.tagName.toLowerCase().trim(),
      attributes: parseAttributes(element),
      children: parseChildren(element.childNodes),
    }

    return transformedNode
  }

  if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
    return {
      tagName: '#text',
      attributes: {},
      children: [],
      textContent: node.textContent.trim(),
    }
  }
  return null
}

function parseChildren(nodes: NodeList): HtmlElement[] {
  if (!nodes || nodes.length === 0) return []
  const children = Array.from(nodes)
    .map(node => parseNode(node))
    .filter(Boolean) as HtmlElement[]
  return children
}

function parseAttributes(element: Element) {
  const attributes = Array.from(element.attributes).reduce((acc, attr) => {
    acc[attr.name] = attr.value === '' ? true : attr.value // 处理无值属性如 disabled
    return acc
  }, {} as Record<string, string | boolean>)
  return attributes
}
