import type { SlotValueEntry } from '../../src/core/types'
import { describe, expect, it, vi } from 'vitest'
import { War3EditorStateManager } from '../../src/core/state'

const entry = (value: unknown): SlotValueEntry => ({ tool: 't', value })

describe('war3EditorStateManager - initial state', () => {
  it('starts with empty arrays', () => {
    const m = new War3EditorStateManager()
    expect(m.getState()).toEqual({ events: [], conditions: [], actions: [] })
  })
})

describe('war3EditorStateManager - event', () => {
  it('setEvent initializes events with one event that has empty slotValues', () => {
    const m = new War3EditorStateManager()
    m.setEvent('e1')
    expect(m.getState().events).toEqual([{ id: 'e1', slotValues: {} }])
  })

  it('clearEvent resets events to an empty array', () => {
    const m = new War3EditorStateManager()
    m.setEvent('e1')
    m.clearEvent()
    expect(m.getState().events).toEqual([])
  })

  it('setEvent replaces the previous event id and clears its slots', () => {
    const m = new War3EditorStateManager()
    m.setEvent('e1')
    m.setEventSlot('k', entry(1))
    m.setEvent('e2')
    expect(m.getState().events).toEqual([{ id: 'e2', slotValues: {} }])
  })

  it('setEventSlot stores slot value on the single configured event', () => {
    const m = new War3EditorStateManager()
    m.setEvent('e1')
    m.setEventSlot('who', entry('hero'))
    expect(m.getState().events[0]?.slotValues.who).toEqual({ tool: 't', value: 'hero' })
  })

  it('setEventSlot is a no-op when there is no event', () => {
    const m = new War3EditorStateManager()
    m.setEventSlot('who', entry('hero'))
    expect(m.getState().events).toEqual([])
  })

  it('setEventSlot merges with existing slots (does not overwrite other keys)', () => {
    const m = new War3EditorStateManager()
    m.setEvent('e1')
    m.setEventSlot('a', entry(1))
    m.setEventSlot('b', entry(2))
    expect(m.getState().events[0]?.slotValues).toEqual({
      a: { tool: 't', value: 1 },
      b: { tool: 't', value: 2 }
    })
  })

  it('setEventSlot overwrites value for an existing key', () => {
    const m = new War3EditorStateManager()
    m.setEvent('e1')
    m.setEventSlot('k', entry(1))
    m.setEventSlot('k', entry(2))
    expect(m.getState().events[0]?.slotValues.k).toEqual({ tool: 't', value: 2 })
  })

  it('setEvent preserves conditions and actions', () => {
    const m = new War3EditorStateManager()
    m.addAction('a1')
    m.addCondition('c1')
    m.setEvent('e1')
    expect(m.getState().events).toEqual([{ id: 'e1', slotValues: {} }])
    expect(m.getState().actions.map(a => a.id)).toEqual(['a1'])
    expect(m.getState().conditions.map(c => c.id)).toEqual(['c1'])
  })
})

describe('war3EditorStateManager - multi-event', () => {
  it('addEvent appends and returns the new event index', () => {
    const m = new War3EditorStateManager()
    expect(m.addEvent('e1')).toBe(0)
    expect(m.addEvent('e2')).toBe(1)
    expect(m.getState().events.map(e => e.id)).toEqual(['e1', 'e2'])
  })

  it('removeEvent drops the event at the given index', () => {
    const m = new War3EditorStateManager()
    m.addEvent('e1')
    m.addEvent('e2')
    m.addEvent('e3')
    m.removeEvent(1)
    expect(m.getState().events.map(e => e.id)).toEqual(['e1', 'e3'])
  })

  it('removeEvent with out-of-range index is a no-op', () => {
    const m = new War3EditorStateManager()
    m.addEvent('e1')
    m.removeEvent(5)
    expect(m.getState().events).toHaveLength(1)
  })

  it('setEventSlotAt writes the slot on the targeted event', () => {
    const m = new War3EditorStateManager()
    m.addEvent('e1')
    m.addEvent('e2')
    m.setEventSlotAt(1, 'k', entry('v'))
    expect(m.getState().events[0]?.slotValues).toEqual({})
    expect(m.getState().events[1]?.slotValues.k).toEqual({ tool: 't', value: 'v' })
  })

  it('setEventSlotAt with out-of-range index is a no-op', () => {
    const m = new War3EditorStateManager()
    m.addEvent('e1')
    m.setEventSlotAt(2, 'k', entry('v'))
    expect(m.getState().events[0]?.slotValues).toEqual({})
  })
})

