import { useEffect, useRef, useState } from 'react'
import Sheet from '../../ui/Sheet'
import Icon from '../../ui/Icon'
import { notify, showToast } from '../../ui/feedback'
import { usePost } from './store'
import { compressImage } from './image'

// Brief erfassen: nur Fotos, keine Pflichtfelder. Ausfüllen kann man gleich danach oder später unter „Zu sichten“.
export default function PostCapture({ onClose, onOpenItem }) {
  const captureItem = usePost(s => s.captureItem)
  const [shots, setShots] = useState([])   // { id, blob, url }
  const [busy, setBusy] = useState(false)
  const cameraRef = useRef(null)
  const libraryRef = useRef(null)
  const shotsRef = useRef(shots)
  shotsRef.current = shots

  useEffect(() => () => shotsRef.current.forEach(s => URL.revokeObjectURL(s.url)), [])

  async function addFiles(fileList) {
    const files = [...(fileList ?? [])]
    if (!files.length) return
    setBusy(true)
    try {
      const added = []
      for (const file of files) {
        const blob = await compressImage(file)
        added.push({ id: crypto.randomUUID(), blob, url: URL.createObjectURL(blob) })
      }
      setShots(s => [...s, ...added])
    } catch (e) {
      notify('Foto nicht lesbar', e.message)
    } finally {
      setBusy(false)
    }
  }

  function removeShot(id) {
    setShots(s => {
      const gone = s.find(x => x.id === id)
      if (gone) URL.revokeObjectURL(gone.url)
      return s.filter(x => x.id !== id)
    })
  }

  async function save() {
    setBusy(true)
    try {
      const id = await captureItem(shots.map(s => s.blob))
      onClose()
      showToast('Brief gespeichert – er liegt jetzt unter „Zu sichten“.', { actionLabel: 'Ausfüllen', onAction: () => onOpenItem(id), duration: 7000 })
    } catch (e) {
      setBusy(false)
      if (e.itemId) {
        onClose()
        notify('Nicht alles hochgeladen', 'Der Brief ist angelegt, aber nicht alle Seiten sind angekommen. Öffne ihn und füge die fehlenden Seiten hinzu.')
      } else {
        notify('Das hat nicht geklappt', 'Der Brief konnte nicht gespeichert werden. Prüfe die Verbindung und versuche es noch einmal.')
      }
    }
  }

  const pick = e => { addFiles(e.target.files); e.target.value = '' }

  return (
    <Sheet title="Brief erfassen" onClose={busy ? () => {} : onClose} confirmLabel={busy ? 'Moment …' : 'Sichern'}
      onConfirm={save} confirmDisabled={shots.length === 0 || busy}>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={pick} />
      <input ref={libraryRef} type="file" accept="image/*" multiple className="hidden" onChange={pick} />

      <div className="px-4 space-y-4">
        {shots.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-card px-5 py-8 text-center space-y-4">
            <span className="mx-auto w-14 h-14 rounded-full bg-primary-50 dark:bg-primary-900 text-primary-500 dark:text-primary-300 flex items-center justify-center">
              <Icon name="camera" size={28} />
            </span>
            <p className="text-callout text-gray-600 dark:text-gray-300">
              Brief flach hinlegen, bei gutem Licht, die ganze Seite im Bild. Mehrere Seiten gehören zu einem Brief.
            </p>
            <button onClick={() => cameraRef.current?.click()} disabled={busy} className="btn-primary w-full">
              <Icon name="camera" size={20} /> {busy ? 'Foto wird vorbereitet …' : 'Foto aufnehmen'}
            </button>
            <button onClick={() => libraryRef.current?.click()} disabled={busy} className="btn-secondary w-full">Aus Fotos wählen</button>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-3">
              {shots.map((s, n) => (
                <div key={s.id} className="relative w-24 h-32">
                  <img src={s.url} alt={`Seite ${n + 1}`} className="w-full h-full object-cover rounded-xl border border-gray-200 dark:border-gray-700" />
                  <button onClick={() => removeShot(s.id)} disabled={busy} aria-label={`Seite ${n + 1} entfernen`}
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gray-900/80 text-white flex items-center justify-center">
                    <Icon name="close" size={14} strokeWidth={3} />
                  </button>
                  <span className="absolute bottom-1 left-1 text-[11px] font-bold bg-gray-900/70 text-white rounded-full px-1.5">{n + 1}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => cameraRef.current?.click()} disabled={busy} className="btn-secondary">
                <Icon name="camera" size={20} /> {busy ? 'Moment …' : 'Weitere Seite'}
              </button>
              <button onClick={() => libraryRef.current?.click()} disabled={busy} className="btn-secondary">Aus Fotos</button>
            </div>
            <p className="text-footnote text-gray-500 dark:text-gray-400 text-center">
              „Sichern“ legt den Brief an. Betrag und Fälligkeit trägst du gleich oder später ein.
            </p>
          </>
        )}
      </div>
    </Sheet>
  )
}
