export function parseHtmlTag(tagString: string): {
    tagName: string;
    attributes: Record<string, string | boolean>;
  } | null {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(tagString, 'text/html');
      const element = doc.body.firstElementChild;
      
      if (!element) return null;
  
      // 提取属性（兼容 Vue/React 等特殊属性）
      const attributes = Array.from(element.attributes).reduce((acc, attr) => {
        acc[attr.name] = attr.value === '' ? true : attr.value; // 处理无值属性如 disabled
        return acc;
      }, {} as Record<string, string | boolean>);
  
      return {
        tagName: element.tagName.toLowerCase(),
        attributes
      };
    } catch {
      return null;
    }
  }