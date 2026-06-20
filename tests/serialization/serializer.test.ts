import type { War3EditorState } from '../../src/core/types'
import { describe, expect, it } from 'vitest'
import { War3Registry } from '../../src/core/registry'
import { defineCompositeTool, defineLeafTool } from '../../src/helpers'
import { resolveSlotValue, toTrigger } from '../../src/serialization/serializer'

function buildRegistry() {
  const r = new War3Registry()

  r.registerTool('text', defineLeafTool<string, string>({
    label: '文本',
    input: { type: 'text' },
    resolve: v => v
  }))

  r.registerTool('num', defineLeafTool<number, number>({
    label: '数字',
    input: { type: 'number' },
    resolve: v => v
  }))

  r.registerTool('ref', defineLeafTool<{ $ref: string }, { $ref: string }>({
    type: 'unit',
    label: '单位引用',
    input: { type: 'text' },
    resolve: v => v
  }))

  r.registerTool('point', defineCompositeTool<{ x: unknown, y: unknown }, { x: number, y: number }>({
    label: '点',
    template: '(${x}, ${y})',
    slots: {
      x: { label: 'X', tools: ['num'] },
      y: { label: 'Y', tools: ['num'] }
    },
    resolve: values => ({ x: values.x as number, y: values.y as number })
  }))

  return r
}

describe('resolveSlotValue', () => {
  it('returns undefined when entry has no tool', () => {
    const r = buildRegistry()
    expect(resolveSlotValue({ tool: null, value: 1 }, r)).toBeUndefined()
  })

  it('returns undefined when tool is not registered', () => {
    const r = buildRegistry()
    expect(resolveSlotValue({ tool: 'missing', value: 'x' }, r)).toBeUndefined()
  })

  it('resolves leaf tool value through registered resolve fn', () => {
    const r = buildRegistry()
    expect(resolveSlotValue({ tool: 'text', value: 'abc' }, r)).toBe('abc')
    expect(resolveSlotValue({ tool: 'num', value: 7 }, r)).toBe(7)
  })

  it('resolves composite tool by recursively resolving sub slots', () => {
    const r = buildRegistry()
    const entry = {
      tool: 'point',
      value: undefined as unknown,
      subSlots: {
        x: { tool: 'num', value: 3 },
        y: { tool: 'num', value: 4 }
      }
    }
    expect(resolveSlotValue(entry, r)).toEqual({ x: 3, y: 4 })
  })

  it('passes undefined for sub slot values that are unresolved', () => {
    const r = buildRegistry()
    const entry = {
      tool: 'point',
      value: undefined as unknown,
      subSlots: {
        x: { tool: 'num', value: 5 }
        // y is missing
      }
    }
    expect(resolveSlotValue(entry, r)).toEqual({ x: 5, y: undefined })
  })

  it('composite tool without subSlots receives empty record', () => {
    const r = buildRegistry()
    // Sub-slot tool references are missing → undefined values.
    expect(resolveSlotValue({ tool: 'point', value: undefined as unknown }, r)).toEqual({ x: undefined, y: undefined })
  })
})

