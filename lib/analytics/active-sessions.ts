export interface SessionEntry {
  lastSeen: number
  pageCount: number
}

export const activeSessions = new Map<string, SessionEntry>()
