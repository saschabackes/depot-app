import { useState } from 'react'
import Sheet from '../../ui/Sheet'
import Icon from '../../ui/Icon'
import { Segmented } from '../../ui/Controls'
import { confirmAction } from '../../ui/feedback'
import { usePost } from './store'
import { Block } from './parts'

const INSURANCE_OPTIONS = [
  { id: 'pkv', label: 'Privat' },
  { id: 'gkv', label: 'Gesetzlich' },
  { id: 'keine', label: 'Keine' },
]

// Für wen kommt Post? Bei privat Versicherten wird zusätzlich die Erstattung verfolgt.
export default function PostPersons({ onClose }) {
  const persons = usePost(s => s.persons)
  const { addPerson, updatePerson, removePerson } = usePost.getState()
  const [name, setName] = useState('')
  const [insurance, setInsurance] = useState('pkv')

  function add() {
    if (!name.trim()) return
    addPerson(name, insurance)
    setName('')
  }

  async function remove(p) {
    if (await confirmAction({ title: `${p.name} entfernen?`, message: 'Die Briefe bleiben erhalten, sind dann aber niemandem zugeordnet.', confirmLabel: 'Entfernen', destructive: true })) removePerson(p.id)
  }

  return (
    <Sheet title="Personen" onClose={onClose} cancelLabel="Fertig">
      <div className="px-4 space-y-4">
        <p className="text-footnote text-gray-500 dark:text-gray-400">
          Bei privat Versicherten verfolgt Post, ob Arztrechnungen eingereicht und erstattet wurden. Bei gesetzlich Versicherten gibt es nur die Zahlung.
        </p>

        {persons.map(p => (
          <Block key={p.id}>
            <div className="flex items-center gap-2">
              <input defaultValue={p.name} aria-label="Name" className="input flex-1 min-w-0"
                onBlur={e => { const v = e.target.value.trim(); if (v && v !== p.name) updatePerson(p.id, { name: v }); else e.target.value = p.name }} />
              <button onClick={() => remove(p)} aria-label={`${p.name} entfernen`} className="w-11 h-11 flex-none flex items-center justify-center text-gray-400">
                <Icon name="trash" size={20} />
              </button>
            </div>
            <Segmented label="Versicherung" options={INSURANCE_OPTIONS} value={p.insurance} onChange={v => updatePerson(p.id, { insurance: v })} />
          </Block>
        ))}

        <Block>
          <p className="label !mb-0">Person hinzufügen</p>
          <input value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === 'Enter' && add()}
            placeholder="Name" aria-label="Name der neuen Person" className="input" />
          <Segmented label="Versicherung" options={INSURANCE_OPTIONS} value={insurance} onChange={setInsurance} />
          <button onClick={add} disabled={!name.trim()} className="btn-primary w-full">Hinzufügen</button>
        </Block>
      </div>
    </Sheet>
  )
}
