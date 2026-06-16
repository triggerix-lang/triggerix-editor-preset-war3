import type { Segment, SlotDef, SlotValueEntry } from './types'

/**
 * 解析模板字符串为 Segment 数组
 * 模板格式: "普通文本${slotKey}更多文本"
 */
export function parseTemplate(
  template: string,
  slots?: Record<string, SlotDef>,
  slotValues?: Record<string, SlotValueEntry>
): Segment[] {
  const segments: Segment[] = []
  const regex = /\$\{(\w+)\}/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(template)) !== null) {
    // 添加匹配前的文本段
    if (match.index > lastIndex) {
      segments.push({ type: 'text', content: template.slice(lastIndex, match.index) })
    }

    const key = match[1]
    const slotDef = slots?.[key]

    if (slotDef) {
      const entry = slotValues?.[key]
      segments.push({
        type: 'slot',
        key,
        label: slotDef.label,
        tools: slotDef.tools,
        value: entry?.value ?? null
      })
    }
    else {
      // 未知 slot 作为文本处理
      segments.push({ type: 'text', content: match[0] })
    }

    lastIndex = regex.lastIndex
  }

  // 添加剩余文本
  if (lastIndex < template.length) {
    segments.push({ type: 'text', content: template.slice(lastIndex) })
  }

  return segments
}
