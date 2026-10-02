import { useState } from 'react'
import { MODULES_ENABLED } from '../branding'
import { IconTile } from '../ui/List'

const SLIDES_DEPOT = [
  { icon: 'home', tone: 'accent', title: 'Willkommen bei Depot',
    text: 'Behalte gemeinsam den Überblick über Gewürze, Tiefkühl, Wein und Vorrat – was da ist, wo es liegt, was abläuft und was nachgekauft werden muss.' },
  { icon: 'boxes', tone: 'accent', title: 'Fünf Tabs unten',
    text: 'Start zeigt, was Aufmerksamkeit braucht. Unter Bestand findest du Gewürze, Tiefkühl, Wein und Vorrat. Dazu Kochen, Einkauf und Mehr mit Einstellungen und Hilfe.' },
  { icon: 'plus', tone: 'accent', title: 'Etwas erfassen',
    text: 'In jedem Bereich oben rechts auf „+“ tippen. Der Name reicht zum Start – per Barcode oder Foto geht es noch schneller. Alles andere kannst du später ergänzen.' },
  { icon: 'search', tone: 'accent', title: 'Alles schnell finden',
    text: 'Die Suche auf der Startseite durchsucht alle Bereiche auf einmal. Antippen öffnet den Eintrag mit allen Aktionen: Füllstand, Nachkaufen, Entsorgen, Etikett drucken.' },
  { icon: 'cart', tone: 'accent', title: 'Einkaufen & Kochen',
    text: 'Was zur Neige geht, landet mit einem Tipp auf der Einkaufsliste – auf Wunsch direkt in Bring!. Rezepte zeigen, welche Zutaten du schon im Haus hast.' },
  { icon: 'user', tone: 'accent', title: 'Gemeinsam nutzen',
    text: 'Lade Familie oder Mitbewohner unter Mehr → Einstellungen ein. Alle sehen denselben Bestand, Änderungen erscheinen sofort bei allen.' },
]

const SLIDES_SPICE = [
  { icon: 'leaf', tone: 'spices', title: 'Willkommen!',
    text: 'Der Gewürzmanager hilft dir, den Überblick über deine Gewürze zu behalten – was da ist, wo es steht, was abläuft und was nachgekauft werden muss.' },
  { icon: 'plus', tone: 'accent', title: 'Gewürz hinzufügen',
    text: 'Oben rechts auf „+“ tippen. Name und Verpackungstyp reichen zum Start – per Barcode geht es am schnellsten.' },
  { icon: 'clock', tone: 'accent', title: 'Füllstand & Ablauf',
    text: 'Tippe ein Gewürz an, um den Füllstand zu ändern. Die Ansicht „Ablauf“ zeigt, was bald abläuft.' },
  { icon: 'cart', tone: 'accent', title: 'Einkaufsliste',
    text: 'Fast leere Gewürze mit einem Tipp nachkaufen – optional direkt in deiner Bring!-Liste.' },
  { icon: 'user', tone: 'accent', title: 'Gemeinsam nutzen',
    text: 'Lade Familie oder Mitbewohner in den Einstellungen ein: alle sehen denselben Bestand.' },
]

const SLIDES = MODULES_ENABLED ? SLIDES_DEPOT : SLIDES_SPICE

export default function OnboardingView({ onFinish }) {
  const [i, setI] = useState(0)
  const last = i === SLIDES.length - 1
  const slide = SLIDES[i]

  return (
    <div className="fixed inset-0 z-[60] bg-gray-50 dark:bg-gray-900 flex flex-col fade-enter"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <div className="flex justify-end px-3 pt-2 min-h-[48px]">
        {!last && (
          <button onClick={onFinish} className="min-h-[44px] px-3 text-callout text-primary-500 dark:text-primary-300">Überspringen</button>
        )}
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-5">
        <IconTile icon={slide.icon} tone={slide.tone} size={88} />
        <h2 className="text-title text-gray-900 dark:text-gray-50">{slide.title}</h2>
        <p className="text-body text-gray-600 dark:text-gray-300 leading-relaxed max-w-sm">{slide.text}</p>
      </div>

      <div className="flex justify-center gap-2 mb-6" aria-label={`Schritt ${i + 1} von ${SLIDES.length}`}>
        {SLIDES.map((_, idx) => (
          <div key={idx} className={`h-2 rounded-full transition-all ${idx === i ? 'w-6 bg-primary-500' : 'w-2 bg-gray-300 dark:bg-gray-600'}`} />
        ))}
      </div>

      <div className="flex gap-2.5 px-5 pb-5">
        {i > 0 && <button onClick={() => setI(i - 1)} className="btn-secondary flex-1">Zurück</button>}
        <button onClick={() => (last ? onFinish() : setI(i + 1))} className="btn-primary flex-1">
          {last ? 'Los geht’s' : 'Weiter'}
        </button>
      </div>
    </div>
  )
}
