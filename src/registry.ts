import { BaseRegistry } from '@triggerix/editor'
import type {
  ToolDef,
  War3ActionDef,
  War3ConditionDef,
  War3EventDef
} from './types'

/**
 * War3 注册表 - 继承 BaseRegistry，增加 Tool 注册能力
 */
export class War3Registry extends BaseRegistry<War3EventDef, War3ActionDef, War3ConditionDef> {
  private tools = new Map<string, ToolDef>()

  registerTool(name: string, def: ToolDef): void {
    this.tools.set(name, def)
  }

  getTool(name: string): ToolDef | undefined {
    return this.tools.get(name)
  }

  getTools(): Map<string, ToolDef> {
    return new Map(this.tools)
  }
}
