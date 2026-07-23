import type { ImportProfile } from '../importProfileStore'
import { parseOFXText, type OFXTransaction } from './parseOFX'

function parseRows(text: string, delimiter: string) {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let index = 0; index < text.length; index++) {
    const char = text[index]
    if (char === '"') {
      if (quoted && text[index + 1] === '"') { cell += '"'; index++ }
      else quoted = !quoted
    } else if (char === delimiter && !quoted) { row.push(cell.trim()); cell = '' }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && text[index + 1] === '\n') index++
      row.push(cell.trim())
      if (row.some(Boolean)) rows.push(row)
      row = []; cell = ''
    } else cell += char
  }
  row.push(cell.trim())
  if (row.some(Boolean)) rows.push(row)
  return rows
}

function parseDate(value: string, format: ImportProfile['dateFormat']) {
  const parts = value.trim().split(/[/-]/).map(Number)
  if (parts.length !== 3 || parts.some((part) => !Number.isInteger(part))) return null
  const [first, second, third] = parts
  const [year, month, day] = format === 'YYYY-MM-DD' ? [first, second, third] : format === 'MM/DD/YYYY' ? [third, first, second] : [third, second, first]
  const result = new Date(year, month - 1, day)
  if (result.getFullYear() !== year || result.getMonth() !== month - 1 || result.getDate() !== day) return null
  return result
}

function parseAmount(value: string) {
  const normalized = value.trim().replace(/[R$\s]/g, '')
  const number = Number(normalized.includes(',') ? normalized.replace(/\./g, '').replace(',', '.') : normalized)
  return Number.isFinite(number) ? number : null
}

function asTransaction(date: Date, description: string, amount: number, index: number): OFXTransaction {
  const dateValue = date.toISOString().slice(0, 10)
  return { id: `csv-import-${index}-${dateValue}`, date: dateValue, month: dateValue.slice(0, 7), description, amount: Math.abs(amount), type: amount >= 0 ? 'Entrada' : 'Saída', fitId: `${dateValue}|${amount}|${description}` }
}

export function parseImportFile(text: string, profile: ImportProfile) {
  if (profile.format === 'ofx') return parseOFXText(text)
  return parseRows(text, profile.delimiter)
    .slice(profile.skipLines)
    .map((row, index) => {
      const date = parseDate(row[profile.dateColumn] ?? '', profile.dateFormat)
      const description = (row[profile.descriptionColumn] ?? '').trim()
      const parsedAmount = parseAmount(row[profile.amountColumn] ?? '')
      if (!date || !description || parsedAmount === null) return null
      return asTransaction(date, description, profile.invertAmount ? -parsedAmount : parsedAmount, index)
    })
    .filter((transaction): transaction is OFXTransaction => transaction !== null)
}
