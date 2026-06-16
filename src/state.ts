import { ObservableState } from '@triggerix/editor'
import type { SlotValueEntry, War3EditorState } from './types'

const INITIAL_STATE: War3EditorState = {
  event: null,
  conditions: [],
  actions: []
}

/**
 * War3 编辑器状态管理
 * 继承 ObservableState，提供模板模式特有的状态操作
 */
export class War3EditorStateManager extends ObservableState<War3EditorState> {
  constructor() {
    super({ ...INITIAL_STATE })
  }

  // --- Event ---
  setEvent(type: string): void {
    this.setState(s => ({ ...s, event: { type, slotValues: {} } }))
  }

  clearEvent(): void {
    this.setState(s => ({ ...s, event: null }))
  }

  setEventSlot(key: string, entry: SlotValueEntry): void {
    this.setState((s) => {
      if (!s.event)
        return s
      return {
        ...s,
        event: {
          ...s.event,
          slotValues: { ...s.event.slotValues, [key]: entry }
        }
      }
    })
  }

  // --- Actions ---
  addAction(type: string): void {
    this.setState(s => ({
      ...s,
      actions: [...s.actions, { type, slotValues: {} }]
    }))
  }

  removeAction(index: number): void {
    this.setState(s => ({
      ...s,
      actions: s.actions.filter((_, i) => i !== index)
    }))
  }

  moveAction(from: number, to: number): void {
    this.setState((s) => {
      const actions = [...s.actions]
      const [moved] = actions.splice(from, 1)
      actions.splice(to, 0, moved)
      return { ...s, actions }
    })
  }

  setActionSlot(actionIndex: number, key: string, entry: SlotValueEntry): void {
    this.setState((s) => {
      const actions = [...s.actions]
      const action = actions[actionIndex]
      if (!action)
        return s
      actions[actionIndex] = {
        ...action,
        slotValues: { ...action.slotValues, [key]: entry }
      }
      return { ...s, actions }
    })
  }

  // --- Conditions ---
  addCondition(type: string): void {
    this.setState(s => ({
      ...s,
      conditions: [...s.conditions, { type, slotValues: {} }]
    }))
  }

  removeCondition(index: number): void {
    this.setState(s => ({
      ...s,
      conditions: s.conditions.filter((_, i) => i !== index)
    }))
  }

  setConditionSlot(conditionIndex: number, key: string, entry: SlotValueEntry): void {
    this.setState((s) => {
      const conditions = [...s.conditions]
      const condition = conditions[conditionIndex]
      if (!condition)
        return s
      conditions[conditionIndex] = {
        ...condition,
        slotValues: { ...condition.slotValues, [key]: entry }
      }
      return { ...s, conditions }
    })
  }

  // --- Reset ---
  reset(): void {
    this.setState(() => ({ ...INITIAL_STATE }))
  }
}
