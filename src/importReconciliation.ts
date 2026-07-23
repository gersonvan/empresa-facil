import type { OFXTransaction } from './lib/parseOFX'

export interface ImportReconciliationFlag {
  transactionId: string
  reason: string
}

function normalizedDescription(value: string) {
  return value
    .toLocaleLowerCase('pt-BR')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function isTransferDescription(description: string) {
  return /pix|transferencia|ted|doc/.test(normalizedDescription(description))
}

// Não confirma automaticamente uma transferência. Apenas destaca pares
// opostos no mesmo extrato para revisão humana, evitando alterar a DRE por suposição.
export function findPossibleInternalTransfers(transactions: OFXTransaction[]): ImportReconciliationFlag[] {
  const flagged = new Map<string, ImportReconciliationFlag>()
  for (let leftIndex = 0; leftIndex < transactions.length; leftIndex++) {
    const left = transactions[leftIndex]
    if (!isTransferDescription(left.description)) continue
    for (let rightIndex = leftIndex + 1; rightIndex < transactions.length; rightIndex++) {
      const right = transactions[rightIndex]
      if (left.month !== right.month || left.type === right.type || left.amount !== right.amount || !isTransferDescription(right.description)) continue
      const reason = 'Possível transferência interna: há entrada e saída de mesmo valor no extrato.'
      flagged.set(left.id, { transactionId: left.id, reason })
      flagged.set(right.id, { transactionId: right.id, reason })
    }
  }
  return [...flagged.values()]
}