describe('toTrigger', () => {
  const initialState: War3EditorState = { events: [], conditions: [], actions: [] }

  it('serializes a minimal state with empty events and no conditions', () => {
    const r = buildRegistry()
    const t = toTrigger(initialState, r)
    expect(t.id).toBeTypeOf('string')
    expect(t.events).toEqual([])
    expect(t.actions).toEqual([])
    expect(t.conditions).toBeUndefined()
  })

  it('uses explicit triggerId when provided', () => {
    const r = buildRegistry()
    const t = toTrigger(initialState, r, 'my-trigger')
    expect(t.id).toBe('my-trigger')
  })

  it('generates a unique id per call when not provided', () => {
    const r = buildRegistry()
    const t1 = toTrigger(initialState, r)
    const t2 = toTrigger(initialState, r)
    expect(t1.id).not.toBe(t2.id)
  })

  it('serializes a single event with payload from resolved slot values', () => {
    const r = buildRegistry()
    const state: War3EditorState = {
      events: [
        {
          id: 'unit.dies',
          slotValues: { who: { tool: 'ref', value: { $ref: 'hero' } } }
        }
      ],
      conditions: [],
      actions: []
    }
    const t = toTrigger(state, r, 'trig')
    expect(t.events).toEqual([
      {
        type: 'unit.dies',
        payload: { who: { $ref: 'hero' } }
      }
    ])
  })

  it('omits payload when event has no resolvable slot values', () => {
    const r = buildRegistry()
    const state: War3EditorState = {
      events: [{ id: 'tick', slotValues: {} }],
      conditions: [],
      actions: []
    }
    const t = toTrigger(state, r, 'trig')
    expect(t.events).toEqual([{ type: 'tick' }])
    expect(t.events[0].payload).toBeUndefined()
  })

  it('serializes multiple events (multi-event OR trigger)', () => {
    const r = buildRegistry()
    const state: War3EditorState = {
      events: [
        { id: 'tick', slotValues: {} },
        {
          id: 'unit.dies',
          slotValues: { who: { tool: 'ref', value: { $ref: 'hero' } } }
        }
      ],
      conditions: [],
      actions: []
    }
    const t = toTrigger(state, r, 'trig')
    expect(t.events).toEqual([
      { type: 'tick' },
      { type: 'unit.dies', payload: { who: { $ref: 'hero' } } }
    ])
  })

  it('serializes actions with params from resolved slot values', () => {
    const r = buildRegistry()
    const state: War3EditorState = {
      events: [],
      conditions: [],
      actions: [
        { id: 'move', slotValues: { x: { tool: 'num', value: 1 }, y: { tool: 'num', value: 2 } } },
        { id: 'noop', slotValues: {} }
      ]
    }
    const t = toTrigger(state, r, 'trig')
    expect(t.actions).toHaveLength(2)
    expect(t.actions[0]).toEqual({ type: 'move', params: { x: 1, y: 2 } })
    expect(t.actions[1]).toEqual({ type: 'noop' })
  })

  it('emits a flat conditions array (implicit AND, no ConditionGroup wrapper) when conditions are present', () => {
    const r = buildRegistry()
    const state: War3EditorState = {
      events: [],
      conditions: [
        { id: 'c1', slotValues: { v: { tool: 'num', value: 1 } } }
      ],
      actions: []
    }
    const t = toTrigger(state, r, 'trig')
    expect(t.conditions).toEqual([{ type: 'c1', params: { v: 1 } }])
  })

  it('omits conditions block when no conditions exist', () => {
    const r = buildRegistry()
    const t = toTrigger(initialState, r, 'trig')
    expect(t.conditions).toBeUndefined()
  })

  it('skips action params when all slot values are unresolved', () => {
    const r = buildRegistry()
    const state: War3EditorState = {
      events: [],
      conditions: [],
      actions: [
        { id: 'a', slotValues: { v: { tool: 'missing', value: 1 } } }
      ]
    }
    const t = toTrigger(state, r, 'trig')
    const firstAction = t.actions[0] as { type: string, params?: Record<string, unknown> }
    expect(firstAction).toEqual({ type: 'a' })
    expect(firstAction.params).toBeUndefined()
  })

  it('serializes the complete trigger shape end-to-end', () => {
    const r = buildRegistry()
    const state: War3EditorState = {
      events: [
        {
          id: 'unit.dies',
          slotValues: { who: { tool: 'ref', value: { $ref: 'hero' } } }
        }
      ],
      conditions: [
        { id: 'hp.less', slotValues: { v: { tool: 'num', value: 0 } } }
      ],
      actions: [
        {
          id: 'move',
          slotValues: {
            p: {
              tool: 'point',
              value: undefined as unknown,
              subSlots: {
                x: { tool: 'num', value: 1 },
                y: { tool: 'num', value: 2 }
              }
            }
          }
        }
      ]
    }
    const t = toTrigger(state, r, 'trig')
    expect(t).toEqual({
      id: 'trig',
      events: [
        {
          type: 'unit.dies',
          payload: { who: { $ref: 'hero' } }
        }
      ],
      conditions: [{ type: 'hp.less', params: { v: 0 } }],
      actions: [
        { type: 'move', params: { p: { x: 1, y: 2 } } }
      ]
    })
  })
})