describe('war3EditorStateManager - actions', () => {
  it('addAction appends to actions array', () => {
    const m = new War3EditorStateManager()
    m.addAction('a1')
    m.addAction('a2')
    expect(m.getState().actions.map(a => a.id)).toEqual(['a1', 'a2'])
  })

  it('removeAction removes by index', () => {
    const m = new War3EditorStateManager()
    m.addAction('a1')
    m.addAction('a2')
    m.addAction('a3')
    m.removeAction(1)
    expect(m.getState().actions.map(a => a.id)).toEqual(['a1', 'a3'])
  })

  it('removeAction with out-of-range index is a no-op', () => {
    const m = new War3EditorStateManager()
    m.addAction('a1')
    m.removeAction(5)
    expect(m.getState().actions).toHaveLength(1)
  })

  it('moveAction reorders actions', () => {
    const m = new War3EditorStateManager()
    m.addAction('a1')
    m.addAction('a2')
    m.addAction('a3')
    m.moveAction(0, 2)
    expect(m.getState().actions.map(a => a.id)).toEqual(['a2', 'a3', 'a1'])
  })

  it('setActionSlot stores slot value for the targeted action', () => {
    const m = new War3EditorStateManager()
    m.addAction('a1')
    m.addAction('a2')
    m.setActionSlot(0, 'k', entry('v'))
    expect(m.getState().actions[0].slotValues.k).toEqual({ tool: 't', value: 'v' })
    expect(m.getState().actions[1].slotValues).toEqual({})
  })

  it('setActionSlot with out-of-range index is a no-op', () => {
    const m = new War3EditorStateManager()
    m.addAction('a1')
    m.setActionSlot(2, 'k', entry('v'))
    expect(m.getState().actions[0].slotValues).toEqual({})
  })

  it('setActionSlot merges with existing slots on that action', () => {
    const m = new War3EditorStateManager()
    m.addAction('a1')
    m.setActionSlot(0, 'a', entry(1))
    m.setActionSlot(0, 'b', entry(2))
    expect(m.getState().actions[0].slotValues).toEqual({
      a: { tool: 't', value: 1 },
      b: { tool: 't', value: 2 }
    })
  })
})

describe('war3EditorStateManager - conditions', () => {
  it('addCondition appends to conditions array', () => {
    const m = new War3EditorStateManager()
    m.addCondition('c1')
    m.addCondition('c2')
    expect(m.getState().conditions.map(c => c.id)).toEqual(['c1', 'c2'])
  })

  it('removeCondition removes by index', () => {
    const m = new War3EditorStateManager()
    m.addCondition('c1')
    m.addCondition('c2')
    m.removeCondition(0)
    expect(m.getState().conditions.map(c => c.id)).toEqual(['c2'])
  })

  it('removeCondition with out-of-range index is a no-op', () => {
    const m = new War3EditorStateManager()
    m.addCondition('c1')
    m.removeCondition(3)
    expect(m.getState().conditions).toHaveLength(1)
  })

  it('setConditionSlot stores slot value for the targeted condition', () => {
    const m = new War3EditorStateManager()
    m.addCondition('c1')
    m.setConditionSlot(0, 'k', entry(7))
    expect(m.getState().conditions[0].slotValues.k).toEqual({ tool: 't', value: 7 })
  })

  it('setConditionSlot with out-of-range index is a no-op', () => {
    const m = new War3EditorStateManager()
    m.addCondition('c1')
    m.setConditionSlot(5, 'k', entry(7))
    expect(m.getState().conditions[0].slotValues).toEqual({})
  })
})

describe('war3EditorStateManager - reset', () => {
  it('reset returns state to the initial shape', () => {
    const m = new War3EditorStateManager()
    m.setEvent('e1')
    m.setEventSlot('k', entry(1))
    m.addAction('a1')
    m.setActionSlot(0, 'k', entry(1))
    m.addCondition('c1')
    m.setConditionSlot(0, 'k', entry(1))
    m.reset()
    expect(m.getState()).toEqual({ events: [], conditions: [], actions: [] })
  })
})

describe('war3EditorStateManager - change notifications', () => {
  it('onChange listener fires after state changes', () => {
    const m = new War3EditorStateManager()
    const listener = vi.fn()
    m.onChange(listener)
    m.setEvent('e1')
    expect(listener).toHaveBeenCalledTimes(1)
    m.addAction('a1')
    expect(listener).toHaveBeenCalledTimes(2)
  })

  it('listener still fires when setEventSlot is a no-op (setState always notifies)', () => {
    const m = new War3EditorStateManager()
    const listener = vi.fn()
    m.onChange(listener)
    m.setEventSlot('k', entry(1))
    // ObservableState.setState notifies unconditionally; document the actual behavior.
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it('unsubscribe stops further notifications', () => {
    const m = new War3EditorStateManager()
    const listener = vi.fn()
    const off = m.onChange(listener)
    off()
    m.setEvent('e1')
    expect(listener).not.toHaveBeenCalled()
  })

  it('multiple listeners all receive notifications', () => {
    const m = new War3EditorStateManager()
    const a = vi.fn()
    const b = vi.fn()
    m.onChange(a)
    m.onChange(b)
    m.setEvent('e1')
    expect(a).toHaveBeenCalledTimes(1)
    expect(b).toHaveBeenCalledTimes(1)
  })

  it('dispose clears listeners and prevents future notifications', () => {
    const m = new War3EditorStateManager()
    const listener = vi.fn()
    m.onChange(listener)
    m.dispose()
    m.setEvent('e1')
    expect(listener).not.toHaveBeenCalled()
  })
})
