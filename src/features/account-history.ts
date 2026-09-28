import { supabase } from '../lib/supabase'
import type { SavedCheck } from './history'

interface CheckRow {
  id: string
  mode: SavedCheck['mode']
  score: number
  level: SavedCheck['level']
  scam_type: string
  preview: string
  analysed_at: string
}

const fromRow = (row: CheckRow): SavedCheck => ({
  id: row.id, mode: row.mode, score: row.score, level: row.level,
  scamType: row.scam_type, preview: row.preview, analysedAt: row.analysed_at,
})

const toRow = (userId: string, item: SavedCheck) => ({
  id: item.id, user_id: userId, mode: item.mode, score: item.score, level: item.level,
  scam_type: item.scamType, preview: item.preview, analysed_at: item.analysedAt,
})

export async function loadAccountHistory(userId: string): Promise<SavedCheck[]> {
  if (!supabase) return []
  const { data, error } = await supabase.from('safety_checks').select('id, mode, score, level, scam_type, preview, analysed_at').eq('user_id', userId).order('analysed_at', { ascending: false }).limit(50)
  if (error) throw error
  return (data as CheckRow[]).map(fromRow)
}

export async function syncAccountHistory(userId: string, local: SavedCheck[]): Promise<SavedCheck[]> {
  if (!supabase) return local
  if (local.length) {
    const { error } = await supabase.from('safety_checks').upsert(local.map((item) => toRow(userId, item)), { onConflict: 'id' })
    if (error) throw error
  }
  return loadAccountHistory(userId)
}

export async function saveAccountCheck(userId: string, item: SavedCheck): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('safety_checks').upsert(toRow(userId, item), { onConflict: 'id' })
  if (error) throw error
}

export async function clearAccountHistory(userId: string): Promise<void> {
  if (!supabase) return
  const { error } = await supabase.from('safety_checks').delete().eq('user_id', userId)
  if (error) throw error
}
