import { parseTemplate } from './parser'
import type { War3Registry } from './registry'
import type {
  ItemDescriptor,
  SlotDef,
  SlotValueEntry,
  ToolDescriptor
} from './types'

export function getEventDescriptor(
  registry: War3Registry,
  type: string,
  slotValues?: Record<string, SlotValueEntry>
): ItemDescriptor | null {
  const def = registry.getEvent(type)
  if (!def)
    return null
  return {
    type: def.type,
    segments: parseTemplate(def.template, def.slots, slotValues)
  }
}

export function getActionDescriptor(
  registry: War3Registry,
  type: string,
  slotValues?: Record<string, SlotValueEntry>
): ItemDescriptor | null {
  const def = registry.getAction(type)
  if (!def)
    return null
  return {
    type: def.type,
    segments: parseTemplate(def.template, def.slots, slotValues)
  }
}

export function getConditionDescriptor(
  registry: War3Registry,
  type: string,
  slotValues?: Record<string, SlotValueEntry>
): ItemDescriptor | null {
  const def = registry.getCondition(type)
  if (!def)
    return null
  return {
    type: def.type,
    segments: parseTemplate(def.template, def.slots, slotValues)
  }
}

export function getToolDescriptor(
  registry: War3Registry,
  toolName: string,
  slotValues?: Record<string, SlotValueEntry>
): ToolDescriptor | null {
  const def = registry.getTool(toolName)
  if (!def)
    return null

  if (def.type === 'leaf') {
    return {
      type: 'leaf',
      name: toolName,
      label: def.label,
      input: def.input
    }
  }

  return {
    type: 'composite',
    name: toolName,
    label: def.label,
    segments: parseTemplate(def.template, def.slots, slotValues)
  }
}

export function getSlotToolDescriptors(
  registry: War3Registry,
  slotDef: SlotDef
): ToolDescriptor[] {
  return slotDef.tools
    .map(name => getToolDescriptor(registry, name))
    .filter((d): d is ToolDescriptor => d !== null)
}
