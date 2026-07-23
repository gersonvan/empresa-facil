import { useCallback, useMemo, useRef, useState, type DragEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import ScreenContainer from '../components/ScreenContainer'
import { Card, Button } from '../components/ui'
import { getCategoryById, listCategories, type DreGroup } from '../categoryStore'
import { getMonthContext } from './financialOverview'
import { formatCurrency } from './financialOverview'
import { listLaunchEntries, saveLaunchEntry } from '../launchStore'
import { parseImportFile } from '../lib/parseImportFile'
import type { OFXTransaction } from '../lib/parseOFX'
import { suggestCategory } from '../lib/categorizeOFX'
import { deleteImportProfile, listImportProfiles, saveImportProfile, type ImportProfile } from '../importProfileStore'
import { findTransactionMemory, listTransactionMemory, rememberTransactionCategory, removeTransactionMemory, type TransactionMemory } from '../transactionMemoryStore'
import { findPossibleInternalTransfers } from '../importReconciliation'
import styles from './ImportOFX.module.css'

interface ImportRow extends OFXTransaction {
  selected: boolean
  costType: 'company' | 'personal'
  description: string
  isDuplicate: boolean
  categoryId: string
  categoryName: string
  dreGroup: DreGroup
  suggestionSource: 'memory' | 'rule' | 'none'
  reconciliationReason?: string
}

const NEW_PROFILE: Omit<ImportProfile, 'id' | 'companyId' | 'createdAt' | 'updatedAt' | 'builtIn'> = {
  name: '', accountName: '', format: 'csv', delimiter: ';', skipLines: 1, dateFormat: 'DD/MM/YYYY',
  dateColumn: 0, descriptionColumn: 1, amountColumn: 2, invertAmount: false,
}

function buildDuplicateKey(month: string, description: string, amount: number) {
  return `${month}|${description.toLocaleLowerCase('pt-BR').trim()}|${amount.toFixed(2)}`
}

function formatDate(date: string) {
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}`
}

export default function ImportOFX() {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const monthContext = getMonthContext()
  const [profiles, setProfiles] = useState(() => listImportProfiles(monthContext.companyId))
  const [profileId, setProfileId] = useState(() => profiles[0]?.id ?? 'builtin-ofx')
  const [newProfile, setNewProfile] = useState(NEW_PROFILE)
  const [showProfileForm, setShowProfileForm] = useState(false)
  const [showMemory, setShowMemory] = useState(false)
  const [memoryItems, setMemoryItems] = useState<TransactionMemory[]>(() => listTransactionMemory(monthContext.companyId))
  const [dragging, setDragging] = useState(false)
  const [rows, setRows] = useState<ImportRow[] | null>(null)
  const [parseError, setParseError] = useState('')
  const [result, setResult] = useState<{ novos: number; duplicados: number; memorizados: number } | null>(null)
  const [importing, setImporting] = useState(false)

  const profile = profiles.find((item) => item.id === profileId) ?? profiles[0]
  const acceptedFiles = profile?.format === 'ofx' ? '.ofx' : '.csv,text/csv'

  const categoryOptions = useMemo(() => listCategories(), [])

  function refreshProfiles(selectedId?: string) {
    const next = listImportProfiles(monthContext.companyId)
    setProfiles(next)
    setProfileId(selectedId ?? next[0]?.id ?? 'builtin-ofx')
  }

  function refreshMemory() {
    setMemoryItems(listTransactionMemory(monthContext.companyId))
  }

  function buildDuplicateSet() {
    const existing = listLaunchEntries({ companyId: monthContext.companyId, costType: 'all' })
    return new Set(existing.map((entry) => buildDuplicateKey(entry.month, entry.description, entry.amount)))
  }

  function categoryFor(transaction: OFXTransaction, costType: 'company' | 'personal') {
    const memory = findTransactionMemory(monthContext.companyId, transaction.description, costType, transaction.type)
    if (memory) return { categoryId: memory.categoryId, categoryName: memory.categoryName, dreGroup: memory.dreGroup, suggestionSource: 'memory' as const }
    const rule = suggestCategory(transaction.description, costType, transaction.type)
    if (rule) return { categoryId: rule.categoryId, categoryName: rule.categoryName, dreGroup: rule.dreGroup, suggestionSource: 'rule' as const }
    return { categoryId: '', categoryName: 'Sem categoria', dreGroup: transaction.type === 'Entrada' ? 'revenue' as const : 'expenses' as const, suggestionSource: 'none' as const }
  }

  function rowFromTransaction(transaction: OFXTransaction, duplicates: Set<string>, reconciliationReasons: Map<string, string>): ImportRow {
    const costType = 'company'
    return {
      ...transaction,
      selected: true,
      costType,
      description: transaction.description,
      isDuplicate: duplicates.has(buildDuplicateKey(transaction.month, transaction.description, transaction.amount)),
      reconciliationReason: reconciliationReasons.get(transaction.id),
      ...categoryFor(transaction, costType),
    }
  }

  async function processFile(file: File) {
    if (!profile) return
    setParseError('')
    setResult(null)
    try {
      const buffer = await file.arrayBuffer()
      const text = new TextDecoder(profile.format === 'ofx' ? 'latin1' : 'utf-8').decode(buffer)
      const transactions = parseImportFile(text, profile)
      if (transactions.length === 0) {
        setParseError('Nenhuma transação válida foi encontrada. Revise o perfil e o arquivo.')
        return
      }
      const duplicates = buildDuplicateSet()
      const reconciliationReasons = new Map(findPossibleInternalTransfers(transactions).map((item) => [item.transactionId, item.reason]))
      setRows(transactions.map((transaction) => rowFromTransaction(transaction, duplicates, reconciliationReasons)))
    } catch {
      setParseError('Não foi possível processar o arquivo. Revise o perfil de importação e tente novamente.')
    }
  }

  const onDrop = useCallback((event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) void processFile(file)
  }, [profile])

  function updateRow(id: string, patch: Partial<ImportRow>) {
    setRows((current) => current?.map((row) => row.id === id ? { ...row, ...patch } : row) ?? null)
  }

  function updateCostType(row: ImportRow, costType: 'company' | 'personal') {
    const transaction = { ...row, description: row.description }
    updateRow(row.id, { costType, ...categoryFor(transaction, costType) })
  }

  function updateCategory(row: ImportRow, categoryId: string) {
    const category = getCategoryById(categoryId)
    if (!category) return updateRow(row.id, { categoryId: '', categoryName: 'Sem categoria' })
    updateRow(row.id, { categoryId: category.id, categoryName: category.name, dreGroup: category.dreGroup, suggestionSource: 'none' })
  }

  function setBulkCostType(costType: 'company' | 'personal') {
    setRows((current) => current?.map((row) => row.selected && !row.isDuplicate ? { ...row, costType, ...categoryFor(row, costType) } : row) ?? null)
  }

  function toggleAll(selected: boolean) {
    setRows((current) => current?.map((row) => row.isDuplicate ? row : { ...row, selected }) ?? null)
  }

  function saveProfile() {
    if (!newProfile.name.trim() || !newProfile.accountName.trim()) {
      setParseError('Informe o nome do perfil e a conta que receberá os lançamentos.')
      return
    }
    const created = saveImportProfile({ ...newProfile, companyId: monthContext.companyId })
    setNewProfile(NEW_PROFILE)
    setShowProfileForm(false)
    refreshProfiles(created.id)
  }

  function removeProfile(profileToRemove: ImportProfile) {
    if (profileToRemove.builtIn) return
    deleteImportProfile(profileToRemove.id)
    refreshProfiles()
  }

  function updateMemoryCategory(memory: TransactionMemory, categoryId: string) {
    const category = getCategoryById(categoryId)
    if (!category) return
    rememberTransactionCategory({
      companyId: memory.companyId,
      description: memory.normalizedDescription,
      costType: memory.costType,
      type: memory.type,
      categoryId: category.id,
      categoryName: category.name,
      dreGroup: category.dreGroup,
    })
    refreshMemory()
  }

  function doImport() {
    if (!rows || !profile) return
    setImporting(true)
    const selected = rows.filter((row) => row.selected && !row.isDuplicate)
    const now = new Date().toISOString()
    let memorizados = 0
    for (const row of selected) {
      saveLaunchEntry({
        id: row.id,
        companyId: monthContext.companyId,
        month: row.month,
        costType: row.costType,
        dreGroup: row.dreGroup,
        categoryId: row.categoryId,
        categoryName: row.categoryName,
        description: row.description,
        amount: row.amount,
        createdAt: now,
        flaggedForReview: true,
        sourceType: 'bank_import',
        reviewStatus: 'suggested',
        reconciliationStatus: row.reconciliationReason ? 'pending' : 'not_applicable',
        reconciliationReason: row.reconciliationReason,
      })
      if (row.categoryId) {
        rememberTransactionCategory({
          companyId: monthContext.companyId, description: row.description, costType: row.costType, type: row.type,
          categoryId: row.categoryId, categoryName: row.categoryName, dreGroup: row.dreGroup,
        })
        memorizados++
      }
    }
    const duplicates = rows.filter((row) => row.selected && row.isDuplicate).length
    setResult({ novos: selected.length, duplicados: duplicates, memorizados })
    refreshMemory()
    setRows(null)
    setImporting(false)
  }

  const selectedCount = rows?.filter((row) => row.selected && !row.isDuplicate).length ?? 0
  const allSelected = rows?.filter((row) => !row.isDuplicate).every((row) => row.selected) ?? false
  const someSelected = rows?.some((row) => row.selected && !row.isDuplicate) ?? false

  if (result) {
    return <ScreenContainer title="Importar extrato"><Card className={styles.successCard}>
      <div className={styles.successIcon}>✅</div><h2 className={styles.successTitle}>{result.novos} lançamento{result.novos !== 1 ? 's' : ''} importado{result.novos !== 1 ? 's' : ''}</h2>
      <p className={styles.successDetail}>{result.memorizados} categoria{result.memorizados !== 1 ? 's' : ''} confirmada{result.memorizados !== 1 ? 's' : ''} na memória desta empresa. Revise os lançamentos antes de fechar o mês.{result.duplicados > 0 ? ` ${result.duplicados} duplicata${result.duplicados !== 1 ? 's foram' : ' foi'} ignorada${result.duplicados !== 1 ? 's' : ''}.` : ''}</p>
      <div className={styles.successActions}><Button onClick={() => navigate('/import-review')}>Revisar importados</Button><Button variant="secondary" onClick={() => setResult(null)}>Importar outro arquivo</Button></div>
    </Card></ScreenContainer>
  }

  return <ScreenContainer title="Importar extrato">
    {!rows ? <Card>
      <div className={styles.profileBar}>
        <label className={styles.profileLabel}>Perfil bancário<select value={profile?.id ?? ''} onChange={(event) => setProfileId(event.target.value)}>{profiles.map((item) => <option key={item.id} value={item.id}>{item.name} · {item.accountName}</option>)}</select></label>
        <Button size="sm" variant="secondary" onClick={() => setShowProfileForm((current) => !current)}>{showProfileForm ? 'Fechar perfil' : 'Novo perfil CSV'}</Button>
        <Button size="sm" variant="secondary" onClick={() => setShowMemory((current) => !current)}>{showMemory ? 'Fechar memória' : `Memória (${memoryItems.length})`}</Button>
        {profile && !profile.builtIn ? <Button size="sm" variant="secondary" onClick={() => removeProfile(profile)}>Excluir perfil</Button> : null}
      </div>
      {showProfileForm ? <div className={styles.profileForm}>
        <input placeholder="Nome do perfil (ex.: Itaú PJ CSV)" value={newProfile.name} onChange={(event) => setNewProfile({ ...newProfile, name: event.target.value })} />
        <input placeholder="Conta exibida no perfil" value={newProfile.accountName} onChange={(event) => setNewProfile({ ...newProfile, accountName: event.target.value })} />
        <label>Separador<select value={newProfile.delimiter} onChange={(event) => setNewProfile({ ...newProfile, delimiter: event.target.value as ImportProfile['delimiter'] })}><option value=";">Ponto e vírgula (;)</option><option value=",">Vírgula (,)</option><option value="\t">Tabulação</option></select></label>
        <label>Data<select value={newProfile.dateFormat} onChange={(event) => setNewProfile({ ...newProfile, dateFormat: event.target.value as ImportProfile['dateFormat'] })}><option value="DD/MM/YYYY">DD/MM/AAAA</option><option value="YYYY-MM-DD">AAAA-MM-DD</option><option value="MM/DD/YYYY">MM/DD/AAAA</option></select></label>
        <label>Pular linhas<input type="number" min="0" value={newProfile.skipLines} onChange={(event) => setNewProfile({ ...newProfile, skipLines: Number(event.target.value) })} /></label>
        <label>Coluna data<input type="number" min="0" value={newProfile.dateColumn} onChange={(event) => setNewProfile({ ...newProfile, dateColumn: Number(event.target.value) })} /></label>
        <label>Coluna descrição<input type="number" min="0" value={newProfile.descriptionColumn} onChange={(event) => setNewProfile({ ...newProfile, descriptionColumn: Number(event.target.value) })} /></label>
        <label>Coluna valor<input type="number" min="0" value={newProfile.amountColumn} onChange={(event) => setNewProfile({ ...newProfile, amountColumn: Number(event.target.value) })} /></label>
        <label className={styles.checkboxLabel}><input type="checkbox" checked={newProfile.invertAmount} onChange={(event) => setNewProfile({ ...newProfile, invertAmount: event.target.checked })} /> Inverter sinal</label>
        <Button size="sm" onClick={saveProfile}>Salvar perfil</Button>
      </div> : null}
      {showMemory ? <div className={styles.memoryPanel}>{memoryItems.length === 0 ? <p>Nenhuma categoria foi memorizada nesta empresa ainda.</p> : memoryItems.map((memory) => <div className={styles.memoryRow} key={memory.id}><span>{memory.normalizedDescription}<small>{memory.costType === 'company' ? 'Empresa' : 'Pessoal'} · {memory.type}</small></span><select value={memory.categoryId} onChange={(event) => updateMemoryCategory(memory, event.target.value)}>{categoryOptions.filter((category) => category.costType === memory.costType).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select><Button size="sm" variant="secondary" onClick={() => { removeTransactionMemory(memory.id); refreshMemory() }}>Remover</Button></div>)}</div> : null}
      <div className={`${styles.dropZone} ${dragging ? styles.dropZoneActive : ''}`} onClick={() => inputRef.current?.click()} onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={onDrop} role="button" tabIndex={0} onKeyDown={(event) => event.key === 'Enter' && inputRef.current?.click()} aria-label="Selecionar arquivo de extrato">
        <div className={styles.dropIcon}>🏦</div><p className={styles.dropTitle}>Arraste o arquivo ou clique para selecionar</p><p className={styles.dropHint}>{profile?.format === 'ofx' ? 'OFX dos principais bancos brasileiros.' : 'CSV conforme as colunas definidas no perfil acima.'}</p>
        <input ref={inputRef} type="file" accept={acceptedFiles} className={styles.dropInput} onChange={(event) => { const file = event.target.files?.[0]; if (file) void processFile(file) }} />
      </div>
      <p className={styles.memoryHint}>A categoria confirmada nesta importação passa a ser sugerida automaticamente para a mesma transação nesta empresa.</p>
      {parseError ? <p className={styles.error}>{parseError}</p> : null}
    </Card> : <Card>
      <div className={styles.previewHeader}><h2 className={styles.previewTitle}>{rows.length} transaç{rows.length === 1 ? 'ão encontrada' : 'ões encontradas'}</h2><div className={styles.bulkActions}><span className={styles.bulkLabel}>Selecionados:</span><Button size="sm" variant="secondary" onClick={() => setBulkCostType('company')} disabled={!someSelected}>Empresa</Button><Button size="sm" variant="secondary" onClick={() => setBulkCostType('personal')} disabled={!someSelected}>Pessoal</Button></div></div>
      <div className={styles.tableWrapper}><table className={styles.table}><thead><tr><th><input type="checkbox" checked={allSelected} onChange={(event) => toggleAll(event.target.checked)} title="Selecionar todos" /></th><th>Data</th><th>Descrição</th><th>Valor</th><th>Escopo</th><th>Categoria</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className={`${!row.selected ? styles.rowDisabled : ''} ${row.isDuplicate ? styles.rowDuplicate : ''}`}><td><input type="checkbox" checked={row.selected} disabled={row.isDuplicate} onChange={(event) => updateRow(row.id, { selected: event.target.checked })} /></td><td className={styles.date}>{formatDate(row.date)}</td><td>{row.isDuplicate ? <span>{row.description} <span className={styles.dupBadge}>duplicado</span></span> : <><input className={styles.descInput} value={row.description} onChange={(event) => updateRow(row.id, { description: event.target.value })} />{row.reconciliationReason ? <small className={styles.reconciliationWarning}>{row.reconciliationReason}</small> : null}</>}</td><td className={`${styles.amount} ${row.type === 'Entrada' ? styles.entrada : styles.saida}`}>{row.type === 'Saída' ? '−' : '+'}{formatCurrency(row.amount)}</td><td>{!row.isDuplicate ? <div className={styles.costToggle}><button type="button" className={`${styles.costBtn} ${row.costType === 'company' ? styles.active : ''}`} onClick={() => updateCostType(row, 'company')}>Empresa</button><button type="button" className={`${styles.costBtn} ${row.costType === 'personal' ? styles.active : ''}`} onClick={() => updateCostType(row, 'personal')}>Pessoal</button></div> : null}</td><td>{!row.isDuplicate ? <><select className={styles.categorySelect} value={row.categoryId} onChange={(event) => updateCategory(row, event.target.value)}><option value="">Sem categoria</option>{categoryOptions.filter((category) => category.costType === row.costType).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>{row.suggestionSource !== 'none' ? <small className={styles.suggestion}>{row.suggestionSource === 'memory' ? 'Memória' : 'Regra'}</small> : null}</> : null}</td></tr>)}</tbody></table></div>
      <div className={styles.footer}><span className={styles.footerInfo}>{selectedCount} lançamento{selectedCount !== 1 ? 's' : ''} para importar</span><div className={styles.actions}><Button variant="secondary" onClick={() => setRows(null)}>Cancelar</Button><Button onClick={doImport} disabled={selectedCount === 0 || importing}>{importing ? 'Importando…' : `Importar ${selectedCount} lançamento${selectedCount !== 1 ? 's' : ''}`}</Button></div></div>
    </Card>}
  </ScreenContainer>
}
