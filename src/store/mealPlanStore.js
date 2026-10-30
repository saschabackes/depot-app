// Wochenplan: Rezepte auf Tage legen (ein Tag = Liste von Rezepten, keine Mahlzeiten-Slots)
import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import useStore from './useStore'
import { synced } from '../lib/sync'
import { localISODate } from '../utils/date'

const uid = () => 'mp_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

function toJS(row) {
  return { id: row.id, date: row.date, recipeId: row.recipe_id, servings: row.servings ?? null, position: row.position ?? 0 }
}

// Die nächsten 7 Tage ab heute: [{ iso, label, short }]
export function weekDays(from = new Date()) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i)
    const weekday = d.toLocaleDateString('de-DE', { weekday: 'long' })
    const date = d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' })
    return {
      iso: localISODate(d),
      label: i === 0 ? 'Heute' : i === 1 ? 'Morgen' : weekday,
      date,
    }
  })
}

export const useMealPlan = create((set, get) => ({
  plan: [], // [{ id, date, recipeId, servings, position }] – nur heute und später

  async _loadFromSupabase(householdId) {
    const { data, error } = await supabase.from('meal_plan').select('*')
      .eq('household_id', householdId).gte('date', localISODate()).order('date').order('position')
    if (error) { console.warn('meal_plan:', error.message); return }
    set({ plan: (data ?? []).map(toJS) })
  },

  // Rezept auf einen Tag legen; false, wenn es dort schon steht
  add(date, recipeId, servings = null) {
    const h = useStore.getState().household
    if (!h) return false
    if (get().plan.some(p => p.date === date && p.recipeId === recipeId)) return false
    const entry = { id: uid(), date, recipeId, servings, position: get().plan.filter(p => p.date === date).length }
    set(s => ({ plan: [...s.plan, entry] }))
    supabase.from('meal_plan').insert([{
      id: entry.id, household_id: h.id, date, recipe_id: recipeId, servings, position: entry.position,
    }]).then(...synced('addMealPlan'))
    return true
  },

  setServings(id, servings) {
    set(s => ({ plan: s.plan.map(p => p.id === id ? { ...p, servings } : p) }))
    supabase.from('meal_plan').update({ servings }).eq('id', id).then(...synced('setMealPlanServings'))
  },

  remove(id) {
    set(s => ({ plan: s.plan.filter(p => p.id !== id) }))
    supabase.from('meal_plan').delete().eq('id', id).then(...synced('removeMealPlan'))
  },
}))

// Geplante Einträge eines Tages mit ihrem Rezept (Einträge gelöschter Rezepte fallen weg)
export function plannedOn(plan, recipes, date) {
  return plan
    .filter(p => p.date === date)
    .sort((a, b) => a.position - b.position)
    .map(p => ({ ...p, recipe: recipes.find(r => r.id === p.recipeId) }))
    .filter(p => p.recipe)
}
