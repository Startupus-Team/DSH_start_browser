#!/usr/bin/env node
/**
 * Schema/contract diagnostics for every registered agent tool.
 *
 * Catches the class of defects that live between "the tool exists" and "the tool
 * is usable": missing output renderer, required field that is not declared,
 * additionalProperties left open, duplicate names, empty descriptions, and
 * misplaced parameters (e.g. `reload` landing on the wrong tool).
 */
import { exposedToolSurface, toolSurface } from '../lib/index.js'

// The full set (original names) and what the agent actually sees (consolidated).
const fullTools = toolSurface()
const tools = [...fullTools, ...exposedToolSurface().filter((tool) => !fullTools.some((row) => row.name === tool.name && row.description === tool.description))]
const exposed = exposedToolSurface()
const problems = []
const expectLater = (check, message) => { if (!check()) problems.push(message) }
const rows = []

for (const tool of tools) {
  const name = String(tool.name ?? '')
  const description = String(tool.description ?? '')
  const params = tool.parameters ?? {}
  const props = params.properties ?? {}
  const required = Array.isArray(params.required) ? params.required : []
  const issues = []

  if (name === '') issues.push('нет name')
  if (description.length < 20) issues.push(`короткое описание (${description.length})`)
  if (params.type !== 'object') issues.push('parameters не object')
  if (params.additionalProperties !== false) issues.push('additionalProperties не false')
  for (const field of required) {
    if (!(field in props)) issues.push(`required "${field}" не объявлен в properties`)
  }
  for (const [key, value] of Object.entries(props)) {
    const spec = value
    if (typeof spec !== 'object' || spec === null) { issues.push(`${key}: схема не объект`); continue }
    if (typeof spec.type !== 'string') issues.push(`${key}: нет type`)
    if (spec.type === 'string' && typeof spec.description !== 'string') issues.push(`${key}: нет description`)
    if (spec.enum !== undefined && !Array.isArray(spec.enum)) issues.push(`${key}: enum не массив`)
  }
  const output = tool.output
  if (output === undefined) issues.push('нет output')
  else {
    if (typeof output.render !== 'function') issues.push('output.render не функция')
    else {
      try {
        const rendered = output.render({ ok: true })
        if (!Array.isArray(rendered) || rendered.length === 0) issues.push('output.render вернул не массив')
      } catch (error) {
        issues.push(`output.render упал: ${String(error)}`)
      }
    }
    if (output.schema === undefined) issues.push('нет output.schema')
  }
  if (typeof tool.execute !== 'function') issues.push('нет execute')

  rows.push({ name, args: Object.keys(props), issues })
  for (const issue of issues) problems.push(`${name}: ${issue}`)
}

for (const [label, surface] of [['full', fullTools], ['exposed', exposed]]) {
  const seen = new Set()
  for (const tool of surface) {
    if (seen.has(tool.name)) problems.push(`дубликат инструмента (${label}): ${tool.name}`)
    seen.add(tool.name)
  }
}
const exposedNames = new Set(exposed.map((tool) => String(tool.name)))
expectLater(() => exposed.length <= 24, `агенту видно ${exposed.length} инструментов, ожидалось ≤24`)
expectLater(() => ['ui_tab', 'ui_status', 'ui_open', 'ui_pick', 'ui_evidence', 'task_create', 'task_list', 'task_update'].every((name) => exposedNames.has(name)), 'нет консолидированного инструмента')
expectLater(() => ['ui_tabs', 'ui_new_tab', 'ui_close_tab', 'ui_focus_tab', 'ui_activate_tab', 'ui_measure', 'ui_guest_state', 'ui_navigate', 'ui_pick_area', 'ui_area', 'task_batch', 'task_claim', 'task_get', 'ui_template', 'ui_export'].every((name) => !exposedNames.has(name)), 'старое имя осталось в поверхности агента')
expectLater(() => exposedToolSurface(true).length === fullTools.length, 'legacyToolNames не возвращает полный набор')

// Contract expectations that regressions already violated once.
const byName = new Map(fullTools.map((tool) => [String(tool.name), tool]))
const expect = (condition, message) => { if (!condition) problems.push(message) }
expect(byName.get('ui_verify')?.parameters?.properties?.reload !== undefined, 'ui_verify: нет параметра reload (перезагрузка перед замером)')
expect(byName.get('task_create')?.parameters?.properties?.reload === undefined, 'task_create: reload попал не в тот инструмент')
expect(byName.get('ui_act')?.parameters?.properties?.ref !== undefined, 'ui_act: нет параметра ref (ref_N из ui_read_page)')
expect(byName.get('ui_read_page')?.parameters?.properties?.limit !== undefined, 'ui_read_page: нет limit')
expect(byName.get('ui_screenshot')?.parameters?.properties?.selector !== undefined, 'ui_screenshot: нет selector')

for (const row of rows) {
  const mark = row.issues.length === 0 ? 'OK  ' : 'FAIL'
  console.log(`${mark} ${row.name.padEnd(14)} args: ${row.args.join(',') || '—'}`)
}
if (problems.length > 0) {
  console.log('\nПроблемы:')
  for (const problem of problems) console.log(`- ${problem}`)
  console.log(`TOOLS FAILED: ${problems.length}`)
  process.exit(1)
}
console.log(`TOOLS OK: ${fullTools.length} полных, ${exposed.length} видно агенту`)
