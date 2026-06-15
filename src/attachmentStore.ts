const STORAGE_KEY = 'empresa-facil:attachments:v1'
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

export interface Attachment {
  entryId: string
  name: string
  type: string
  data: string // base64 data URL
  size: number
  savedAt: string
}

function read(): Record<string, Attachment> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) ?? {}
  } catch {
    return {}
  }
}

function write(map: Record<string, Attachment>) {
  if (typeof window === 'undefined') return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(map))
}

export function saveAttachment(attachment: Attachment): { ok: true } | { ok: false; error: string } {
  if (attachment.size > MAX_SIZE_BYTES) {
    return { ok: false, error: 'Arquivo muito grande. Limite: 5 MB.' }
  }
  const map = read()
  map[attachment.entryId] = attachment
  write(map)
  return { ok: true }
}

export function getAttachment(entryId: string): Attachment | null {
  return read()[entryId] ?? null
}

export function removeAttachment(entryId: string) {
  const map = read()
  delete map[entryId]
  write(map)
}

export function hasAttachment(entryId: string): boolean {
  return entryId in read()
}
