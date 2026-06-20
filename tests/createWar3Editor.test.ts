import type { SlotValueEntry } from '../src/core/types'
import { describe, expect, it, vi } from 'vitest'
import { createWar3Editor } from '../src/createWar3Editor'
import { defineCompositeTool, defineLeafTool } from '../src/helpers'
import { defineWar3Preset } from '../src/preset'

function bootstrap() {
  const editor = createWar3Editor()

  editor.registerEvent({
    id: 'unit.dies',
    label: '单位死亡',
    template: '当 ${who} 死亡',
    slots: { who: { label: '单位', tools: ['unit'] } }
  })
  editor.registerAction({
    id: 'move',
    label: '移动',
    template: '将 ${who} 移动到 ${target}',
    slots: {
      who: { label: '单位', tools: ['unit'] },
      target: { label: '点', tools: ['point'] }
    }
  })
  editor.registerCondition({
    id: 'hp.less',
    label: 'HP<',
    template: '${who}.HP < ${value}',
    slots: {
      who: { label: '单位', tools: ['unit'] },
      value: { label: '值', tools: ['num'] }
    }
  })

  editor.registerTool('unit', defineLeafTool<string, string>({ label: 'U', input: { type: 'text' }, resolve: v => v }))
  editor.registerTool('point', defineCompositeTool<{ x: unknown, y: unknown }, { x: number, y: number }>({
    label: 'P',
    template: '(${x},${y})',
    slots: {
      x: { label: 'X', tools: ['num'] },
      y: { label: 'Y', tools: ['num'] }
    },
    resolve: v => ({ x: v.x as number, y: v.y as number })
  }))
  editor.registerTool('num', defineLeafTool<number, number>({ label: 'N', input: { type: 'number' }, resolve: v => v }))

  return editor
}

describe('createWar3Editor - lifecycle', () => {
  it('starts with an empty state', () => {
    const editor = createWar3Editor()
    expect(editor.getState()).toEqual({ events: [], conditions: [], actions: [] })
  })

  it('toTrigger on an empty editor produces a trigger with empty events and no actions', () => {
    const editor = createWar3Editor()
    const t = editor.toTrigger('trig')
    expect(t).toMatchObject({
      id: 'trig',
      events: [],
      actions: []
    })
    expect(t.conditions).toBeUndefined()
  })

  it('reset returns the editor to the initial state', () => {
    const editor = bootstrap()
    editor.setEvent('unit.dies')
    editor.addAction('move')
    editor.addCondition('hp.less')
    editor.reset()
    expect(editor.getState()).toEqual({ events: [], conditions: [], actions: [] })
  })

  it('onChange listener fires on state changes and can be unsubscribed', () => {
    const editor = createWar3Editor()
    const listener = vi.fn()
    const off = editor.onChange(listener)
    editor.setEvent('e1')
    expect(listener).toHaveBeenCalledTimes(1)
    off()
    editor.addAction('a1')
    expect(listener).toHaveBeenCalledTimes(1)
  })
})

describe('createWar3Editor - registration', () => {
  it('exposes registered events/actions/conditions', () => {
    const editor = bootstrap()
    expect(editor.getAvailableEvents().map(e => e.id)).toEqual(['unit.dies'])
    expect(editor.getAvailableActions().map(a => a.id)).toEqual(['move'])
    expect(editor.getAvailableConditions().map(c => c.id)).toEqual(['hp.less'])
  })

  it('exposes the underlying registry via getRegistry()', () => {
    const editor = bootstrap()
    expect(editor.getRegistry().getTool('unit')).toBeDefined()
  })

  it('getValueSources delegates to the registry and supports type filtering', () => {
    const editor = createWar3Editor()
    editor.registerCondition({ id: 'c1', label: 'C1', template: 't', type: 'unit' })
    editor.registerCondition({ id: 'c2', label: 'C2', template: 't' })
    editor.registerTool('t1', defineLeafTool<string, string>({ type: 'unit', label: 'T1', input: { type: 'text' }, resolve: v => v }))
    const all = editor.getValueSources()
    expect(all.conditions).toHaveLength(2)
    expect(all.tools.size).toBe(1)

    const filtered = editor.getValueSources('unit')
    expect(filtered.conditions.map(c => c.id)).toEqual(['c1'])
    expect([...filtered.tools.keys()]).toEqual(['t1'])
  })
})

