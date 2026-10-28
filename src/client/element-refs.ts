/**
 * Startapus Browser — element references and evidence for the session composer.
 *
 * A picked page element becomes a native reference chip (`Элемент1`, …) in the
 * agent input. Chips are only sendable when their source is registered with the
 * input-trigger registry: submission resolves each chip through the owning
 * source's `codec.serialize`.
 *
 * The pick payload is *evidence*, not a screenshot substitute: identity,
 * accessibility, geometry, computed styles, layout context and page
 * environment. The model-facing serialization is deliberately compact —
 * evidence stays in memory, the model gets the decision-relevant subset.
 *
 * @module startapus-browser/client/element-refs
 */

import type { Context as ClientContext } from '@deepseek-ai/cordis'

/** One element portrait produced by the injected picker. */
export interface ElementPick {
  selector: string
  tag: string
  id: string
  classes: string
  testid?: string
  role: string
  a11y?: {
    role?: string
    name?: string
    ariaHidden?: string
    ariaDisabled?: string
    ariaExpanded?: string
    tabIndex?: string
  }
  text: string
  href: string
  src?: string
  rect: { x: number; y: number; width: number; height: number; docX?: number; docY?: number }
  box?: {
    clientWidth?: number
    clientHeight?: number
    scrollWidth?: number
    scrollHeight?: number
    scrollable?: boolean
    overflowX?: boolean
    overflowY?: boolean
  }
  state?: {
    disabled?: boolean
    readOnly?: boolean
    checked?: boolean | null
    hidden?: boolean
    focused?: boolean
    inShadowRoot?: boolean
  }
  computed?: Record<string, string>
  pseudo?: {
    before?: { content?: string; display?: string; color?: string; fontSize?: string } | null
    after?: { content?: string; display?: string; color?: string; fontSize?: string } | null
  }
  ancestors?: Array<{ tag: string; id: string; classes: string; testid?: string }>
  fragment?: Array<{ depth: number; tag: string; id: string; classes: string; text: string }>
  outerHTML?: string
  env?: {
    url?: string
    title?: string
    viewport?: { width: number; height: number }
    dpr?: number
    zoom?: number
    scrollX?: number
    scrollY?: number
    theme?: string
    reducedMotion?: boolean
    colorScheme?: string
  }
  /** Page url (kept for older payloads). */
  url?: string
  title?: string
}

/** Reference source name shared with the input-trigger machinery. */
export const ELEMENT_SOURCE = 'startapus-element'

interface StoredElement {
  label: string
  pick: ElementPick
}

const elements = new Map<string, StoredElement>()
const lexiconListeners = new Set<() => void>()
let seq = 0

function notifyLexicon(): void {
  for (const listener of lexiconListeners) {
    try {
      listener()
    } catch {
      // a broken decoration listener must not break picking
    }
  }
}

function labelOf(ref: string): string {
  return elements.get(ref)?.label ?? ref
}

/** Record one picked element and return its chip identity. */
export function rememberElement(pick: ElementPick): { ref: string; label: string } {
  seq += 1
  const ref = `element-${seq}`
  const label = `Элемент${seq}`
  elements.set(ref, { label, pick })
  notifyLexicon()
  return { ref, label }
}

/** Everything captured for one pick, for the evidence store. */
export function pickOf(ref: string): ElementPick | undefined {
  return elements.get(ref)?.pick
}

/** Format a tag with id/classes/role, trimmed for the model. */
function tagLine(p: ElementPick): string {
  const attrs: string[] = []
  if (p.id !== '') attrs.push(` id="${p.id}"`)
  if (p.classes !== '') attrs.push(` class="${p.classes.slice(0, 120)}"`)
  if (p.role !== '') attrs.push(` role="${p.role}"`)
  if (p.testid !== undefined && p.testid !== '') attrs.push(` data-testid="${p.testid}"`)
  return `<${p.tag}${attrs.join('')}>`
}

