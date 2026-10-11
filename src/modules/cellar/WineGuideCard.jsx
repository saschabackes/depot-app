import { useMemo, useState } from 'react'
import Icon from '../../ui/Icon'
import { findGrapes, portrait, servingTemp, decantAdvice, glassAdvice, maturity, foodIdeas, glossaryFor, GLOSSARY } from './wineGuide'

function Row({ label, value, sub }) {
  return (
    <div className="px-4 py-3">
      <div className="text-footnote font-semibold text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-body text-gray-900 dark:text-gray-100 mt-0.5">{value}</div>
      {sub && <div className="text-callout text-gray-600 dark:text-gray-300 mt-0.5">{sub}</div>}
    </div>
  )
}

// „Erklär mir den Wein“ – Alltagssprache statt Fachchinesisch
export default function WineGuideCard({ bottle, effectiveUntil }) {
  const [openTerm, setOpenTerm] = useState(null)
  const guide = useMemo(() => {
    const grapes = findGrapes(bottle.grape, bottle.color)
    return {
      portrait: portrait(bottle, grapes),
      temp: servingTemp(bottle, grapes),
      decant: decantAdvice(bottle, grapes),
      glass: glassAdvice(bottle, grapes),
      ripe: maturity(bottle, effectiveUntil),
      foods: foodIdeas(bottle, grapes),
      terms: glossaryFor(bottle, grapes),
    }
  }, [bottle, effectiveUntil])

  return (
    <section className="px-4 space-y-2">
      <h2 className="px-4 text-footnote font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
        <Icon name="sparkle" size={15} />Erklärt
      </h2>
      <div className="bg-white dark:bg-gray-800 rounded-card divide-y divide-gray-100 dark:divide-gray-700">
        <p className="px-4 py-3.5 text-body text-gray-800 dark:text-gray-100 leading-relaxed">{guide.portrait}</p>
        {guide.ripe && <Row label="Jetzt trinken?" value={guide.ripe.text} />}
        <Row label="Trinktemperatur" value={guide.temp.range} sub={guide.temp.hint} />
        <Row label="Dekantieren" value={guide.decant.text} />
        <Row label="Glas" value={guide.glass} />
        {guide.foods.length > 0 && (
          <div className="px-4 py-3">
            <div className="text-footnote font-semibold text-gray-500 dark:text-gray-400 pb-1.5">Passt gut zu</div>
            <div className="flex flex-wrap gap-1.5">
              {guide.foods.map(d => (
                <span key={d.id} className="text-callout px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">{d.emoji} {d.label}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {guide.terms.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-card px-4 py-3 space-y-2">
          <div className="text-footnote font-semibold text-gray-500 dark:text-gray-400">Begriffe einfach erklärt – zum Antippen</div>
          <div className="flex flex-wrap gap-1.5">
            {guide.terms.map(t => (
              <button key={t} onClick={() => setOpenTerm(openTerm === t ? null : t)} aria-expanded={openTerm === t}
                className={`min-h-[36px] px-3 rounded-full text-[14px] font-semibold ${openTerm === t
                  ? 'bg-primary-500 text-white dark:bg-primary-300 dark:text-gray-900'
                  : 'bg-primary-50 text-primary-600 dark:bg-primary-900 dark:text-primary-200'}`}>
                {t}
              </button>
            ))}
          </div>
          {openTerm && <p className="text-callout text-gray-700 dark:text-gray-200 leading-relaxed pt-1">{GLOSSARY[openTerm]}</p>}
        </div>
      )}
    </section>
  )
}
