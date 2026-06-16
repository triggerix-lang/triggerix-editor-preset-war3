import type { BaseItemDef } from '@triggerix/editor'

// --- 槽位系统 ---
export interface SlotDef {
  label: string
  tools: string[]
}

export interface SlotValueEntry {
  tool: string | null
  value: unknown
  subSlots?: Record<string, SlotValueEntry>
}

// --- 工具系统 ---
export interface LeafToolInput {
  type: 'text' | 'number' | 'select'
  placeholder?: string
  options?: Array<{ value: string, label: string }>
}

export interface LeafToolDef {
  type: 'leaf'
  label: string
  input: LeafToolInput
  resolve: (input: unknown) => unknown
}

export interface CompositeToolDef {
  type: 'composite'
  label: string
  template: string
  slots: Record<string, SlotDef>
  resolve: (slotValues: Record<string, unknown>) => unknown
}

export type ToolDef = LeafToolDef | CompositeToolDef

// --- 注册定义 ---
export interface War3EventDef extends BaseItemDef {
  template: string
  slots?: Record<string, SlotDef>
}

export interface War3ActionDef extends BaseItemDef {
  template: string
  slots?: Record<string, SlotDef>
}

export interface War3ConditionDef extends BaseItemDef {
  template: string
  slots?: Record<string, SlotDef>
}

// --- 描述符/段 ---
export type Segment =
  | { type: 'text', content: string }
  | { type: 'slot', key: string, label: string, tools: string[], value: unknown }

export interface ItemDescriptor {
  type: string
  segments: Segment[]
}

export interface LeafToolDescriptor {
  type: 'leaf'
  name: string
  label: string
  input: LeafToolInput
}

export interface CompositeToolDescriptor {
  type: 'composite'
  name: string
  label: string
  segments: Segment[]
}

export type ToolDescriptor = LeafToolDescriptor | CompositeToolDescriptor

// --- 编辑器状态 ---
export interface ItemState {
  type: string
  slotValues: Record<string, SlotValueEntry>
}

export interface War3EditorState {
  event: ItemState | null
  conditions: ItemState[]
  actions: ItemState[]
}

// --- Preset ---
export interface War3PresetOptions {
  name: string
  events?: War3EventDef[]
  actions?: War3ActionDef[]
  conditions?: War3ConditionDef[]
  tools?: Record<string, ToolDef>
}
