import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = (supabaseUrl && supabaseKey)
  ? createClient(supabaseUrl, supabaseKey)
  : null

// ─── Data layer: Supabase (online) + localStorage (fallback/cache) ───

export async function loadData() {
  // Try Supabase first
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('app_data')
        .select('data')
        .eq('id', 'main')
        .single()

      if (!error && data) {
        // Cache locally too
        localStorage.setItem('publi_portal_data', JSON.stringify(data.data))
        return data.data
      }
    } catch {}
  }

  // Fallback to localStorage
  try {
    const stored = localStorage.getItem('publi_portal_data')
    if (stored) return JSON.parse(stored)
  } catch {}

  return { clients: [], contents: [] }
}

export async function saveData(newData) {
  // Always save to localStorage (instant, offline-safe)
  try {
    localStorage.setItem('publi_portal_data', JSON.stringify(newData))
  } catch {}

  // Also save to Supabase (synced across browsers)
  if (supabase) {
    try {
      await supabase
        .from('app_data')
        .upsert({ id: 'main', data: newData, updated_at: new Date().toISOString() })
    } catch (err) {
      console.warn('Supabase sync failed:', err)
    }
  }
}