/** Model-facing serialization of one element reference. */
export function elementModelText(ref: string): string {
  const entry = elements.get(ref)
  if (!entry) throw new Error(`неизвестная ссылка на элемент «${ref}»`)
  const p = entry.pick
  const env = p.env
  const url = env?.url ?? p.url ?? ''
  const title = env?.title ?? p.title ?? ''

  const lines: string[] = []
  lines.push(`${entry.label} — элемент страницы ${url}${title === '' ? '' : ` («${title}»)`}:`)
  lines.push(`- селектор: ${p.selector}`)
  lines.push(`- тег: ${tagLine(p)}`)
  if (p.a11y !== undefined) {
    const a11yBits: string[] = []
    if (p.a11y.role !== undefined && p.a11y.role !== '') a11yBits.push(`role=${p.a11y.role}`)
    if (p.a11y.name !== undefined && p.a11y.name !== '') a11yBits.push(`name="${p.a11y.name.slice(0, 80)}"`)
    if (p.a11y.ariaHidden !== undefined && p.a11y.ariaHidden !== '') a11yBits.push(`aria-hidden=${p.a11y.ariaHidden}`)
    if (p.a11y.ariaExpanded !== undefined && p.a11y.ariaExpanded !== '') a11yBits.push(`aria-expanded=${p.a11y.ariaExpanded}`)
    if (p.a11y.tabIndex !== undefined && p.a11y.tabIndex !== '') a11yBits.push(`tabindex=${p.a11y.tabIndex}`)
    if (a11yBits.length > 0) lines.push(`- a11y: ${a11yBits.join(', ')}`)
  }
  if (p.text !== '') lines.push(`- текст: ${JSON.stringify(p.text.slice(0, 200))}`)
  if (p.href !== '') lines.push(`- href: ${p.href.slice(0, 160)}`)

  const rect = p.rect
  const docX = rect.docX ?? rect.x
  const docY = rect.docY ?? rect.y
  const envBits: string[] = []
  if (env?.viewport !== undefined) envBits.push(`viewport ${env.viewport.width}x${env.viewport.height}`)
  if (env?.dpr !== undefined) envBits.push(`dpr ${env.dpr}`)
  if (env?.zoom !== undefined && env.zoom !== 1) envBits.push(`zoom ${env.zoom}`)
  if (env?.theme !== undefined) envBits.push(`theme ${env.theme}`)
  if (env !== undefined && ((env.scrollX ?? 0) !== 0 || (env.scrollY ?? 0) !== 0)) {
    envBits.push(`scroll ${env.scrollX ?? 0},${env.scrollY ?? 0}`)
  }
  lines.push(`- положение: ${rect.width}x${rect.height} @ ${rect.x},${rect.y} (страница ${docX},${docY})` +
    (envBits.length > 0 ? `; ${envBits.join('; ')}` : ''))

  if (p.box !== undefined) {
    const boxBits: string[] = []
    if (p.box.clientWidth !== undefined) boxBits.push(`client ${p.box.clientWidth}x${p.box.clientHeight ?? 0}`)
    if (p.box.scrollWidth !== undefined) boxBits.push(`scroll ${p.box.scrollWidth}x${p.box.scrollHeight ?? 0}`)
    if (p.box.overflowX === true || p.box.overflowY === true) {
      boxBits.push(`переполнение ${p.box.overflowX === true ? 'X' : ''}${p.box.overflowY === true ? 'Y' : ''}`)
    }
    if (boxBits.length > 0) lines.push(`- box: ${boxBits.join(', ')}`)
  }

  if (p.state !== undefined) {
    const stateBits: string[] = []
    if (p.state.disabled === true) stateBits.push('disabled')
    if (p.state.readOnly === true) stateBits.push('readOnly')
    if (p.state.checked === true) stateBits.push('checked')
    if (p.state.hidden === true) stateBits.push('hidden')
    if (p.state.focused === true) stateBits.push('focused')
    if (p.state.inShadowRoot === true) stateBits.push('в shadow root')
    if (stateBits.length > 0) lines.push(`- состояние: ${stateBits.join(', ')}`)
  }

  const computed = p.computed ?? {}
  const keys = Object.keys(computed).sort().slice(0, 24)
  if (keys.length > 0) {
    const pairs = keys.map((key) => `${key}=${(computed[key] ?? '').slice(0, 60)}`)
    lines.push(`- computed (${Object.keys(computed).length}, показаны ${keys.length}): ${pairs.join('; ')}`)
  }

  const before = p.pseudo?.before?.content ?? ''
  const after = p.pseudo?.after?.content ?? ''
  if (before !== '' || after !== '') {
    const parts: string[] = []
    if (before !== '') parts.push(`::before content=${before}`)
    if (after !== '') parts.push(`::after content=${after}`)
    lines.push(`- pseudo: ${parts.join('; ')}`)
  }

  const ancestors = p.ancestors ?? []
  if (ancestors.length > 0) {
    const chain = ancestors.slice(0, 3).map((a) => {
      const cls = a.classes === '' ? '' : `.${a.classes.split(/\s+/).slice(0, 2).join('.')}`
      return `${a.tag}${a.id === '' ? '' : `#${a.id}`}${cls}`
    })
    lines.push(`- предки: ${chain.join(' < ')}`)
  }

  const fragment = p.fragment ?? []
  if (fragment.length > 0) {
    lines.push(`- фрагмент (${fragment.length} узлов, глубина ≤4):`)
    for (const node of fragment.slice(0, 20)) {
      const cls = node.classes === '' ? '' : `.${node.classes.split(/\s+/).slice(0, 2).join('.')}`
      const own = node.text === '' ? '' : ` "${node.text}"`
      lines.push(`${'  '.repeat(Math.min(node.depth, 4))}<${node.tag}${node.id === '' ? '' : `#${node.id}`}${cls}>${own}`)
    }
    if (fragment.length > 20) lines.push(`  … ещё ${fragment.length - 20} узлов`)
  }

  return lines.filter(Boolean).join('\n')
}

/**
 * The `@` trigger source owning `ЭлементN` chips: candidates menu, decoration
 * lexicon, and the codec that turns a chip into model text on submit.
 */
export function elementSource(): Record<string, unknown> {
  return {
    trigger: '@',
    name: ELEMENT_SOURCE,
    order: 90,
    candidates: async () => [...elements.entries()].reverse().map(([ref, entry]) => ({
      name: entry.label,
      description: `<${entry.pick.tag}> ${entry.pick.text.slice(0, 60)}`,
      value: ref,
    })),
    onPick: (pick: { action?: string; candidate?: { value?: string } }) => {
      const ref = pick?.candidate?.value
      const entry = ref === undefined ? undefined : elements.get(ref)
      if (pick?.action !== 'pick' || ref === undefined || entry === undefined) return undefined
      return {
        insert: {
          source: ELEMENT_SOURCE,
          ref,
          label: entry.label,
          clipboardText: entry.label,
          appearance: 'session',
        },
      }
    },
    lexicon: () => [...elements.values()].map((entry) => entry.label),
    subscribeLexicon: (_session: unknown, listener: () => void) => {
      lexiconListeners.add(listener)
      return () => lexiconListeners.delete(listener)
    },
    codec: {
      clipboardText: (ref: string) => labelOf(ref),
      serialize: async (ref: string) => elementModelText(ref),
    },
  }
}

/**
 * Insert one picked element as a reference chip at the end of the session
 * composer draft.
 */
export function insertElementRef(ctx: ClientContext, sessionId: string, pick: ElementPick): string {
  const sessions = (ctx as unknown as {
    sessions: { binding(id: string): { ctx: unknown } | undefined }
  }).sessions
  const conversation = (ctx as unknown as {
    conversation: {
      input: {
        for(target: unknown): {
          state: {
            getSnapshot(): { draft: string; draftRev: number; occurrences: Array<{ length: number }> }
          }
          insertReference(
            ref: { source: string; ref: string; label: string; clipboardText: string; appearance: string },
            span: { start: number; end: number; draftRev: number },
          ): boolean
        }
      }
    }
  }).conversation

  const binding = sessions.binding(sessionId)
  if (binding === undefined) throw new Error('сессия не найдена')
  const input = conversation.input.for(binding.ctx)
  const state = input.state.getSnapshot()
  const { ref, label } = rememberElement(pick)
  const chipExtra = state.occurrences.reduce((sum, occurrence) => sum + (occurrence.length - 1), 0)
  const at = Math.max(0, state.draft.length - chipExtra)
  const applied = input.insertReference(
    { source: ELEMENT_SOURCE, ref, label, clipboardText: label, appearance: 'session' },
    { start: at, end: at, draftRev: state.draftRev },
  )
  if (!applied) throw new Error('композер отклонил вставку')
  return label
}
