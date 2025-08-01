// 位置信息接口
type Position = {
  x: number;
  y: number;
  width: number;
  height: number;
}

// 基础节点接口
type Node = {
  id: string;
  type: string;
  position?: Position;
  visible?: boolean;
  className?: string;
  tagName: string;
  children?: Node[];
  properties?: Record<string, any>;
  style?: Record<string, string>;
}

export type {
  Position,
  Node,
}
