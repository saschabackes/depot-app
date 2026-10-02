import { useState } from 'react'
import { useCellar } from './store'
import { encodeShareData } from './shareCodec'
import { APP_URL } from '../../branding'
import { WineThumb, CheckCircle, Stars, FormSection, EmptyState } from './cellarUi'
import Sheet from '../../ui/Sheet'
import Icon from '../../ui/Icon'
import { ListGroup, ListRow } from '../../ui/List'
import { showToast } from '../../ui/feedback'

const MAX = 5

export default function SharePicker({ onClose, preselected }) {
  const { bottles } = useCellar()
  const inStock = bottles.filter(b => b.count > 0)

  const [selected, setSelected] = useState(() => (preselected ? new Set([preselected]) : new Set()))
  const [senderName, setSenderName] = useState('')
  const [message, setMessage] = useState('')
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)

  function toggle(id) {
    if (!selected.has(id) && selected.size >= MAX) { showToast(`Höchstens ${MAX} Weine pro Empfehlung.`); return }
    setSelected(s => {
      const next = new Set(s)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
    setShareUrl('')
  }

  function generate() {
    const picks = inStock.filter(b => selected.has(b.id))
    const meta = {}
    if (senderName.trim()) meta.sn = senderName.trim()
    if (message.trim()) meta.msg = message.trim()
    const encoded = encodeShareData(picks, meta)
    setShareUrl(`${APP_URL}/#share=${encoded}`)
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast('Kopieren nicht möglich – bitte den Link oben markieren und kopieren.')
    }
  }

  async function nativeShare() {
    const picks = inStock.filter(b => selected.has(b.id))
    const names = picks.map(b => `${b.name} ${b.vintage}`).join(', ')
    try {
      await navigator.share({
        title: 'Wein-Empfehlung',
        text: `${senderName || 'Ich'} empfiehlt: ${names}`,
        url: shareUrl,
      })
    } catch {}
  }

  return (
    <Sheet title="Weine empfehlen" onClose={onClose} z={60}
      cancelLabel={shareUrl ? 'Schließen' : 'Abbrechen'}
      confirmLabel={shareUrl ? 'Fertig' : 'Link erstellen'}
      onConfirm={shareUrl ? onClose : generate}
      confirmDisabled={!shareUrl && selected.size === 0}>
      {!shareUrl ? (
        <div className="space-y-5">
          <FormSection>
            <div>
              <label className="label" htmlFor="sp-name">Dein Name (optional)</label>
              <input id="sp-name" className="input" placeholder="z. B. Sascha" value={senderName} onChange={e => setSenderName(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="sp-msg">Persönliche Nachricht (optional)</label>
              <textarea id="sp-msg" className="input resize-none" rows={2} placeholder="z. B. Probier mal den Barolo – perfekt zum Sonntagsbraten!"
                value={message} onChange={e => setMessage(e.target.value)} />
            </div>
          </FormSection>

          {inStock.length === 0 ? (
            <EmptyState title="Keine Flaschen im Bestand" text="Empfehlen kannst du nur Weine, die gerade im Keller liegen." />
          ) : (
            <ListGroup title={`Weine auswählen · ${selected.size}/${MAX}`}>
              {inStock.map(b => (
                <ListRow key={b.id} onClick={() => toggle(b.id)}
                  leading={<WineThumb bottle={b} />}
                  title={b.name}
                  subtitle={[b.winery, b.vintage, b.region].filter(Boolean).join(' · ')}
                  trailing={<>
                    {b.rating > 0 && <Stars value={b.rating} size={12} />}
                    <CheckCircle on={selected.has(b.id)} />
                  </>} />
              ))}
            </ListGroup>
          )}
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col items-center text-center px-8 pt-6 gap-3">
            <span className="w-16 h-16 rounded-full bg-primary-50 dark:bg-primary-900 text-primary-500 dark:text-primary-300 flex items-center justify-center"><Icon name="check" size={30} strokeWidth={2.4} /></span>
            <h3 className="text-headline text-gray-900 dark:text-gray-100">Link erstellt</h3>
            <p className="text-callout text-gray-500 dark:text-gray-400">Der Empfänger kann die Empfehlung ohne Konto ansehen.</p>
          </div>
          <div className="px-4">
            <div className="bg-white dark:bg-gray-800 rounded-card p-3 break-all text-footnote text-gray-600 dark:text-gray-300 font-mono select-all">{shareUrl}</div>
          </div>
          <div className="px-4 space-y-2">
            <button onClick={copyLink} className="btn-primary w-full">
              <Icon name={copied ? 'check' : 'share'} size={20} />{copied ? 'Kopiert' : 'Link kopieren'}
            </button>
            {typeof navigator.share === 'function' && (
              <button onClick={nativeShare} className="btn-secondary w-full"><Icon name="share" size={20} />Teilen …</button>
            )}
          </div>
          <div className="flex justify-center">
            <button onClick={() => setShareUrl('')} className="min-h-[44px] px-4 text-callout font-semibold text-primary-500 dark:text-primary-300">Auswahl ändern</button>
          </div>
        </div>
      )}
    </Sheet>
  )
}
