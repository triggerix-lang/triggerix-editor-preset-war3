import type { SlotValueEntry, War3EditorState } from './types'
import { ObservableState } from '@triggerix/editor'

const INITIAL_STATE: War3EditorState = {
  events: [],
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

  // --- Events ---
  /**
   * Single-event UI helper: reset the events array to one freshly-initialized event.
   * Preserves conditions and actions; only the events slot is replaced.
   */
  setEvent(id: string): void {
    this.setState(s => ({
      ...s,
      events: [{ id, slotValues: {} }]
    }))
  }

  /**
   * Clear all events (single-event UI equivalent: no event configured).
   */
  clearEvent(): void {
    this.setState(s => ({ ...s, events: [] }))
  }

  /**
   * Single-event UI helper: set a slot on events[0]. No-op when no event is configured.
   */
  setEventSlot(key: string, entry: SlotValueEntry): void {
    this.setEventSlotAt(0, key, entry)
  }

  /**
   * Multi-event: append a freshly-initialized event. Returns the new event's index.
   */
  addEvent(id: string): number {
    const index = this.getState().events.length
    this.setState(s => ({ ...s, events: [...s.events, { id, slotValues: {} }] }))
    return index
  }

  /**
   * Multi-event: remove an event by index. Out-of-range index is a no-op.
   */
  removeEvent(index: number): void {
    this.setState(s => ({
      ...s,
      events: s.events.filter((_, i) => i !== index)
    }))
  }

  /**
   * Multi-event: set a slot on the event at the given index. Out-of-range index is a no-op.
   */
  setEventSlotAt(index: number, key: string, entry: SlotValueEntry): void {
    this.setState((s) => {
      const target = s.events[index]
      if (!target)
        return s
      const events = [...s.events]
      events[index] = {
        ...target,
        slotValues: { ...target.slotValues, [key]: entry }
      }
      return { ...s, events }
    })
  }

  // --- Actions ---
  addAction(id: string): void {
    this.setState(s => ({
      ...s,
      actions: [...s.actions, { id, slotValues: {} }]
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
    this.setItemSlot('actions', actionIndex, key, entry)
  }

  // --- Conditions ---
  addCondition(id: string): void {
    this.setState(s => ({
      ...s,
      conditions: [...s.conditions, { id, slotValues: {} }]
    }))
  }

  removeCondition(index: number): void {
    this.setState(s => ({
      ...s,
      conditions: s.conditions.filter((_, i) => i !== index)
    }))
  }

  setConditionSlot(conditionIndex: number, key: string, entry: SlotValueEntry): void {
    this.setItemSlot('conditions', conditionIndex, key, entry)
  }

  // --- Reset ---
  reset(): void {
    this.setState(() => ({ ...INITIAL_STATE }))
  }

  // --- Helpers ---
  private setItemSlot(
    field: 'actions' | 'conditions',
    index: number,
    key: string,
    entry: SlotValueEntry
  ): void {
    this.setState((s) => {
      const items = [...s[field]]
      const item = items[index]
      if (!item)
        return s
      items[index] = { ...item, slotValues: { ...item.slotValues, [key]: entry } }
      return { ...s, [field]: items }
    })
  }
}
