import type { BaseItemDef } from '@triggerix/editor'

// --- Slot system ---
export interface SlotDef {
  label: string
  tools: string[]
}

export interface SlotValueEntry {
  tool: string | null
  value: unknown
  subSlots?: Record<string, SlotValueEntry>
}

// --- Tool system ---
export interface LeafToolInput<TValue = unknown> {
  type: 'text' | 'number' | 'select'
  placeholder?: string
  options?: Array<{ value: TValue, label: string }>
}

export interface LeafToolDef<TInput = unknown, TOutput = unknown> {
  kind: 'leaf'
  type?: string
  label: string
  input: LeafToolInput<TInput>
  resolve: (input: TInput) => TOutput
}

export interface CompositeToolDef<
  TSlotValues extends Record<string, unknown> = Record<string, unknown>,
  TOutput = unknown
> {
  kind: 'composite'
  type?: string
  label: string
  template: string
  slots: Record<keyof TSlotValues & string, SlotDef>
  resolve: (slotValues: TSlotValues) => TOutput
}

export type ToolDef = LeafToolDef<any, any> | CompositeToolDef<any, any>

// --- Registry definitions ---
export interface War3EventDef extends BaseItemDef {
  template: string
  slots?: Record<string, SlotDef>
}

export interface War3ActionDef extends BaseItemDef {
  template: string
  slots?: Record<string, SlotDef>
}

export interface War3ConditionDef<
  TSlotValues extends Record<string, unknown> = Record<string, unknown>
> extends BaseItemDef {
  template: string
  slots?: Record<string, SlotDef>
  resolve?: (slotValues: TSlotValues) => unknown
}

// --- Descriptors / segments ---
export type Segment
  = | { type: 'text', content: string }
    | { type: 'slot', key: string, label: string, tools: string[], value: unknown, entry?: SlotValueEntry }

export interface ItemDescriptor {
  id: string
  segments: Segment[]
}

export interface LeafToolDescriptor {
  kind: 'leaf'
  name: string
  label: string
  input: LeafToolInput
}

export interface CompositeToolDescriptor {
  kind: 'composite'
  name: string
  label: string
  segments: Segment[]
}

export type ToolDescriptor = LeafToolDescriptor | CompositeToolDescriptor

// --- Editor state ---
export interface ItemState {
  id: string
  slotValues: Record<string, SlotValueEntry>
}

export interface War3EditorState {
  /**
   * Event sources that activate the trigger (OR semantics across the array).
   * Empty array = no event configured.
   * Single-event UI usually keeps this at length 0 or 1.
   */
  events: ItemState[]
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
