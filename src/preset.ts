import type { Preset } from '@triggerix/editor'
import type { War3Editor } from './createWar3Editor'
import type { War3PresetOptions } from './types'

export function defineWar3Preset(options: War3PresetOptions): Preset<War3Editor> {
  return {
    name: options.name,
    setup(editor) {
      options.events?.forEach(def => editor.registerEvent(def))
      options.actions?.forEach(def => editor.registerAction(def))
      options.conditions?.forEach(def => editor.registerCondition(def))
      if (options.tools) {
        for (const [name, def] of Object.entries(options.tools)) {
          editor.registerTool(name, def)
        }
      }
    }
  }
}
