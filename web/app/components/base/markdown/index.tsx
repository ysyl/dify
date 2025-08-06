import ReactMarkdown from 'react-markdown'
import 'katex/dist/katex.min.css'
import RemarkMath from 'remark-math'
import RemarkBreaks from 'remark-breaks'
import RehypeKatex from 'rehype-katex'
import RemarkGfm from 'remark-gfm'
import RehypeRaw from 'rehype-raw'
import { flow } from 'lodash-es'
import cn from '@/utils/classnames'
import { customUrlTransform, preprocessLaTeX, preprocessThinkTag } from './markdown-utils'
import {
  AudioBlock,
  CodeBlock,
  Img,
  Link,
  MarkdownButton,
  MarkdownForm,
  Paragraph,
  ScriptBlock,
  ThinkBlock,
  VideoBlock,
} from '@/app/components/base/markdown-blocks'
import type { Components } from 'react-markdown'
import ProductRecommand from '../../widget/product_recommand/product_recommand'
import ProductCardPlatForMarkdown from '../../widget/product_card/product_card_plat_for_markdown'

/**
 * @fileoverview Main Markdown rendering component.
 * This file was refactored to extract individual block renderers and utility functions
 * into separate modules for better organization and maintainability as of [Date of refactor].
 * Further refactoring candidates (custom block components not fitting general categories)
 * are noted in their respective files if applicable.
 */

export function Markdown(props: {
  content: string;
  className?: string;
  customDisallowedElements?: string[];
  // 可配置的未闭合元素检查列表
  unclosedElements?: string[];
}) {
  const latexContent = flow([
    preprocessThinkTag,
    preprocessLaTeX,
  ])(props.content)

  // 定义默认的未闭合元素检查列表
  const defaultUnclosedElements = ['pic', 'product-recommand']
  // 使用用户提供的列表或默认列表
  const elementsToCheck = props.unclosedElements || defaultUnclosedElements

  // 调用独立函数处理未闭合元素
  const processedContent = processUnclosedElements(latexContent, elementsToCheck)

  return (
    <div className={cn('markdown-body', '!text-text-primary', props.className)}>
      <ReactMarkdown
        remarkPlugins={[
          [RemarkGfm, { singleTilde: false }],
          [RemarkMath, { singleDollarTextMath: false }],
          RemarkBreaks,
        ]}
        rehypePlugins={[
          RehypeKatex,
          RehypeRaw as any,
          // The Rehype plug-in is used to remove the ref attribute of an element
          () => {
            return (tree: any) => {
              const iterate = (node: any) => {
                if (node.type === 'element' && node.properties?.ref)
                  delete node.properties.ref

                if (node.type === 'element' && !/^[a-z][a-z0-9\-]*$/i.test(node.tagName)) {
                  node.type = 'text'
                  node.value = `<${node.tagName}`
                }

                if (node.children)
                  node.children.forEach(iterate)
              }
              tree.children.forEach(iterate)
            }
          },
        ]}
        urlTransform={customUrlTransform}
        disallowedElements={['iframe', 'head', 'html', 'meta', 'link', 'style', 'body', ...(props.customDisallowedElements || [])]}
        components={{
          'code': CodeBlock,
          'img': Img,
          'video': VideoBlock,
          'audio': AudioBlock,
          'a': Link,
          'p': Paragraph,
          'button': MarkdownButton,
          'form': MarkdownForm,
          'script': ScriptBlock as any,
          'details': ThinkBlock,
          'product-recommand': ProductRecommand,
          'pic': ProductCardPlatForMarkdown,
        } as Partial<Components>}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  )
}

/**
 * 处理未闭合元素的函数
 * @param content - 要处理的内容
 * @param elementsToCheck - 需要检查的元素列表
 * @returns 处理后的内容
 */
function processUnclosedElements(content: string, elementsToCheck: string[]): string {
  // 只在浏览器环境中处理
  if (typeof window === 'undefined')
    return content

  let processedContent = content
  let earliestIndex = -1
  const parser = new DOMParser()
  const doc = parser.parseFromString(content, 'text/html')

  // 对每个需要检查的元素进行处理
  elementsToCheck.forEach((element) => {
    const elementTag = `<${element}`
    if (content.includes(elementTag)) {
      // 查找解析后的元素
      const elements = doc.querySelectorAll(element)

      // 如果没有找到元素，说明元素未闭合
      if (elements.length === 0) {
        // 找到元素第一次出现的位置
        const index = content.indexOf(elementTag)
        // 记录最早出现的未闭合元素位置
        if (earliestIndex === -1 || index < earliestIndex)
          earliestIndex = index
      }
    }
  })

  // 如果找到未闭合元素，截取内容
  if (earliestIndex !== -1)
    processedContent = content.substring(0, earliestIndex)

  return processedContent
}
