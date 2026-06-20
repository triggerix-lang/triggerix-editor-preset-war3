import type { Action, ActionNode, ConditionItem, Event, Trigger, Value } from '@triggerix/core'
import type { War3Registry } from '../core/registry'
import type { ItemState, SlotValueEntry, War3EditorState } from '../core/types'

/**
 * Recursively resolve a single slot value.
 */
export function resolveSlotValue(entry: SlotValueEntry, registry: War3Registry): Value | undefined {
  if (!entry.tool)
    return undefined

  const toolDef = registry.getTool(entry.tool)
  if (!toolDef)
    return undefined

  if (toolDef.kind === 'leaf') {
    return toolDef.resolve(entry.value) as Value | undefined
  }

  // composite: recursively resolve sub-slots
  const resolvedSubSlots: Record<string, Value | undefined> = {}
  if (entry.subSlots) {
    for (const [key, subEntry] of Object.entries(entry.subSlots)) {
      resolvedSubSlots[key] = resolveSlotValue(subEntry, registry)
    }
  }
  return toolDef.resolve(resolvedSubSlots) as Value | undefined
}

/**
 * Resolve all slot values of an ItemState into a params object.
 */
function resolveItemParams(
  slotValues: Record<string, SlotValueEntry>,
  registry: War3Registry
): Record<string, Value> | undefined {
  const params: Record<string, Value> = {}
  let hasParams = false

  for (const [key, entry] of Object.entries(slotValues)) {
    const resolved = resolveSlotValue(entry, registry)
    if (resolved !== undefined) {
      params[key] = resolved
      hasParams = true
    }
  }

  return hasParams ? params : undefined
}

/**
 * Serialize an ItemState into an Event (with optional payload).
 */
function serializeEvent(item: ItemState, registry: War3Registry): Event {
  const eventParams = resolveItemParams(item.slotValues, registry)
  return {
    type: item.id,
    ...(eventParams ? { payload: eventParams } : {})
  }
}

/**
 * Serialize an ItemState array into an Action list.
 */
function serializeItems(
  items: ItemState[],
  registry: War3Registry
): Action[] {
  return items.map<Action>((item) => {
    const params = resolveItemParams(item.slotValues, registry)
    const action: Action = { type: item.id }
    if (params) {
      action.params = params
    }
    return action
  })
}

function generateTriggerId(): string {
  // Prefer crypto.randomUUID (browser / Node 18+)
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  return `trigger-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

/**
 * Serialize editor state into a standard Trigger JSON.
 *
 * Output shape (compatible with @triggerix/core):
 *   {
 *     id, events: [{ type, payload? }, ...],
 *     conditions?: ConditionItem[]  // flat array, implicit AND
 *     actions: [{ type, params? }]
 *   }
 *
 * - Multiple events use OR semantics at runtime.
 * - Conditions are emitted as a flat `ConditionItem[]` (no ConditionGroup wrapper);
 *   the runtime treats the array as an implicit AND with explicit nested groups allowed.
 */
export function toTrigger(
  state: War3EditorState,
  registry: War3Registry,
  triggerId?: string
): Trigger {
  const events: Event[] = state.events.map(item => serializeEvent(item, registry))
  const actions: ActionNode[] = serializeItems(state.actions, registry)

  const trigger: Trigger = {
    id: triggerId ?? generateTriggerId(),
    events,
    actions
  }

  if (state.conditions.length > 0) {
    // Editor-level conditions use the Action shape ({ type, params }), which differs
    // from core's Condition. We pass them through as a flat array; the legacy
    // editor-condition format is preserved as-is here — a future migration to real
    // Condition shapes is tracked separately and does not block the events/conditions
    // array refactor.
    trigger.conditions = serializeItems(state.conditions, registry) as unknown as ConditionItem[]
  }

  return trigger
}