describe('createWar3Editor - event state', () => {
  it('setEvent/clearEvent updates state and produces a matching descriptor', () => {
    const editor = bootstrap()
    editor.setEvent('unit.dies')
    const desc = editor.getEventDescriptor()
    expect(desc?.id).toBe('unit.dies')
    editor.clearEvent()
    expect(editor.getEventDescriptor()).toBeNull()
  })

  it('setEventSlot stores values accessible in the descriptor', () => {
    const editor = bootstrap()
    editor.setEvent('unit.dies')
    const entry: SlotValueEntry = { tool: 'unit', value: 'hero' }
    editor.setEventSlot('who', entry)
    const desc = editor.getEventDescriptor()
    expect(desc?.segments[1]).toMatchObject({ type: 'slot', value: 'hero' })
  })

  it('getEventDescriptor returns null when no event is set', () => {
    const editor = bootstrap()
    expect(editor.getEventDescriptor()).toBeNull()
  })
})

describe('createWar3Editor - action state', () => {
  it('addAction/removeAction/moveAction shape the actions array', () => {
    const editor = bootstrap()
    editor.addAction('move')
    editor.addAction('move')
    editor.addAction('move')
    editor.moveAction(0, 2)
    expect(editor.getState().actions).toHaveLength(3)
    editor.removeAction(0)
    expect(editor.getState().actions).toHaveLength(2)
  })

  it('getActionDescriptor returns null for out-of-range index', () => {
    const editor = bootstrap()
    expect(editor.getActionDescriptor(0)).toBeNull()
    editor.addAction('move')
    expect(editor.getActionDescriptor(0)).not.toBeNull()
    expect(editor.getActionDescriptor(5)).toBeNull()
  })

  it('getActionDescriptor builds from the action id and slot values', () => {
    const editor = bootstrap()
    editor.addAction('move')
    editor.setActionSlot(0, 'who', { tool: 'unit', value: 'u' })
    editor.setActionSlot(0, 'target', {
      tool: 'point',
      value: undefined as unknown,
      subSlots: {
        x: { tool: 'num', value: 1 },
        y: { tool: 'num', value: 2 }
      }
    })
    const desc = editor.getActionDescriptor(0)
    expect(desc?.id).toBe('move')
  })

  it('setActionSlot updates a single action without affecting others', () => {
    const editor = bootstrap()
    editor.addAction('move')
    editor.addAction('move')
    editor.setActionSlot(0, 'k', { tool: 'unit', value: 'a' })
    expect(editor.getState().actions[0].slotValues.k.value).toBe('a')
    expect(editor.getState().actions[1].slotValues).toEqual({})
  })
})

describe('createWar3Editor - condition state', () => {
  it('addCondition/removeCondition shape the conditions array', () => {
    const editor = bootstrap()
    editor.addCondition('hp.less')
    editor.addCondition('hp.less')
    expect(editor.getState().conditions).toHaveLength(2)
    editor.removeCondition(0)
    expect(editor.getState().conditions).toHaveLength(1)
  })

  it('getConditionDescriptor returns null for out-of-range index', () => {
    const editor = bootstrap()
    expect(editor.getConditionDescriptor(0)).toBeNull()
    editor.addCondition('hp.less')
    expect(editor.getConditionDescriptor(0)).not.toBeNull()
  })

  it('setConditionSlot updates only the targeted condition', () => {
    const editor = bootstrap()
    editor.addCondition('hp.less')
    editor.addCondition('hp.less')
    editor.setConditionSlot(1, 'k', { tool: 'num', value: 9 })
    expect(editor.getState().conditions[0].slotValues).toEqual({})
    expect(editor.getState().conditions[1].slotValues.k.value).toBe(9)
  })
})

