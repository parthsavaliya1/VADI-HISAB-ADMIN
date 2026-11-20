import { useEffect, useMemo, useState } from 'react'
import { translationApi } from '../api'
import type { TranslationCatalog as Catalog, TranslationManifest as Manifest } from '../api'
import './translations.css'

const labels: Record<string, string> = { en: 'English', gu: 'ગુજરાતી', hi: 'हिन्दी', mr: 'मराठी', pa: 'ਪੰਜਾਬੀ', ta: 'தமிழ்', te: 'తెలుగు' }
function flatten(catalog: Catalog, prefix = '', result: Record<string, string> = {}) {
  for (const [key, value] of Object.entries(catalog)) {
    const name = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') result[name] = value
    else flatten(value, name, result)
  }
  return result
}
function setValue(catalog: Catalog, key: string, value: string): Catalog {
  const parts = key.split('.')
  if (parts.some(part => !/^[a-zA-Z0-9_-]+$/.test(part) || ['__proto__', 'constructor', 'prototype'].includes(part))) throw Error('Use dot-separated letters, numbers, underscores or hyphens.')
  const result = structuredClone(catalog)
  let node = result
  for (const part of parts.slice(0, -1)) {
    if (typeof node[part] === 'string') throw Error('A parent key already contains text.')
    node = (node[part] ||= {}) as Catalog
  }
  if (typeof node[parts.at(-1)!] === 'object') throw Error('This key already contains a section.')
  node[parts.at(-1)!] = value
  return result
}
export default function TranslationsPage() {
  const [catalogs, setCatalogs] = useState<Record<string, Catalog>>({})
  const [manifest, setManifest] = useState<Manifest>({ version: 0, languages: {} })
  const [languages, setLanguages] = useState<string[]>(Object.keys(labels))
  const [selected, setSelected] = useState('gu')
  const [query, setQuery] = useState('')
  const [missingOnly, setMissingOnly] = useState(false)
  const [englishOnly, setEnglishOnly] = useState(false)
  const [newKey, setNewKey] = useState('')
  const [newEnglish, setNewEnglish] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [dirty, setDirty] = useState(false)
  const [page, setPage] = useState(0)
  const [draftRevisions, setDraftRevisions] = useState<Record<string, string | null>>({})
  const [release, setRelease] = useState('')
  const [previewKey, setPreviewKey] = useState('common.save')
  const [parameters, setParameters] = useState('{"count":2,"name":"VADI"}')
  async function run(action: () => Promise<void>) {
    setBusy(true); setError(''); setMessage('')
    try { await action() } catch (reason) { setError(reason instanceof Error ? reason.message : 'Translation operation failed') }
    finally { setBusy(false) }
  }
  async function reload() {
    const state = await translationApi.state()
    const drafts = await Promise.all(state.languages.map(async lang => [lang, (await translationApi.draft(lang))?.revision || null] as const))
    setDraftRevisions(Object.fromEntries(drafts))
    setCatalogs(state.catalogs); setManifest(state.manifest); setLanguages(state.languages); setDirty(false)
  }
  useEffect(() => { void run(reload) }, [])
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) { event.preventDefault(); event.returnValue = '' } }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  const flat = useMemo(() => Object.fromEntries(languages.map(lang => [lang, flatten(catalogs[lang] || {})])), [catalogs, languages])
  const keys = useMemo(() => [...new Set(Object.values(flat).flatMap(pack => Object.keys(pack)))].sort(), [flat])
  const filtered = keys.filter(key => (key.toLowerCase().includes(query.toLowerCase()) || Object.values(flat).some(pack => pack[key]?.toLowerCase().includes(query.toLowerCase()))) &&
    (!missingOnly || languages.some(lang => flat[lang]?.[key] === undefined || (flat.en?.[key]?.trim() && !flat[lang]?.[key]?.trim()))) &&
    (!englishOnly || languages.some(lang => lang !== 'en' && flat[lang]?.[key] === flat.en?.[key])))
  const visible = filtered.slice(page * 50, (page + 1) * 50)
  let preview = ''
  try {
    const values = JSON.parse(parameters)
    const plural = typeof values.count === 'number' ? new Intl.PluralRules(`${selected}-IN`).select(values.count) : null
    preview = (plural ? flat[selected]?.[`${previewKey}_${plural}`] || flat[selected]?.[`${previewKey}_other`] : undefined) || flat[selected]?.[previewKey] || flat.en?.[previewKey] || previewKey
    preview = preview.replace(/\{\{?(\w+)\}?\}/g, (match, key: string) => Object.hasOwn(values, key) ? String(values[key]) : match)
  } catch { preview = 'Enter a JSON object for preview values.' }
  function edit(lang: string, key: string, value: string) {
    try { setCatalogs(current => ({ ...current, [lang]: setValue(current[lang] || {}, key, value) })); setDirty(true) }
    catch (reason) { setError(String(reason)) }
  }
  async function publish(all: boolean) {
    const chosen = all ? catalogs : { [selected]: catalogs[selected] }
    for (const catalog of Object.values(chosen)) await translationApi.validate(catalog, catalogs.en)
    const next = await translationApi.publish(chosen, manifest.version)
    setManifest(next)
    // Keep unsaved edits to other languages after a selected-language publish.
    if (all) setDirty(false)
    setMessage(`Published manifest version ${next.version}. Mobile apps refresh on startup or foreground.`)
  }
  return <section className="translation-page">
    <header><h1>Translations</h1><p>Published files and drafts live in Bunny Storage. Manifest version {manifest.version}.{dirty ? ' You have unpublished edits.' : ''}</p></header>
    {error && <p role="alert" className="translation-error">{error}</p>}
    {message && <p role="status">{message}</p>}
    <fieldset disabled={busy}>
      <div className="translation-toolbar">
        <label>Language <select value={selected} onChange={event => setSelected(event.target.value)}>{languages.map(lang => <option key={lang} value={lang}>{labels[lang] || lang}</option>)}</select></label>
        <button onClick={() => void run(async () => {
          if (draftRevisions[selected] === undefined) throw Error('Reload published files before saving a draft.')
          const saved = await translationApi.saveDraft(selected, catalogs[selected], draftRevisions[selected])
          setDraftRevisions(current => ({ ...current, [selected]: saved.revision })); setMessage('Draft saved to Bunny Storage. It is not published.')
        })}>Save draft</button>
        <button onClick={() => void run(async () => {
          if (dirty && !window.confirm('Replace this language’s local edits with its saved draft?')) return
          const draft = await translationApi.draft(selected)
          setDraftRevisions(current => ({ ...current, [selected]: draft?.revision || null }))
          if (!draft) throw Error('No saved draft for this language.')
          setCatalogs(current => ({ ...current, [selected]: draft.catalog })); setDirty(true); setMessage('Draft loaded.')
        })}>Load draft</button>
        <button onClick={() => void run(async () => { const result = await translationApi.validate(catalogs[selected], catalogs.en); setMessage(`${result.keys} keys validated.`) })}>Validate</button>
        <button onClick={() => void run(() => publish(false))}>Publish {selected}</button>
        <button onClick={() => void run(() => publish(true))}>Publish all languages</button>
        <button onClick={() => {
          const url = URL.createObjectURL(new Blob([JSON.stringify(catalogs[selected] || {}, null, 2)], { type: 'application/json' }))
          const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${selected}.json`; anchor.click(); URL.revokeObjectURL(url)
        }}>Export {selected}.json</button>
        <button onClick={() => void run(async () => { if (!dirty || window.confirm('Discard local edits and reload published files?')) await reload() })}>Reload published</button>
      </div>
      <div className="translation-toolbar">
        <label>Import language files <input type="file" accept=".json,application/json" multiple onChange={event => {
          const files = Array.from(event.target.files || []); event.target.value = ''
          void run(async () => {
            const imported: Record<string, Catalog> = {}
            for (const file of files) {
              const lang = file.name.replace(/\.json$/i, '')
              if (!languages.includes(lang)) throw Error(`Name files using supported codes, for example gu.json. Received ${file.name}`)
              if (file.size > 2 * 1024 * 1024) throw Error('Each file must be smaller than 2 MiB.')
              const catalog = JSON.parse(await file.text())
              // Structural validation first; cross-language placeholders are checked before publication.
              await translationApi.validate(catalog, imported.en || catalogs.en)
              imported[lang] = catalog
            }
            setCatalogs(current => ({ ...current, ...imported })); setDirty(true); setMessage('Files imported into the editor. Save drafts or publish when ready.')
          })
        }} /></label>
        <label>Search keys or text <input value={query} onChange={event => { setQuery(event.target.value); setPage(0) }} /></label>
        <label><input type="checkbox" checked={missingOnly} onChange={event => { setMissingOnly(event.target.checked); setPage(0) }} /> Missing translations</label>
        <label><input type="checkbox" checked={englishOnly} onChange={event => { setEnglishOnly(event.target.checked); setPage(0) }} /> Same as English</label>
      </div>
      <p>{keys.length} keys. Empty cells are missing; cells matching English may need translation or may intentionally share wording.</p>
      <div className="translation-table"><table><thead><tr><th>Key</th>{languages.map(lang => <th key={lang}>{labels[lang] || lang}</th>)}</tr></thead><tbody>
        {visible.map(key => <tr key={key}><th><button onClick={() => setPreviewKey(key)}>{key.startsWith('legacyPhrases.') ? `Legacy phrase: ${key.slice(14, 38)}…` : key}</button></th>{languages.map(lang => <td key={lang} className={flat[lang]?.[key] === undefined ? 'translation-missing' : lang !== 'en' && flat[lang]?.[key] === flat.en?.[key] ? 'translation-fallback' : ''}>
          <textarea aria-label={`${key} ${labels[lang]}`} lang={lang} value={flat[lang]?.[key] || ''} onChange={event => edit(lang, key, event.target.value)} />
        </td>)}</tr>)}
      </tbody></table></div>
      <div className="translation-toolbar"><button disabled={page === 0} onClick={() => setPage(value => value - 1)}>Previous</button><span>{filtered.length} results · Page {page + 1}</span><button disabled={(page + 1) * 50 >= filtered.length} onClick={() => setPage(value => value + 1)}>Next</button></div>
      <div className="translation-toolbar"><label>New key <input placeholder="dashboard.newLabel" value={newKey} onChange={event => setNewKey(event.target.value)} /></label><label>English text <input value={newEnglish} onChange={event => setNewEnglish(event.target.value)} /></label><button onClick={() => {
        try {
          if (!newKey || !newEnglish.trim() || keys.includes(newKey)) throw Error('Enter a new unique key and English text.')
          const updated = Object.fromEntries(languages.map(lang => [lang, setValue(catalogs[lang] || {}, newKey, lang === 'en' ? newEnglish : '')]))
          setCatalogs(updated); setDirty(true); setQuery(newKey); setPage(0); setNewKey(''); setNewEnglish('')
        } catch (reason) { setError(String(reason)) }
      }}>Add key to all files</button></div>
      <div className="translation-preview"><h2>Preview</h2><label>Key <input value={previewKey} onChange={event => setPreviewKey(event.target.value)} /></label><label>Values (JSON) <input value={parameters} onChange={event => setParameters(event.target.value)} /></label><p lang={selected}>{preview}</p></div>
      <div className="translation-toolbar"><label>Previous release <select value={release} onChange={event => setRelease(event.target.value)}><option value="">Choose release</option>{manifest.releases?.filter(id => id !== manifest.release).map(id => <option key={id} value={id}>{id}</option>)}</select></label><button disabled={!release} onClick={() => void run(async () => {
        if (!window.confirm('Restore this release? The manifest version will increase. Local edits will be replaced.')) return
        await translationApi.rollback(release, manifest.version); await reload(); setRelease(''); setMessage('Rollback published successfully.')
      })}>Publish rollback</button></div>
    </fieldset>
    {busy && <p role="status">Working with translation files…</p>}
  </section>
}
