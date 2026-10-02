import { useState, useMemo } from 'react'
import useStore from '../store/useStore'
import { importRecipe } from '../lib/recipeImport'
import { parseRecipeDescription } from '../utils/recipeDescription'
import InventoryCheck from './InventoryCheck'
import Sheet from '../ui/Sheet'
import Icon from '../ui/Icon'

export default function RecipeForm({ recipe, onClose, onSaved }) {
  const { addRecipe, updateRecipe, cookidooSettings, recipes: allRecipes } = useStore()
  const isEdit = !!recipe

  const [sourceUrl, setSourceUrl]   = useState(recipe?.sourceUrl ?? '')
  const [title, setTitle]           = useState(recipe?.title ?? '')
  const [author, setAuthor]         = useState(recipe?.author ?? '')
  const [videoId, setVideoId]       = useState(recipe?.videoId ?? null)
  const [sourceType, setSourceType] = useState(recipe?.sourceType ?? 'youtube')
  const [thumbnailUrl, setThumb]    = useState(recipe?.thumbnailUrl ?? null)
  const [tags, setTags]             = useState(recipe?.tags ?? [])
  const [tagInput, setTagInput]     = useState('')
  const [ingredients, setIngredients] = useState(
    (recipe?.ingredients ?? []).map(i => (typeof i === 'string' ? i : i.name)).join('\n')
  )
  const [steps, setSteps]           = useState((recipe?.steps ?? []).join('\n'))
  const [notes, setNotes]           = useState(recipe?.notes ?? '')
  const [loadingMeta, setLoadingMeta] = useState(false)
  const [metaError, setMetaError]   = useState('')
  const [autoFilled, setAutoFilled] = useState(false)
  const [showPaste, setShowPaste]   = useState(false)
  const [descPaste, setDescPaste]   = useState('')
  const [pasteResult, setPasteResult] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)

  const allTags = useMemo(() => {
    const s = new Set()
    allRecipes.forEach(r => (r.tags ?? []).forEach(t => s.add(t)))
    return [...s].sort((a, b) => a.localeCompare(b, 'de'))
  }, [allRecipes])

  const filteredSuggestions = useMemo(() => {
    if (!tagInput.trim()) return allTags.filter(t => !tags.includes(t))
    const q = tagInput.toLowerCase()
    return allTags.filter(t => !tags.includes(t) && t.toLowerCase().includes(q))
  }, [tagInput, allTags, tags])

  function applyPastedDescription() {
    const { ingredients: ing, steps: st } = parseRecipeDescription(descPaste)
    if (ing.length) setIngredients(ing.join('\n'))
    if (st.length)  setSteps(st.join('\n'))
    setPasteResult(`${ing.length} Zutaten, ${st.length} Schritte erkannt`)
  }

  // Zutaten-Textarea → Objekte für die Gewürz-Zuordnung (live)
  const ingredientList = useMemo(
    () => ingredients.split('\n').map(l => l.trim()).filter(Boolean).map(name => ({ name, amount: '' })),
    [ingredients]
  )

  async function loadMeta() {
    if (!sourceUrl.trim()) return
    setLoadingMeta(true)
    setMetaError('')
    setAutoFilled(false)
    try {
      const m = await importRecipe(sourceUrl.trim(), cookidooSettings)
      if (m.title) setTitle(m.title)
      if (m.author) setAuthor(m.author)
      setVideoId(m.videoId ?? null)
      setSourceType(m.sourceType ?? 'web')
      if (m.thumbnailUrl) setThumb(m.thumbnailUrl)
      // Zutaten/Schritte übernehmen (nur wenn Felder leer)
      let filled = false
      if (m.ingredients?.length && !ingredients.trim()) {
        setIngredients(m.ingredients.join('\n')); filled = true
      }
      if (m.steps?.length && !steps.trim()) {
        setSteps(m.steps.join('\n')); filled = true
      }
      setAutoFilled(filled)
      // Nur bei YouTube ohne Treffer das Beschreibungs-Einfügefeld anbieten
      if (!filled && m.sourceType === 'youtube') setShowPaste(true)
    } catch (e) {
      setMetaError(e.message)
    } finally {
      setLoadingMeta(false)
    }
  }

  function addTag(t) {
    const clean = t.trim()
    if (clean && !tags.includes(clean)) setTags([...tags, clean])
    setTagInput('')
  }

  function handleSave() {
    if (!title.trim()) { setMetaError('Bitte einen Titel angeben'); return }
    const data = {
      title: title.trim(),
      sourceUrl: sourceUrl.trim(),
      sourceType,
      videoId,
      thumbnailUrl,
      author: author.trim(),
      tags,
      ingredients: ingredients.split('\n').map(l => l.trim()).filter(Boolean).map(name => ({ name, amount: '' })),
      steps: steps.split('\n').map(l => l.trim()).filter(Boolean),
      notes: notes.trim(),
    }
    if (isEdit) { updateRecipe(recipe.id, data); onSaved?.(recipe.id) }
    else { const id = addRecipe(data); onSaved?.(id) }
    onClose()
  }

  const fieldBlock = 'bg-white dark:bg-gray-800 rounded-card'
  const bareInput = 'w-full bg-transparent outline-none px-4 min-h-[48px] text-body text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500'
  const groupTitle = 'px-4 pb-1.5 text-footnote font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400'

  return (
    <Sheet title={isEdit ? 'Rezept bearbeiten' : 'Neues Rezept'} onClose={onClose}
      confirmLabel="Sichern" onConfirm={handleSave} confirmDisabled={!title.trim()}>
      <div className="space-y-5">
        {/* Import per Link */}
        <section className="px-4">
          <h3 className={groupTitle}>Aus Link übernehmen</h3>
          <div className={`${fieldBlock} flex items-center pr-1.5`}>
            <input type="url" inputMode="url" className={`${bareInput} flex-1 min-w-0`} placeholder="YouTube, Cookidoo, Chefkoch …"
              aria-label="Link zum Rezept" value={sourceUrl} onChange={e => setSourceUrl(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); loadMeta() } }} />
            <button onClick={loadMeta} disabled={!sourceUrl.trim() || loadingMeta}
              className="flex-none min-h-[36px] px-3.5 rounded-[10px] bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-200 text-callout font-semibold disabled:opacity-40">
              {loadingMeta ? 'Lädt …' : 'Laden'}
            </button>
          </div>
          {metaError
            ? <p role="alert" className="px-4 pt-1.5 text-footnote text-expired dark:text-expired-dark">{metaError}</p>
            : autoFilled
              ? <p className="px-4 pt-1.5 text-footnote text-primary-600 dark:text-primary-300 flex items-center gap-1"><Icon name="check" size={15} strokeWidth={2.6} />Zutaten &amp; Schritte übernommen – bitte kurz prüfen.</p>
              : <p className="px-4 pt-1.5 text-footnote text-gray-500 dark:text-gray-400">Titel, Bild, Zutaten und Schritte werden automatisch ausgefüllt.</p>}
        </section>

        {/* Vorschau */}
        {thumbnailUrl && (
          <div className="px-4">
            <div className={`${fieldBlock} flex items-center gap-3 p-2.5`}>
              <img src={thumbnailUrl} alt="" className="w-16 h-16 object-cover rounded-[10px] flex-none" />
              <div className="min-w-0">
                <p className="text-body font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">{title || '–'}</p>
                {author && <p className="text-footnote text-gray-500 dark:text-gray-400 truncate">{author}</p>}
              </div>
            </div>
          </div>
        )}

        {/* Titel + Tags */}
        <section className="px-4">
          <h3 className={groupTitle}>Rezept</h3>
          <div className={`${fieldBlock} divide-y divide-gray-100 dark:divide-gray-700`}>
            <input type="text" className={bareInput} value={title} onChange={e => setTitle(e.target.value)} placeholder="Titel (Pflicht)" aria-label="Titel" />
            <div className="relative">
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-4 pt-2.5">
                  {tags.map(t => (
                    <span key={t} className="inline-flex items-center gap-0.5 pl-2.5 rounded-full bg-primary-50 dark:bg-primary-900 text-primary-600 dark:text-primary-200 text-footnote font-semibold">
                      {t}
                      <button onClick={() => setTags(tags.filter(x => x !== t))} aria-label={`Tag ${t} entfernen`}
                        className="w-7 h-7 flex items-center justify-center rounded-full"><Icon name="close" size={13} strokeWidth={2.6} /></button>
                    </span>
                  ))}
                </div>
              )}
              <input type="text" className={bareInput} placeholder="Tag hinzufügen, z. B. Suppe, schnell"
                aria-label="Tag hinzufügen" enterKeyHint="done"
                value={tagInput}
                onChange={e => { setTagInput(e.target.value); setShowSuggestions(true) }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(tagInput) } }}
              />
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-10 left-2 right-2 top-full mt-1 bg-white dark:bg-gray-700 rounded-[14px] shadow-xl max-h-44 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-600">
                  {filteredSuggestions.slice(0, 8).map(t => (
                    <button key={t} type="button"
                      className="w-full text-left px-4 min-h-[44px] text-body text-gray-800 dark:text-gray-100 active:bg-gray-100 dark:active:bg-gray-600"
                      onMouseDown={e => { e.preventDefault(); addTag(t); setShowSuggestions(false) }}>
                      {t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Rezepttext einfügen → automatisch erkennen */}
        <section className="px-4">
          {!showPaste ? (
            <div className={fieldBlock}>
              <button onClick={() => setShowPaste(true)}
                className="w-full flex items-center gap-3 px-4 min-h-[50px] text-left text-body font-semibold text-primary-500 dark:text-primary-300">
                <Icon name="sparkle" size={20} />Rezepttext einfügen &amp; erkennen
              </button>
            </div>
          ) : (
            <>
              <h3 className={groupTitle}>Rezepttext erkennen</h3>
              <div className={`${fieldBlock} p-3 space-y-2.5`}>
                <p className="text-footnote text-gray-500 dark:text-gray-400">
                  Füge einen beliebigen Rezepttext ein (z. B. YouTube-Beschreibung, Buch oder Nachricht). Zutaten &amp; Schritte werden automatisch erkannt.
                </p>
                <textarea className="input resize-none" rows={4} placeholder="Rezepttext hier einfügen …"
                  value={descPaste} onChange={e => setDescPaste(e.target.value)} />
                <div className="flex items-center gap-3">
                  <button onClick={applyPastedDescription} disabled={!descPaste.trim()} className="btn-secondary px-5 disabled:opacity-40">Erkennen</button>
                  {pasteResult && <span className="flex items-center gap-1 text-footnote font-semibold text-primary-600 dark:text-primary-300"><Icon name="check" size={15} strokeWidth={2.6} />{pasteResult}</span>}
                </div>
              </div>
            </>
          )}
        </section>

        {/* Zutaten */}
        <section className="px-4">
          <h3 className={groupTitle}>Zutaten · eine pro Zeile</h3>
          <textarea className={`${fieldBlock} ${bareInput} py-3 resize-none block`} rows={6} aria-label="Zutaten"
            placeholder={'z. B.\n1 Hähnchen\n2 Karotten\nSalz, Pfeffer'}
            value={ingredients} onChange={e => setIngredients(e.target.value)} />
        </section>

        {/* Bestandscheck (live, auch ohne Speichern nutzbar) */}
        {ingredientList.length > 0 && (
          <section className="space-y-1.5">
            <h3 className={`px-8 text-footnote font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400`}>Bestandscheck</h3>
            <InventoryCheck ingredients={ingredientList} />
          </section>
        )}

        {/* Schritte */}
        <section className="px-4">
          <h3 className={groupTitle}>Zubereitung · ein Schritt pro Zeile</h3>
          <textarea className={`${fieldBlock} ${bareInput} py-3 resize-none block`} rows={6} aria-label="Zubereitung"
            placeholder={'1. Zwiebeln anbraten …\n2. Brühe aufgießen …'}
            value={steps} onChange={e => setSteps(e.target.value)} />
        </section>

        {/* Notizen */}
        <section className="px-4">
          <h3 className={groupTitle}>Notizen</h3>
          <textarea className={`${fieldBlock} ${bareInput} py-3 resize-none block`} rows={2} aria-label="Notizen" placeholder="Optional"
            value={notes} onChange={e => setNotes(e.target.value)} />
          {!isEdit && (
            <p className="px-4 pt-1.5 text-footnote text-gray-500 dark:text-gray-400">Nur kochen? Einfach „Abbrechen“ – dann wird nichts gespeichert.</p>
          )}
        </section>
      </div>
    </Sheet>
  )
}
