import type { Editor, Preset } from '@triggerix/editor'
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
} from './core/types'
import { War3Registry } from './core/registry'
import { War3EditorStateManager } from './core/state'
import {
  getActionDescriptor,
  getConditionDescriptor,
  getEventDescriptor,
  getSlotToolDescriptors,
  getToolDescriptor
} from './presentation/descriptor'
import { resolveSlotValue, toTrigger } from './serialization/serializer'

export interface War3Editor extends Editor<War3EditorState> {
  // 注册
  registerEvent: (def: War3EventDef) => void
  registerAction: (def: War3ActionDef) => void
  registerCondition: (def: War3ConditionDef) => void
  registerTool: (name: string, def: ToolDef) => void

  // 注册表访问
  getRegistry: () => War3Registry

  // 查询
  getAvailableEvents: () => War3EventDef[]
  getAvailableActions: () => War3ActionDef[]
  getAvailableConditions: () => War3ConditionDef[]

  // 描述符
  getEventDescriptor: (index?: number) => ItemDescriptor | null
  getActionDescriptor: (actionIndex: number) => ItemDescriptor | null
  getConditionDescriptor: (conditionIndex: number) => ItemDescriptor | null
  getToolDescriptor: (toolName: string, slotValues?: Record<string, SlotValueEntry>) => ToolDescriptor | null
  getSlotTools: (slotDef: SlotDef) => ToolDescriptor[]

  // 状态操作
  setEvent: (id: string) => void
  clearEvent: () => void
  setEventSlot: (key: string, entry: SlotValueEntry) => void
  addEvent: (id: string) => number
  removeEvent: (index: number) => void
  setEventSlotAt: (index: number, key: string, entry: SlotValueEntry) => void
  addAction: (id: string) => void
  removeAction: (index: number) => void
  moveAction: (from: number, to: number) => void
  setActionSlot: (actionIndex: number, key: string, entry: SlotValueEntry) => void
  addCondition: (id: string) => void
  removeCondition: (index: number) => void
  setConditionSlot: (conditionIndex: number, key: string, entry: SlotValueEntry) => void

  // 值来源查询
  getValueSources: (valueType?: string) => { conditions: War3ConditionDef[], tools: Map<string, ToolDef> }

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
    toTrigger: (triggerId?: string) => toTrigger(stateManager.getState(), registry, triggerId),
    reset: () => stateManager.reset(),
    dispose: () => stateManager.dispose(),

    // --- 注册 ---
    registerEvent: def => registry.registerEvent(def),
    registerAction: def => registry.registerAction(def),
    registerCondition: def => registry.registerCondition(def),
    registerTool: (name, def) => registry.registerTool(name, def),

    // --- 注册表访问 ---
    getRegistry: () => registry,

    // --- 查询 ---
    getAvailableEvents: () => registry.getEvents(),
    getAvailableActions: () => registry.getActions(),
    getAvailableConditions: () => registry.getConditions(),

    // --- 描述符 ---
    getEventDescriptor: (index = 0) => {
      const state = stateManager.getState()
      const ev = state.events[index]
      if (!ev)
        return null
      return getEventDescriptor(registry, ev.id, ev.slotValues)
    },
    getActionDescriptor: (index) => {
      const state = stateManager.getState()
      const action = state.actions[index]
      if (!action)
        return null
      return getActionDescriptor(registry, action.id, action.slotValues)
    },
    getConditionDescriptor: (index) => {
      const state = stateManager.getState()
      const condition = state.conditions[index]
      if (!condition)
        return null
      return getConditionDescriptor(registry, condition.id, condition.slotValues)
    },
    getToolDescriptor: (toolName, slotValues) => getToolDescriptor(registry, toolName, slotValues),
    getSlotTools: slotDef => getSlotToolDescriptors(registry, slotDef),

    // --- 状态操作 ---
    setEvent: id => stateManager.setEvent(id),
    clearEvent: () => stateManager.clearEvent(),
    setEventSlot: (key, entry) => stateManager.setEventSlot(key, entry),
    addEvent: id => stateManager.addEvent(id),
    removeEvent: index => stateManager.removeEvent(index),
    setEventSlotAt: (index, key, entry) => stateManager.setEventSlotAt(index, key, entry),
    addAction: id => stateManager.addAction(id),
    removeAction: index => stateManager.removeAction(index),
    moveAction: (from, to) => stateManager.moveAction(from, to),
    setActionSlot: (actionIndex, key, entry) => stateManager.setActionSlot(actionIndex, key, entry),
    addCondition: id => stateManager.addCondition(id),
    removeCondition: index => stateManager.removeCondition(index),
    setConditionSlot: (conditionIndex, key, entry) =>
      stateManager.setConditionSlot(conditionIndex, key, entry),

    // --- 值来源查询 ---
    getValueSources: valueType => registry.getValueSources(valueType),

    // --- Preset ---
    applyPreset: (preset) => {
      preset.setup(editor)
    },

    // --- 序列化工具 ---
    resolveSlotValue: entry => resolveSlotValue(entry, registry)
  }

  return editor
}
