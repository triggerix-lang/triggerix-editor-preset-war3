# triggerix-editor-preset-war3

> **War3-style template editor preset for [Triggerix](https://github.com/triggerix-collective)**
>
> 为 Triggerix 提供的「魔兽争霸 III 触发器」风格编辑器预设 —— 用模板字符串 + 槽位的方式声明 Event / Condition / Action，并最终序列化为标准 Trigger JSON。

[![npm](https://img.shields.io/npm/v/triggerix-editor-preset-war3)](https://www.npmjs.com/package/triggerix-editor-preset-war3)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-blue)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/github/license/triggerix-collective/triggerix-editor-preset-war3)](./LICENSE)

## 特性

- 🎯 **模板驱动**：用 `"${unit} 发动技能效果"` 这样的自然语言模板声明触发器节点
- 🧩 **嵌套复合工具 (Composite Tool)**：Tool 可以由其他 Tool 组合，槽位无限嵌套
- 🪝 **类型安全工厂**：`defineLeafTool` / `defineCompositeTool` / `defineCondition` 提供完整类型推断
- 🔌 **可插拔预设**：`defineWar3Preset` 一键注入 Event/Action/Condition/Tool 集合
- 📤 **标准输出**：`toTrigger()` 直接产出 `@triggerix/core` 兼容的 Trigger JSON
- 🔍 **值来源查询**：`getValueSources(type)` 过滤同类型 Condition / Tool，作为槽位候选项
- 🪶 **零依赖运行**：仅依赖 `@triggerix/core` 与 `@triggerix/editor`

## 安装

```bash
pnpm add triggerix-editor-preset-war3 @triggerix/core @triggerix/editor
# 或
npm install triggerix-editor-preset-war3 @triggerix/core @triggerix/editor
```

> 运行时需要 `crypto.randomUUID`（Node 18+ / 现代浏览器）；不支持时会回退到基于时间戳的 ID。

## 快速开始

```ts
import {
  createWar3Editor,
  defineCondition,
  defineLeafTool,
  defineWar3Preset
} from 'triggerix-editor-preset-war3'

// 1. 定义工具 (槽位填充器)
const elementTool = defineLeafTool<string, string>({
  type: 'element',
  label: '元素',
  input: {
    type: 'select',
    options: [
      { value: '#submit-btn', label: '提交按钮' },
      { value: '#search-input', label: '搜索框' }
    ]
  },
  resolve: v => v
})

const eventNameTool = defineLeafTool<string, string>({
  type: 'event-name',
  label: '事件名',
  input: { type: 'text', placeholder: '如 submit-success' },
  resolve: v => v
})

const booleanTool = defineLeafTool<boolean, boolean>({
  type: 'boolean',
  label: '开关',
  input: {
    type: 'select',
    options: [
      { value: true, label: '启用' },
      { value: false, label: '禁用' }
    ]
  },
  resolve: v => v
})

// 2. 定义 Condition
const elementVisible = defineCondition<{ element: string }>({
  id: 'element-visible',
  label: '元素可见',
  template: '${element} 当前可见',
  slots: {
    element: { label: '元素', tools: ['element'] }
  },
  resolve: ({ element }) => ({ element })
})

// 3. 定义 Event / Action（结构与 Condition 类似，继承 BaseItemDef）
// ...

// 4. 打包成 Preset
const preset = defineWar3Preset({
  name: 'my-web-app',
  events: [/* War3EventDef[] */],
  actions: [/* War3ActionDef[] */],
  conditions: [elementVisible],
  tools: {
    element: elementTool,
    'event-name': eventNameTool,
    boolean: booleanTool
  }
})

// 5. 创建编辑器并应用 Preset
const editor = createWar3Editor()
editor.applyPreset(preset)

// 6. 改变状态：监听 #submit-btn 点击后派发 submit-success
editor.setEvent('element-click')
editor.addCondition('element-visible')
editor.setConditionSlot(0, 'element', { tool: 'element', value: '#submit-btn' })

editor.addAction('emit-event')
editor.setActionSlot(0, 'element', { tool: 'element', value: '#submit-btn' })
editor.setActionSlot(0, 'event', { tool: 'event-name', value: 'submit-success' })

// 7. 输出标准 Trigger
const trigger = editor.toTrigger()
console.log(JSON.stringify(trigger, null, 2))
```

## 核心概念

| 概念 | 含义 |
|---|---|
| **Trigger** | 一条完整的触发器：`{ event, conditions?, actions[] }`，即 `toTrigger()` 的输出 |
| **Template** | 模板字符串，如 `"${element} 被点击时，发送 ${eventName} 事件"`，`${key}` 为槽位 |
| **Slot (槽位)** | 模板中的可替换位置，由 `SlotDef` 声明（label + 允许填入的 tool 列表） |
| **Tool (工具)** | 槽位的填充器；分 `LeafTool`（单值输入）和 `CompositeTool`（由其他 Tool 嵌套） |
| **Leaf Tool Input** | `text` / `number` / `select`（`select` 携带 `options: { value, label }[]`） |
| **Segment** | 模板解析后的最小单元：`{ type: 'text', content }` 或 `{ type: 'slot', key, label, tools, value, entry }` |
| **Item State** | 编辑器运行时状态：`{ id, slotValues: Record<key, SlotValueEntry> }` |
| **Descriptor** | UI 渲染用：把 Item/Template 解析为 `Segment[]`，附加 `SlotValueEntry` 上下文 |
| **Value Source** | 同类型的 Condition + Tool 集合，可作为另一个槽位的可选值来源 |

### 数据流

```
定义侧 (开发者)                       运行侧 (编辑器)
─────────────────                    ─────────────────
War3EventDef / War3ActionDef /         editor.applyPreset(preset)
War3ConditionDef / ToolDef                      │
        │                                      ▼
        └── defineWar3Preset ──▶ Preset    War3Registry
                                            │
                                  状态操作 │ setEvent / addAction / ...
                                            ▼
                                  War3EditorStateManager
                                            │
                  ┌─────────────────────────┼─────────────────────────┐
                  ▼                         ▼                         ▼
           parseTemplate             resolveSlotDisplayText         toTrigger
           (→ ItemDescriptor)         (→ 人类可读展示文本)            (→ Trigger JSON)
```

## API 概览

### 工厂与预设

| 导出 | 说明 |
|---|---|
| `createWar3Editor()` | 创建 `War3Editor` 实例（`Editor<War3EditorState>`） |
| `defineWar3Preset(options)` | 打包为 `Preset<War3Editor>`，批量注册 events / actions / conditions / tools |
| `defineLeafTool(def)` | 类型安全的叶子工具工厂 |
| `defineCompositeTool(def)` | 类型安全的复合工具工厂（槽位值类型从 `resolve` 推断） |
| `defineCondition(def)` | 类型安全的 Condition 工厂 |

### `War3Editor` 方法

- **注册**：`registerEvent` / `registerAction` / `registerCondition` / `registerTool`
- **查询**：`getAvailableEvents` / `getAvailableActions` / `getAvailableConditions`
- **描述符**：`getEventDescriptor` / `getActionDescriptor(index)` / `getConditionDescriptor(index)` / `getToolDescriptor(name, slotValues?)` / `getSlotTools(slotDef)`
- **状态操作**：
  - Event：`setEvent` / `clearEvent` / `setEventSlot`（单事件便捷）；多事件：`addEvent` / `removeEvent` / `setEventSlotAt(index, …)`
  - Action：`addAction` / `removeAction` / `moveAction` / `setActionSlot`
  - Condition：`addCondition` / `removeCondition` / `setConditionSlot`
- **值来源**：`getValueSources(valueType?)` 返回 `{ conditions, tools }`
- **生命周期**：`getState` / `onChange` / `reset` / `dispose`
- **序列化**：`toTrigger(triggerId?)` 输出标准 Trigger；`resolveSlotValue(entry)` 解析单个槽位

### 独立函数

| 导出 | 说明 |
|---|---|
| `parseTemplate(template, slots?, slotValues?)` | 模板 → `Segment[]` |
| `resolveSlotDisplayText(entry, registry, fallbackLabel)` | `SlotValueEntry` → 可读文本 |
| `resolveSlotValue(entry, registry)` | `SlotValueEntry` → `Value`（递归） |
| `getEventDescriptor` / `getActionDescriptor` / `getConditionDescriptor` / `getToolDescriptor` / `getSlotToolDescriptors` | 不走 Editor 的纯函数版本（直接接收 `War3Registry`） |

### `toTrigger` 输出结构

与 `@triggerix/core` 完全兼容：

```ts
{
  id: string,                  // 默认 crypto.randomUUID()，可外部传入
  events: { type: string, payload?: Record<string, Value> }[], // 多事件 OR 触发
  conditions?: ConditionItem[], // 扁平数组，默认隐式 AND，可嵌套显式 group
  actions: Action[]            // [{ type, params? }]
}
```

> 注：编辑期 Condition 在内部以 `Action` 形式（`{ type, params }`）存储，作为扁平 `ConditionItem[]` 透传至运行时；Condition ↔ Action 的语义映射由运行时层完成。

## 模块结构

```
src/
├── index.ts                 # 统一入口
├── types.ts                 # 所有类型定义
├── createWar3Editor.ts      # 工厂函数：组装 Registry + State + Serializer
├── preset.ts                # defineWar3Preset → Preset<War3Editor>
├── registry.ts              # War3Registry（继承 BaseRegistry + Tool）
├── state.ts                 # War3EditorStateManager（继承 ObservableState）
├── parser.ts                # 模板字符串 → Segment[]
├── descriptor.ts            # Item/Template → ItemDescriptor / ToolDescriptor
├── display.ts               # SlotValueEntry → 人类可读展示文本
├── serializer.ts            # War3EditorState → Trigger JSON
└── helpers.ts               # defineLeafTool / defineCompositeTool / defineCondition
```

## 模板系统详解

### 模板字符串

模板中以 `${key}` 标记槽位，`key` 须为 `SlotDef` 中声明的键：

```ts
{
  id: 'element-focus',
  label: '元素获得焦点',
  template: '${element} 获得焦点时，切换为 ${state}',
  slots: {
    element: { label: '元素', tools: ['element'] },
    state:   { label: '状态', tools: ['boolean'] }
  }
}
```

解析后 `Segment[]`：

```ts
[
  { type: 'slot', key: 'element', label: '元素', tools: ['element'], value: ..., entry: ... },
  { type: 'text', content: ' 获得焦点时，切换为 ' },
  { type: 'slot', key: 'state',   label: '状态', tools: ['boolean'], value: ..., entry: ... }
]
```

> **未知 `${key}`**：未在 `slots` 中声明的占位符将作为普通文本保留（不抛错），便于迁移期兼容。

### Leaf Tool

```ts
defineLeafTool<boolean, boolean>({
  type: 'boolean', // 语义类型（用于 getValueSources 过滤）
  label: '开关',
  input: {
    type: 'select',
    options: [{ value: true, label: '启用' }]
  },
  resolve: v => v // 序列化为 Trigger.params 时的最终值
})
```

`resolve` 接收 `input` 类型，返回**最终写入 `params`** 的值（可做单位换算、字符串映射等）。

### Composite Tool

```ts
const emitEventTool = defineCompositeTool<
  { element: string, event: string },
  { target: string, type: string }
>({
  type: 'emit-event',
  label: '发送事件',
  template: '从 ${element} 派发 ${event}',
  slots: {
    element: { label: '元素',   tools: ['element'] },
    event:   { label: '事件名', tools: ['event-name'] }
  },
  resolve: ({ element, event }) => ({ target: element, type: event })
})
```

- 槽位键 `source` / `target` 会从 `resolve` 参数中推断，保证 `slots` 键与 `resolve` 参数键一致
- Composite 可无限嵌套（一个 Composite 的槽位可以填入另一个 Composite）

## 编辑器状态形状

```ts
interface War3EditorState {
  events: ItemState[]   // 多事件源（运行时按 OR 匹配）；UI 单事件时通常为 0 或 1 项
  conditions: ItemState[] // 条件列表（AND 语义）
  actions: ItemState[]   // 动作列表（顺序敏感）
}

interface ItemState {
  id: string // 对应 War3EventDef/Action/Condition 的 id
  slotValues: Record<string, SlotValueEntry> // 各槽位填充值
}

interface SlotValueEntry {
  tool: string | null // 选中的 tool 名
  value: unknown // leaf: 原值; composite: 通常为空对象
  subSlots?: Record<string, SlotValueEntry> // composite 递归结构
}
```

## 监听变化

```ts
const editor = createWar3Editor()
const off = editor.onChange((state) => {
  // 触发时机：setEvent / addAction / setActionSlot / reset ...
  console.log('state changed:', state)
})

off() // 取消订阅
```

`onChange` 返回的解绑函数也可以在 `dispose()` 后自动失效。

## 开发

### 命令

```bash
pnpm install        # 安装依赖
pnpm dev            # 监听构建（生成 stub 供本地调试）
pnpm build          # 产出 dist/{index.mjs,index.cjs,index.d.ts}
pnpm typecheck      # tsc --noEmit
pnpm lint           # eslint --cache
pnpm release        # bumpp 交互式升级版本号并打 tag
```

### 构建产物

- ESM: `dist/index.mjs`
- CJS: `dist/index.cjs`
- 类型: `dist/index.d.ts`

由 [unbuild](https://github.com/unjs/unbuild) 打包，`@triggerix/core` 与 `@triggerix/editor` 标记为 external。

### 质量保障

- TypeScript `strict: true` + `declaration: true`
- ESLint (`@antfu/eslint-config`) + pre-commit (simple-git-hooks + nano-staged)
- 发布：推送 `v*` tag → GitHub Actions 自动 `changelogithub` + `pnpm publish`

## License

[MIT](./LICENSE) © Triggerix Collective
