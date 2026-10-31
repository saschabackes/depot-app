import { useMemo, useRef, useState } from 'react'
import Sheet from '../../ui/Sheet'
import Icon from '../../ui/Icon'
import AutocompleteInput from '../../components/AutocompleteInput'
import { confirmAction, notify, showToast } from '../../ui/feedback'
import { localISODate } from '../../utils/date'
import { usePost } from './store'
import { KINDS, REIMB_STATES, isReimbursable, parseEuro, euroInput, formatEuro } from './logic'
import { compressImage } from './image'
import { Block, Chips, CheckCircle, PageThumb, Lightbox } from './parts'

// Brief ansehen und ausfüllen („sichten“). Mit „Sichern“ gilt der Brief als gesichtet.
export default function PostDetail({ itemId, onClose }) {
  const item = usePost(s => s.items.find(i => i.id === itemId))
  const persons = usePost(s => s.persons)
  const allItems = usePost(s => s.items)
  const allPages = usePost(s => s.pages)
  const { updateItem, removeItem, addPages, removePage } = usePost.getState()

  const pages = useMemo(() => allPages.filter(p => p.itemId === itemId).sort((a, b) => a.sortOrder - b.sortOrder), [allPages, itemId])
  const senders = useMemo(() => [...new Set(allItems.map(i => i.sender).filter(Boolean))].sort(), [allItems])

  const today = localISODate()
  const [kind, setKind] = useState(item?.kind ?? null)
  const [sender, setSender] = useState(item?.sender ?? '')
  const [personId, setPersonId] = useState(item?.personId ?? '')
  const [amount, setAmount] = useState(euroInput(item?.amountCents ?? null))
  const [dueDate, setDueDate] = useState(item?.dueDate ?? '')
  const [paid, setPaid] = useState(item?.payStatus === 'bezahlt')
  const [paidOn, setPaidOn] = useState(item?.paidOn ?? '')
  const [iban, setIban] = useState(item?.iban ?? '')
  const [reference, setReference] = useState(item?.reference ?? '')
  const [originalLocation, setOriginalLocation] = useState(item?.originalLocation ?? '')
  const [note, setNote] = useState(item?.note ?? '')
  const [reimbState, setReimbState] = useState(item?.reimbStatus ?? 'einzureichen')
  const [submittedOn, setSubmittedOn] = useState(item?.submittedOn ?? '')
  const [reimbursedOn, setReimbursedOn] = useState(item?.reimbursedOn ?? '')
  const [reimbursed, setReimbursed] = useState(euroInput(item?.reimbursedCents ?? null))
  const [viewer, setViewer] = useState(null)
  const [uploading, setUploading] = useState(false)
  const cameraRef = useRef(null)

  if (!item) return null

  const reimbursable = isReimbursable({ kind, personId }, persons)
  const needsPayment = kind && kind !== 'info'
  const amountCents = parseEuro(amount)
  const reimbursedCents = parseEuro(reimbursed)

  function chooseReimb(state) {
    setReimbState(state)
    if ((state === 'eingereicht' || state === 'erstattet') && !submittedOn) setSubmittedOn(today)
    if (state === 'erstattet' && !reimbursedOn) setReimbursedOn(today)
  }

  function togglePaid() {
    if (!paid && !paidOn) setPaidOn(today)
    setPaid(!paid)
  }

  function save() {
    const settled = reimbState === 'eingereicht' || reimbState === 'erstattet'
    updateItem(item.id, {
      kind, reviewed: true,
      sender: sender.trim(), personId, amountCents,
      dueDate: needsPayment ? dueDate : '',
      payStatus: needsPayment ? (paid ? 'bezahlt' : 'offen') : 'entfaellt',
      paidOn: needsPayment && paid ? (paidOn || today) : '',
      iban: iban.trim(), reference: reference.trim(),
      originalLocation: originalLocation.trim(), note: note.trim(),
      // Ist der Brief gerade nicht erstattungsfähig, bleiben die gespeicherten Erstattungsdaten unangetastet
      ...(reimbursable && {
        reimbStatus: reimbState,
        submittedOn: settled ? (submittedOn || today) : '',
        reimbursedOn: reimbState === 'erstattet' ? (reimbursedOn || today) : '',
        reimbursedCents: reimbState === 'erstattet' ? reimbursedCents : null,
      }),
    })
    onClose()
  }

  async function handleDelete() {
    if (!await confirmAction({ title: 'Brief löschen?', message: 'Der Eintrag und alle Fotos werden entfernt.', confirmLabel: 'Löschen', destructive: true })) return
    removeItem(item.id)
    onClose()
  }

  async function handleAddPage(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      await addPages(item.id, [await compressImage(file)])
    } catch {
      notify('Seite nicht hochgeladen', 'Prüfe die Verbindung und versuche es noch einmal.')
    } finally {
      setUploading(false)
    }
  }

  async function handleRemovePage(page) {
    if (await confirmAction({ title: 'Seite entfernen?', confirmLabel: 'Entfernen', destructive: true })) removePage(page.id)
  }

  async function copy(text, what) {
    try {
      await navigator.clipboard.writeText(text)
      showToast(`${what} kopiert.`, { duration: 2000 })
    } catch {
      notify('Kopieren nicht möglich', 'Markiere den Text und kopiere ihn von Hand.')
    }
  }

  return (
    <>
      <Sheet title={item.reviewed ? 'Brief' : 'Brief sichten'} onClose={onClose} confirmLabel="Sichern" onConfirm={save} confirmDisabled={!kind}>
        <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleAddPage} />
        <div className="px-4 space-y-4">

          <div className="flex gap-3 overflow-x-auto pb-1 pt-2 -mx-4 px-4">
            {pages.map((p, n) => (
              <PageThumb key={p.id} page={p} label={`Seite ${n + 1} ansehen`} onOpen={() => setViewer(n)} onRemove={() => handleRemovePage(p)} />
            ))}
            <button onClick={() => cameraRef.current?.click()} disabled={uploading} aria-label="Seite hinzufügen"
              className="flex-none w-24 h-32 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 flex flex-col items-center justify-center gap-1 text-footnote">
              <Icon name="camera" size={22} />
              {uploading ? 'Lädt …' : 'Seite'}
            </button>
          </div>
          {pages.length === 0 && <p className="text-footnote text-gray-500 dark:text-gray-400">Noch kein Foto. Mit „Seite“ kannst du eines ergänzen.</p>}

          <Block>
            <div>
              <span className="label">Was ist das?</span>
              <Chips label="Art des Briefs" options={KINDS} value={kind} onChange={k => { setKind(k); if (k === 'info') setPaid(false) }} />
              {!kind && <p className="text-footnote text-gray-500 dark:text-gray-400 mt-2">Wähle die Art, dann „Sichern“.</p>}
            </div>
            <div>
              <label className="label" htmlFor="post-sender">Absender</label>
              <AutocompleteInput id="post-sender" value={sender} onChange={setSender} suggestions={senders}
                placeholder="z. B. Stadtwerke, Dr. Meier" className="input" />
            </div>
            {persons.length > 0 && (
              <div>
                <span className="label">Für wen?</span>
                <Chips label="Person" value={personId} onChange={setPersonId}
                  options={[...persons.map(p => ({ id: p.id, label: p.name })), { id: '', label: 'Alle / unklar' }]} />
              </div>
            )}
          </Block>

          {needsPayment && (
            <Block>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="post-amount">Betrag in €</label>
                  <input id="post-amount" value={amount} onChange={e => setAmount(e.target.value)} inputMode="decimal" placeholder="0,00" className="input" />
                </div>
                <div>
                  <label className="label" htmlFor="post-due">Fällig am</label>
                  <input id="post-due" type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="input" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle checked={paid} onClick={togglePaid} label="Bezahlt" />
                <span className="flex-1 text-body font-semibold text-gray-900 dark:text-gray-100">Bezahlt</span>
                {paid && <input type="date" value={paidOn} onChange={e => setPaidOn(e.target.value)} aria-label="Bezahlt am" className="input !w-auto" />}
              </div>
            </Block>
          )}

          {reimbursable && (
            <Block>
              <div>
                <label className="label" htmlFor="post-reimb">Erstattung durch die Krankenkasse</label>
                <select id="post-reimb" value={reimbState} onChange={e => chooseReimb(e.target.value)} className="input">
                  {REIMB_STATES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
              {(reimbState === 'eingereicht' || reimbState === 'erstattet') && (
                <div>
                  <label className="label" htmlFor="post-submitted">Eingereicht am</label>
                  <input id="post-submitted" type="date" value={submittedOn} onChange={e => setSubmittedOn(e.target.value)} className="input" />
                </div>
              )}
              {reimbState === 'erstattet' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label" htmlFor="post-reimbursed-on">Erstattet am</label>
                      <input id="post-reimbursed-on" type="date" value={reimbursedOn} onChange={e => setReimbursedOn(e.target.value)} className="input" />
                    </div>
                    <div>
                      <label className="label" htmlFor="post-reimbursed">Erstattet in €</label>
                      <input id="post-reimbursed" value={reimbursed} onChange={e => setReimbursed(e.target.value)} inputMode="decimal" placeholder="0,00" className="input" />
                    </div>
                  </div>
                  {amountCents != null && reimbursedCents != null && (
                    <p className="text-footnote text-gray-500 dark:text-gray-400">
                      Selbst getragen: {formatEuro(Math.max(0, amountCents - reimbursedCents))}
                    </p>
                  )}
                </>
              )}
              {reimbState === 'nicht_einreichen' && (
                <p className="text-footnote text-gray-500 dark:text-gray-400">
                  Wird nicht mehr angemahnt, zählt aber weiter in der Jahressumme (z. B. für die Beitragsrückerstattung).
                </p>
              )}
            </Block>
          )}

          {needsPayment && (
            <Block>
              <p className="label !mb-0">Zahlungsdaten (optional)</p>
              <div>
                <label className="label" htmlFor="post-iban">IBAN</label>
                <div className="flex gap-2">
                  <input id="post-iban" value={iban} onChange={e => setIban(e.target.value)} autoCapitalize="characters" className="input flex-1 min-w-0" />
                  {iban.trim() && <button onClick={() => copy(iban.replace(/\s/g, ''), 'IBAN')} className="btn-secondary !min-h-0 px-3">Kopieren</button>}
                </div>
              </div>
              <div>
                <label className="label" htmlFor="post-ref">Verwendungszweck</label>
                <div className="flex gap-2">
                  <input id="post-ref" value={reference} onChange={e => setReference(e.target.value)} className="input flex-1 min-w-0" />
                  {reference.trim() && <button onClick={() => copy(reference.trim(), 'Verwendungszweck')} className="btn-secondary !min-h-0 px-3">Kopieren</button>}
                </div>
              </div>
            </Block>
          )}

          <Block>
            <div>
              <label className="label" htmlFor="post-orig">Original liegt in</label>
              <input id="post-orig" value={originalLocation} onChange={e => setOriginalLocation(e.target.value)} placeholder="z. B. Ordner Arzt 2026" className="input" />
            </div>
            <div>
              <label className="label" htmlFor="post-note">Notiz</label>
              <textarea id="post-note" value={note} onChange={e => setNote(e.target.value)} rows={2} className="input" />
            </div>
          </Block>

          <button onClick={handleDelete} className="w-full min-h-[48px] text-[16px] font-semibold text-expired dark:text-expired-dark">Brief löschen</button>
        </div>
      </Sheet>
      {viewer != null && <Lightbox pages={pages} index={viewer} onClose={() => setViewer(null)} />}
    </>
  )
}
