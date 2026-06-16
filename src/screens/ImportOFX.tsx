import { useRef, useState, useCallback, DragEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import ScreenContainer from '../components/ScreenContainer'
import { Card, Button } from '../components/ui'
import { parseOFXText, type OFXTransaction } from '../lib/parseOFX'
import { saveLaunchEntry, listLaunchEntries } from '../launchStore'
import { getMonthContext } from './financialOverview'
import { formatCurrency } from './financialOverview'
import styles from './ImportOFX.module.css'

interface OFXRow extends OFXTransaction {
  selected: boolean
  costType: 'company' | 'personal'
  description: string
  isDuplicate: boolean
}

function buildDuplicateKey(date: string, description: string, amount: number) {
  return `${date}|${description.toLowerCase()}|${amount.toFixed(2)}`
}

function formatDate(date: string) {
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

const BANKS = ['Itaú', 'Bradesco', 'Santander', 'BB', 'Caixa', 'Nubank', 'Inter', 'Sicoob', 'Sicredi']

export default function ImportOFX() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [rows, setRows] = useState<OFXRow[] | null>(null)
  const [parseError, setParseError] = useState('')
  const [result, setResult] = useState<{ novos: number; duplicados: number } | null>(null)
  const [importing, setImporting] = useState(false)

  function buildDuplicateSet() {
    const { companyId } = getMonthContext()
    const existing = listLaunchEntries({ companyId, costType: 'all' })
    return new Set(existing.map((e) => buildDuplicateKey(e.month + '-01', e.description, e.amount)))
  }

  function processFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.ofx') && !file.name.toLowerCase().endsWith('.ofx')) {
      setParseError('Selecione um arquivo .ofx')
      return
    }
    setParseError('')
    setResult(null)
    const reader = new FileReader()
    reader.onload = (e) => {
      const text = e.target?.result as string
      try {
        const transactions = parseOFXText(text)
        if (transactions.length === 0) {
          setParseError('Nenhuma transação encontrada no arquivo. Verifique se é um OFX válido.')
          return
        }
        const dupSet = buildDuplicateSet()
        setRows(
          transactions.map((tx) => ({
            ...tx,
            selected: true,
            costType: 'company',
            description: tx.description,
            isDuplicate: dupSet.has(buildDuplicateKey(tx.date, tx.description, tx.amount)),
          }))
        )
      } catch {
        setParseError('Erro ao processar o arquivo. Verifique se o formato é OFX válido.')
      }
    }
    reader.readAsText(file, 'latin1')
  }

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }, [])

  function updateRow(id: string, patch: Partial<OFXRow>) {
    setRows((prev) => prev?.map((r) => (r.id === id ? { ...r, ...patch } : r)) ?? null)
  }

  function setBulkCostType(costType: 'company' | 'personal') {
    setRows((prev) => prev?.map((r) => (r.selected ? { ...r, costType } : r)) ?? null)
  }

  function toggleAll(selected: boolean) {
    setRows((prev) => prev?.map((r) => ({ ...r, selected })) ?? null)
  }

  function doImport() {
    if (!rows) return
    setImporting(true)
    const { companyId } = getMonthContext()
    const selected = rows.filter((r) => r.selected && !r.isDuplicate)
    const now = new Date().toISOString()
    let novos = 0

    for (const row of selected) {
      saveLaunchEntry({
        id: row.id,
        companyId,
        month: row.month,
        costType: row.costType,
        dreGroup: row.type === 'Entrada' ? 'revenue' : 'expenses',
        categoryId: '',
        categoryName: 'Importado (OFX)',
        description: row.description,
        amount: row.amount,
        createdAt: now,
        flaggedForReview: true,
      })
      novos++
    }

    const skipped = rows.filter((r) => r.selected && r.isDuplicate).length
    setResult({ novos, duplicados: skipped })
    setRows(null)
    setImporting(false)
  }

  const selectedCount = rows?.filter((r) => r.selected && !r.isDuplicate).length ?? 0
  const allSelected = rows?.every((r) => r.selected) ?? false
  const someSelected = rows?.some((r) => r.selected) ?? false

  if (result) {
    return (
      <ScreenContainer title="Importar OFX">
        <Card className={styles.successCard}>
          <div className={styles.successIcon}>✅</div>
          <h2 className={styles.successTitle}>{result.novos} lançamento{result.novos !== 1 ? 's' : ''} importado{result.novos !== 1 ? 's' : ''}!</h2>
          <p className={styles.successDetail}>
            Todos foram marcados para revisão para que você confira a categoria antes de fechar o mês.
            {result.duplicados > 0 && ` ${result.duplicados} duplicata${result.duplicados > 1 ? 's' : ''} ignorada${result.duplicados > 1 ? 's' : ''}.`}
          </p>
          <div className={styles.successActions}>
            <Button onClick={() => navigate('/records')}>Ver Registros</Button>
            <Button variant="secondary" onClick={() => { setResult(null); setRows(null) }}>Importar outro arquivo</Button>
          </div>
        </Card>
      </ScreenContainer>
    )
  }

  return (
    <ScreenContainer title="Importar OFX">
      {!rows ? (
        <Card>
          <div
            className={`${styles.dropZone} ${dragging ? styles.dropZoneActive : ''}`}
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
            aria-label="Selecionar arquivo OFX"
          >
            <div className={styles.dropIcon}>🏦</div>
            <p className={styles.dropTitle}>Arraste o arquivo .ofx ou clique para selecionar</p>
            <p className={styles.dropHint}>Baixe o extrato OFX no internet banking do seu banco e importe aqui</p>
            <input
              ref={inputRef}
              type="file"
              accept=".ofx"
              className={styles.dropInput}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) processFile(f) }}
            />
          </div>
          <ul className={styles.banks}>
            {BANKS.map((b) => <li key={b} className={styles.bank}>{b}</li>)}
          </ul>
          {parseError && <p style={{ marginTop: 12, fontSize: 13, color: 'var(--color-negative)', fontWeight: 600 }}>{parseError}</p>}
        </Card>
      ) : (
        <Card>
          <div className={styles.previewHeader}>
            <h2 className={styles.previewTitle}>{rows.length} transação{rows.length !== 1 ? 'ões' : ''} encontrada{rows.length !== 1 ? 's' : ''}</h2>
            <div className={styles.bulkActions}>
              <span className={styles.bulkLabel}>Selecionados:</span>
              <Button size="sm" variant="secondary" onClick={() => setBulkCostType('company')} disabled={!someSelected}>Empresa</Button>
              <Button size="sm" variant="secondary" onClick={() => setBulkCostType('personal')} disabled={!someSelected}>Pessoal</Button>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => toggleAll(e.target.checked)}
                      title="Selecionar todos"
                    />
                  </th>
                  <th>Data</th>
                  <th>Descrição</th>
                  <th style={{ textAlign: 'right' }}>Valor</th>
                  <th>Tipo</th>
                  <th>Conta</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className={`${!row.selected ? styles.rowDisabled : ''} ${row.isDuplicate ? styles.rowDuplicate : ''}`}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={row.selected}
                        disabled={row.isDuplicate}
                        onChange={(e) => updateRow(row.id, { selected: e.target.checked })}
                      />
                    </td>
                    <td className={styles.date}>{formatDate(row.date)}</td>
                    <td>
                      {row.isDuplicate ? (
                        <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{row.description} <span className={styles.dupBadge}>duplicado</span></span>
                      ) : (
                        <input
                          className={styles.descInput}
                          value={row.description}
                          onChange={(e) => updateRow(row.id, { description: e.target.value })}
                        />
                      )}
                    </td>
                    <td className={`${styles.amount} ${row.type === 'Entrada' ? styles.entrada : styles.saida}`}>
                      {row.type === 'Saída' ? '−' : '+'}{formatCurrency(row.amount)}
                    </td>
                    <td>
                      <span className={`${styles.typeBadge} ${row.type === 'Entrada' ? styles.entrada : styles.saida}`}>
                        {row.type}
                      </span>
                    </td>
                    <td>
                      {!row.isDuplicate && (
                        <div className={styles.costToggle}>
                          <button
                            type="button"
                            className={`${styles.costBtn} ${row.costType === 'company' ? styles.active : ''}`}
                            onClick={() => updateRow(row.id, { costType: 'company' })}
                          >Empresa</button>
                          <button
                            type="button"
                            className={`${styles.costBtn} ${row.costType === 'personal' ? styles.active : ''}`}
                            onClick={() => updateRow(row.id, { costType: 'personal' })}
                          >Pessoal</button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.footer}>
            <span className={styles.footerInfo}>
              {selectedCount} lançamento{selectedCount !== 1 ? 's' : ''} para importar
              {rows.filter((r) => r.isDuplicate).length > 0 && ` · ${rows.filter((r) => r.isDuplicate).length} duplicado${rows.filter((r) => r.isDuplicate).length > 1 ? 's' : ''} (ignorado${rows.filter((r) => r.isDuplicate).length > 1 ? 's' : ''})`}
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button variant="secondary" onClick={() => setRows(null)}>Cancelar</Button>
              <Button onClick={doImport} disabled={selectedCount === 0 || importing}>
                {importing ? 'Importando…' : `Importar ${selectedCount} lançamento${selectedCount !== 1 ? 's' : ''}`}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </ScreenContainer>
  )
}
