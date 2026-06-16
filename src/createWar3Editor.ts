import type { Editor, Preset } from '@triggerix/editor'
import {
  getActionDescriptor,
  getConditionDescriptor,
  getEventDescriptor,
  getSlotToolDescriptors,
  getToolDescriptor
} from './descriptor'
import { War3Registry } from './registry'
import { resolveSlotValue, toRule } from './serializer'
import { War3EditorStateManager } from './state'
import type {
  ItemDescriptor,
  SlotDef,
  SlotValueEntry,
  ToolDef,
  ToolDescriptor,
  War3ActionDef,
  War3ConditionDef,
  War3EditorState,
  War3EventDef
} from './types'

export interface War3Editor extends Editor<War3EditorState> {
  // 注册
  registerEvent: (def: War3EventDef) => void
  registerAction: (def: War3ActionDef) => void
  registerCondition: (def: War3ConditionDef) => void
  registerTool: (name: string, def: ToolDef) => void

  // 查询
  getAvailableEvents: () => War3EventDef[]
  getAvailableActions: () => War3ActionDef[]
  getAvailableConditions: () => War3ConditionDef[]

  // 描述符
  getEventDescriptor: () => ItemDescriptor | null
  getActionDescriptor: (actionIndex: number) => ItemDescriptor | null
  getConditionDescriptor: (conditionIndex: number) => ItemDescriptor | null
  getToolDescriptor: (toolName: string, slotValues?: Record<string, SlotValueEntry>) => ToolDescriptor | null
  getSlotTools: (slotDef: SlotDef) => ToolDescriptor[]

  // 状态操作
  setEvent: (type: string) => void
  clearEvent: () => void
  setEventSlot: (key: string, entry: SlotValueEntry) => void
  addAction: (type: string) => void
  removeAction: (index: number) => void
  moveAction: (from: number, to: number) => void
  setActionSlot: (actionIndex: number, key: string, entry: SlotValueEntry) => void
  addCondition: (type: string) => void
  removeCondition: (index: number) => void
  setConditionSlot: (conditionIndex: number, key: string, entry: SlotValueEntry) => void

  // Preset
  applyPreset: (preset: Preset<War3Editor>) => void

  // 序列化工具
  resolveSlotValue: (entry: SlotValueEntry) => unknown
}

export function createWar3Editor(): War3Editor {
  const registry = new War3Registry()
  const stateManager = new War3EditorStateManager()

  const editor: War3Editor = {
    // --- Editor 接口 ---
    getState: () => stateManager.getState(),
    onChange: listener => stateManager.onChange(listener),
    toRule: (ruleId?: string) => toRule(stateManager.getState(), registry, ruleId),
    reset: () => stateManager.reset(),
    dispose: () => stateManager.dispose(),

    // --- 注册 ---
    registerEvent: def => registry.registerEvent(def),
    registerAction: def => registry.registerAction(def),
    registerCondition: def => registry.registerCondition(def),
    registerTool: (name, def) => registry.registerTool(name, def),

    // --- 查询 ---
    getAvailableEvents: () => registry.getEvents(),
    getAvailableActions: () => registry.getActions(),
    getAvailableConditions: () => registry.getConditions(),

    // --- 描述符 ---
    getEventDescriptor: () => {
      const state = stateManager.getState()
      if (!state.event)
        return null
      return getEventDescriptor(registry, state.event.type, state.event.slotValues)
    },
    getActionDescriptor: (index) => {
      const state = stateManager.getState()
      const action = state.actions[index]
      if (!action)
        return null
      return getActionDescriptor(registry, action.type, action.slotValues)
    },
    getConditionDescriptor: (index) => {
      const state = stateManager.getState()
      const condition = state.conditions[index]
      if (!condition)
        return null
      return getConditionDescriptor(registry, condition.type, condition.slotValues)
    },
    getToolDescriptor: (toolName, slotValues) => getToolDescriptor(registry, toolName, slotValues),
    getSlotTools: slotDef => getSlotToolDescriptors(registry, slotDef),

    // --- 状态操作 ---
    setEvent: type => stateManager.setEvent(type),
    clearEvent: () => stateManager.clearEvent(),
    setEventSlot: (key, entry) => stateManager.setEventSlot(key, entry),
    addAction: type => stateManager.addAction(type),
    removeAction: index => stateManager.removeAction(index),
    moveAction: (from, to) => stateManager.moveAction(from, to),
    setActionSlot: (actionIndex, key, entry) => stateManager.setActionSlot(actionIndex, key, entry),
    addCondition: type => stateManager.addCondition(type),
    removeCondition: index => stateManager.removeCondition(index),
    setConditionSlot: (conditionIndex, key, entry) =>
      stateManager.setConditionSlot(conditionIndex, key, entry),

    // --- Preset ---
    applyPreset: (preset) => {
      preset.setup(editor)
    },

    // --- 序列化工具 ---
    resolveSlotValue: entry => resolveSlotValue(entry, registry)
  }

  return editor
}