describe('createWar3Editor - tool descriptors', () => {
  it('getToolDescriptor returns a leaf descriptor for leaf tools', () => {
    const editor = bootstrap()
    const d = editor.getToolDescriptor('unit')
    expect(d).toEqual({ kind: 'leaf', name: 'unit', label: 'U', input: { type: 'text' } })
  })

  it('getToolDescriptor returns a composite descriptor for composite tools', () => {
    const editor = bootstrap()
    const d = editor.getToolDescriptor('point')
    expect(d?.kind).toBe('composite')
    if (d?.kind === 'composite') {
      expect(d.name).toBe('point')
      expect(d.label).toBe('P')
    }
  })

  it('getToolDescriptor returns null for unknown tool', () => {
    const editor = bootstrap()
    expect(editor.getToolDescriptor('missing')).toBeNull()
  })

  it('getSlotTools returns descriptors for declared tools and filters unknown ones', () => {
    const editor = bootstrap()
    const descs = editor.getSlotTools({ label: '混合', tools: ['unit', 'missing', 'num'] })
    expect(descs.map(d => d.name)).toEqual(['unit', 'num'])
  })
})

describe('createWar3Editor - applyPreset', () => {
  it('runs the preset setup against this editor', () => {
    const editor = createWar3Editor()
    const preset = defineWar3Preset({
      name: 'war3',
      events: [{ id: 'e1', label: 'E', template: 'E' }],
      tools: {
        t: defineLeafTool<string, string>({ label: 'T', input: { type: 'text' }, resolve: v => v })
      }
    })
    editor.applyPreset(preset)
    expect(editor.getAvailableEvents().map(e => e.id)).toEqual(['e1'])
    expect(editor.getRegistry().getTool('t')).toBeDefined()
  })
})

describe('createWar3Editor - resolveSlotValue', () => {
  it('resolves leaf tool values via the registry', () => {
    const editor = bootstrap()
    expect(editor.resolveSlotValue({ tool: 'unit', value: 'hero' })).toBe('hero')
    expect(editor.resolveSlotValue({ tool: 'num', value: 12 })).toBe(12)
  })

  it('resolves composite tools recursively', () => {
    const editor = bootstrap()
    const v = editor.resolveSlotValue({
      tool: 'point',
      value: undefined as unknown,
      subSlots: {
        x: { tool: 'num', value: 3 },
        y: { tool: 'num', value: 4 }
      }
    })
    expect(v).toEqual({ x: 3, y: 4 })
  })

  it('returns undefined for missing tool or null tool', () => {
    const editor = bootstrap()
    expect(editor.resolveSlotValue({ tool: 'missing', value: 1 })).toBeUndefined()
    expect(editor.resolveSlotValue({ tool: null, value: 1 })).toBeUndefined()
  })
})

describe('createWar3Editor - end-to-end toTrigger', () => {
  it('serializes the full editor state to a Trigger', () => {
    const editor = bootstrap()
    editor.setEvent('unit.dies')
    editor.setEventSlot('who', { tool: 'unit', value: 'hero' })
    editor.addAction('move')
    editor.setActionSlot(0, 'who', { tool: 'unit', value: 'hero' })
    editor.setActionSlot(0, 'target', {
      tool: 'point',
      value: undefined as unknown,
      subSlots: {
        x: { tool: 'num', value: 1 },
        y: { tool: 'num', value: 2 }
      }
    })
    editor.addCondition('hp.less')
    editor.setConditionSlot(0, 'value', { tool: 'num', value: 0 })

    const t = editor.toTrigger('trig')
    expect(t).toEqual({
      id: 'trig',
      events: [{ type: 'unit.dies', payload: { who: 'hero' } }],
      conditions: [{ type: 'hp.less', params: { value: 0 } }],
      actions: [
        { type: 'move', params: { who: 'hero', target: { x: 1, y: 2 } } }
      ]
    })
  })
})
