// Parser OFX client-side para o EmpresaFácil.
// Suporta tanto XML (com </STMTTRN>) quanto SGML puro (padrão Itaú, Bradesco, Santander).

export interface OFXTransaction {
  id: string
  date: string   // YYYY-MM-DD
  month: string  // YYYY-MM
  description: string
  amount: number // sempre positivo
  type: 'Entrada' | 'Saída'
  fitId: string
}

function tagValue(block: string, name: string): string {
  const re = new RegExp(`<${name}>([^<\r\n]*)`, 'i')
  const m = block.match(re)
  return m ? m[1].trim() : ''
}

function parseOFXDate(str: string): string | null {
  if (!str || str.length < 8) return null
  const year = str.slice(0, 4)
  const month = str.slice(4, 6)
  const day = str.slice(6, 8)
  if (!year || !month || !day) return null
  return `${year}-${month}-${day}`
}

function extractBlocks(text: string): string[] {
  // Tenta XML primeiro (com </STMTTRN>)
  const xml = text.match(/<STMTTRN>[\s\S]*?<\/STMTTRN>/gi)
  if (xml && xml.length > 0) return xml
  // Fallback SGML: divide no abre-tag e trata cada segmento como bloco
  const parts = text.split(/<STMTTRN>/i)
  return parts.slice(1).map((p) => `<STMTTRN>${p.split(/<STMTTRN>/i)[0]}`)
}

export function parseOFXText(text: string): OFXTransaction[] {
  const blocks = extractBlocks(text)
  const results: OFXTransaction[] = []
  const seenFitIds = new Set<string>()

  for (const block of blocks) {
    const amountStr = tagValue(block, 'TRNAMT')
    const amount = parseFloat(amountStr.replace(',', '.'))
    if (isNaN(amount)) continue

    const dateStr = parseOFXDate(tagValue(block, 'DTPOSTED'))
    if (!dateStr) continue

    const name = tagValue(block, 'NAME')
    const memo = tagValue(block, 'MEMO')
    const description = (memo.length > name.length ? memo : name) || name || memo
    if (!description) continue

    const fitId = tagValue(block, 'FITID') || `${dateStr}|${amount}|${description}`
    if (seenFitIds.has(fitId)) continue
    seenFitIds.add(fitId)

    results.push({
      id: `ofx-import-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: dateStr,
      month: dateStr.slice(0, 7),
      description,
      amount: Math.abs(amount),
      type: amount >= 0 ? 'Entrada' : 'Saída',
      fitId,
    })
  }

  return results
}
