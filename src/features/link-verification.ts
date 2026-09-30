import { isSupabaseConfigured, supabase } from '../lib/supabase'

export type LinkInspectionStatus = 'clear' | 'threat' | 'unreachable' | 'unavailable' | 'error'

export interface LiveLinkInspection {
  status: LinkInspectionStatus
  reachable: boolean
  finalUrl?: string
  httpStatus?: number
  pageTitle?: string
  description?: string
  redirectCount?: number
  usesHttps?: boolean
  threatTypes: string[]
  reputationChecked: boolean
  checkedAt: string
  message?: string
}

export function unavailableLinkInspection(message: string): LiveLinkInspection {
  return {
    status: 'unavailable',
    reachable: false,
    threatTypes: [],
    reputationChecked: false,
    checkedAt: new Date().toISOString(),
    message,
  }
}

export async function inspectLinkOnline(url: string): Promise<LiveLinkInspection> {
  if (!isSupabaseConfigured || !supabase) {
    return unavailableLinkInspection('Online inspection needs the Supabase function to be connected. The local risk checks still ran.')
  }

  try {
    const { data, error } = await supabase.functions.invoke<LiveLinkInspection>('inspect-link', {
      body: { url },
    })

    if (error) throw error
    if (!data) throw new Error('The inspection service returned no result.')
    return data
  } catch (cause) {
    return {
      status: 'error',
      reachable: false,
      threatTypes: [],
      reputationChecked: false,
      checkedAt: new Date().toISOString(),
      message: cause instanceof Error ? cause.message : 'The online inspection could not be completed.',
    }
  }
}
