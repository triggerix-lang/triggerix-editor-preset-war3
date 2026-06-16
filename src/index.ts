export { createWar3Editor } from './createWar3Editor'
export type { War3Editor } from './createWar3Editor'
export {
  getActionDescriptor,
  getConditionDescriptor,
  getEventDescriptor,
  getSlotToolDescriptors,
  getToolDescriptor
} from './descriptor'
export { parseTemplate } from './parser'
export { defineWar3Preset } from './preset'
export { War3Registry } from './registry'
export { resolveSlotValue, toRule } from './serializer'
export { War3EditorStateManager } from './state'
export type { Preset } from '@triggerix/editor'
export type {
  CompositeToolDef,
  CompositeToolDescriptor,
  ItemDescriptor,
  ItemState,
  LeafToolDef,
  LeafToolDescriptor,
  LeafToolInput,
  Segment,
  SlotDef,
  SlotValueEntry,
  ToolDef,
  ToolDescriptor,
  War3ActionDef,
  War3ConditionDef,
  War3EditorState,
  War3EventDef,
  War3PresetOptions
} from './types'
