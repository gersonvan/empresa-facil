import { useMemo, useRef, useState } from 'react'
import ScreenContainer from '../components/ScreenContainer'
import { Card, Button, Input } from '../components/ui'
import { listCategories, type CostType, type DreGroup } from '../categoryStore'
import { formatCurrency, getMonthContext } from './financialOverview'
import { useSearchParams } from 'react-router-dom'
import { getLaunchEntryById, listLaunchEntries, removeLaunchEntry, toggleReviewFlag, updateLaunchEntry } from '../launchStore'
import { getAttachment, hasAttachment, removeAttachment, saveAttachment } from '../attachmentStore'
import { monthLifecycleStore } from '../monthLifecycle'
import { saveCommitment, type CommitmentCostType, type CommitmentType } from '../commitmentStore'
import styles from './Records.module.css'

type CostTypeFilter = 'all' | 'company' | 'personal'
type DreGroupFilter = 'all' | DreGroup

const INSTALLMENT_REGEX = /\((\d+)\/(\d+)\)/

function detectInstallment(description: string): { current: number; total: number } | null {
  const match = description.match(INSTALLMENT_REGEX)
  if (!match) return null
  return { current: Number(match[1]), total: Number(match[2]) }
}

interface CommitmentModalState {
  entryId: string
  description: string
  amount: number
  costType: CommitmentCostType
  startMonth: string
  type: CommitmentType
  endMonth: string
  totalInstallments: string
  currentInstallment: string
  error: string
}

interface EditState {
  entryId: string
  costType: CostType
  dreGroup: DreGroup
  categoryId: string
  description: string
  amount: string
}

function monthFromNow() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  return `${now.getFullYear()}-${month}`
}

function costTypeLabel(costType: 'company' | 'personal') {
  return costType === 'company' ? 'Empresa' : 'Pessoal'
}

function dreGroupLabel(dreGroup: DreGroup) {
  if (dreGroup === 'revenue') {
    return 'Receita'
  }

  if (dreGroup === 'deductions') {
    return 'Dedução'
  }

  return 'Despesa'
}

function parseBrazilianAmount(rawValue: string) {
  return Number(rawValue.replace(/\./g, '').replace(',', '.'))
}

function formatAmountInput(rawValue: string) {
  const digitsOnly = rawValue.replace(/\D/g, '')
  if (!digitsOnly) {
    return ''
  }

  const normalized = digitsOnly.padStart(3, '0')
  const integerPart = normalized.slice(0, -2)
  const decimalPart = normalized.slice(-2)
  const integerValue = Number(integerPart)

  return `${integerValue.toLocaleString('pt-BR')},${decimalPart}`
}

function formatAmountForInput(value: number) {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export default function Records() {
  const monthContext = getMonthContext()
  const [searchParams] = useSearchParams()
  const [monthFilter, setMonthFilter] = useState(() => searchParams.get('mes') ?? monthFromNow())
  const [costTypeFilter, setCostTypeFilter] = useState<CostTypeFilter>('all')
  const [dreGroupFilter, setDreGroupFilter] = useState<DreGroupFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState(() => searchParams.get('categoria') ?? '')
  const [searchText, setSearchText] = useState('')
  const [editState, setEditState] = useState<EditState | null>(null)
  const [onlyFlagged, setOnlyFlagged] = useState(false)
  const [message, setMessage] = useState('')
  const [, forceUpdate] = useState(0)
  const [attachmentError, setAttachmentError] = useState('')
  const [viewingAttachment, setViewingAttachment] = useState<string | null>(null)
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [commitmentModal, setCommitmentModal] = useState<CommitmentModalState | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Todas as categorias para o filtro (sem restrição de tipo/natureza)
  const allCategories = useMemo(() => listCategories(), [])

  // Total sem filtros de busca — para mostrar "X de Y"
  const totalUnfiltered = useMemo(
    () =>
      listLaunchEntries({
        companyId: monthContext.companyId,
        month: monthFilter,
        costType: costTypeFilter,
        dreGroup: dreGroupFilter,
        categoryId: categoryFilter || undefined,
      }).length,
    [categoryFilter, costTypeFilter, dreGroupFilter, monthContext.companyId, monthFilter]
  )

  const entries = useMemo(
    () =>
      listLaunchEntries({
        companyId: monthContext.companyId,
        month: monthFilter,
        costType: costTypeFilter,
        dreGroup: dreGroupFilter,
        categoryId: categoryFilter || undefined,
        search: searchText || undefined,
        flaggedForReview: onlyFlagged ? true : undefined,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categoryFilter, costTypeFilter, dreGroupFilter, monthContext.companyId, monthFilter, searchText, onlyFlagged]
  )

  const hasActiveFilters =
    costTypeFilter !== 'all' ||
    dreGroupFilter !== 'all' ||
    categoryFilter !== '' ||
    searchText !== ''

  function clearFilters() {
    setCostTypeFilter('all')
    setDreGroupFilter('all')
    setCategoryFilter('')
    setSearchText('')
  }

  const availableCategories = useMemo(() => {
    if (!editState) {
      return []
    }

    return listCategories({ costType: editState.costType, dreGroup: editState.dreGroup })
  }, [editState])

  const summary = useMemo(() => {
    return entries.reduce(
      (accumulator, entry) => {
        accumulator.total += entry.amount
        if (entry.costType === 'company') {
          accumulator.company += entry.amount
        } else {
          accumulator.personal += entry.amount
        }
        return accumulator
      },
      { total: 0, company: 0, personal: 0 }
    )
  }, [entries])

  function canMutateEntry(month: string) {
    return !monthLifecycleStore.isMonthClosed({ companyId: monthContext.companyId, month })
  }

  function handleToggleFlag(entryId: string) {
    toggleReviewFlag(entryId)
    forceUpdate((n) => n + 1)
  }

  function handleAttachFile(entryId: string, file: File) {
    setAttachmentError('')
    const reader = new FileReader()
    reader.onload = () => {
      const result = saveAttachment({
        entryId,
        name: file.name,
        type: file.type,
        data: reader.result as string,
        size: file.size,
        savedAt: new Date().toISOString(),
      })
      if (!result.ok) {
        setAttachmentError(result.error)
      } else {
        forceUpdate((n) => n + 1)
      }
    }
    reader.readAsDataURL(file)
  }

  function handleRemoveAttachment(entryId: string) {
    removeAttachment(entryId)
    forceUpdate((n) => n + 1)
  }

  function exportCsv() {
    const allEntries = listLaunchEntries({
      companyId: monthContext.companyId,
      month: monthFilter,
      costType: costTypeFilter,
      dreGroup: dreGroupFilter,
      categoryId: categoryFilter || undefined,
      search: searchText || undefined,
      flaggedForReview: onlyFlagged ? true : undefined,
    })
    const header = 'mes,data_criacao,tipo,natureza,categoria,descricao,valor,revisar'
    const rows = allEntries.map((entry) => [
      entry.month,
      entry.createdAt.slice(0, 10),
      entry.costType === 'company' ? 'Empresa' : 'Pessoal',
      dreGroupLabel(entry.dreGroup),
      entry.categoryName,
      `"${entry.description.replace(/"/g, '""')}"`,
      entry.amount.toFixed(2).replace('.', ','),
      entry.flaggedForReview ? 'Sim' : 'Não',
    ].join(','))
    const csv = [header, ...rows].join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `lancamentos-${monthFilter || 'todos'}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  function openEdit(entryId: string) {
    const entry = getLaunchEntryById(entryId)
    if (!entry) {
      setMessage('Lançamento não encontrado para edição.')
      return
    }

    if (!canMutateEntry(entry.month)) {
      setMessage('Mês fechado: este lançamento não pode ser editado ou removido.')
      return
    }

    setEditState({
      entryId: entry.id,
      costType: entry.costType,
      dreGroup: entry.dreGroup,
      categoryId: entry.categoryId,
      description: entry.description,
      amount: formatAmountForInput(entry.amount),
    })
    setMessage('')
  }

  function saveEdit() {
    if (!editState) {
      return
    }

    const amount = parseBrazilianAmount(editState.amount)
    if (!editState.description.trim() || Number.isNaN(amount) || amount <= 0) {
      setMessage('Preencha descrição e valor maior que zero para salvar.')
      return
    }

    const category = listCategories({ costType: editState.costType, dreGroup: editState.dreGroup }).find(
      (item) => item.id === editState.categoryId
    )
    if (!category) {
      setMessage('Escolha uma categoria válida para salvar.')
      return
    }

    const original = getLaunchEntryById(editState.entryId)
    if (!original) {
      setMessage('Lançamento não encontrado para salvar.')
      return
    }

    if (!canMutateEntry(original.month)) {
      setMessage('Mês fechado: este lançamento não pode mais ser editado.')
      return
    }

    updateLaunchEntry(editState.entryId, {
      costType: editState.costType,
      dreGroup: editState.dreGroup,
      categoryId: category.id,
      categoryName: category.name,
      description: editState.description.trim(),
      amount,
    })

    setEditState(null)
    setMessage('Lançamento atualizado com sucesso.')
  }

  function removeEntry(entryId: string) {
    const entry = getLaunchEntryById(entryId)
    if (!entry) {
      setMessage('Lançamento não encontrado para remoção.')
      return
    }

    if (!canMutateEntry(entry.month)) {
      setMessage('Mês fechado: este lançamento não pode ser removido.')
      return
    }

    const confirmed = window.confirm(
      `Tem certeza que deseja remover o lançamento "${entry.description}"? Esta ação não poderá ser desfeita.`
    )
    if (!confirmed) {
      return
    }

    removeLaunchEntry(entryId)
    if (editState?.entryId === entryId) {
      setEditState(null)
    }
    setMessage('Lançamento removido com sucesso.')
  }

  function openCommitmentModal(entryId: string, type: CommitmentType) {
    const entry = getLaunchEntryById(entryId)
    if (!entry) return
    const detected = type === 'installment' ? detectInstallment(entry.description) : null
    setCommitmentModal({
      entryId,
      description: entry.description,
      amount: entry.amount,
      costType: entry.costType as CommitmentCostType,
      startMonth: entry.month,
      type,
      endMonth: '',
      totalInstallments: detected ? String(detected.total) : '',
      currentInstallment: detected ? String(detected.current) : '1',
      error: '',
    })
    setMenuOpenId(null)
    setConfirmRemoveId(null)
  }

  function submitCommitment() {
    if (!commitmentModal) return
    const { description, amount, costType, startMonth, type, endMonth, totalInstallments, currentInstallment } = commitmentModal

    if (type === 'installment') {
      const total = Number(totalInstallments)
      const current = Number(currentInstallment)
      if (!Number.isInteger(total) || total <= 0) {
        setCommitmentModal((m) => m && ({ ...m, error: 'Informe o total de parcelas.' }))
        return
      }
      if (!Number.isInteger(current) || current <= 0 || current > total) {
        setCommitmentModal((m) => m && ({ ...m, error: 'Parcela atual inválida.' }))
        return
      }
    }

    saveCommitment({
      id: `rec-${Date.now()}`,
      companyId: monthContext.companyId,
      description,
      amount,
      type,
      costType,
      startMonth,
      endMonth: type === 'fixed' && endMonth.trim() ? endMonth.trim() : null,
      totalInstallments: type === 'installment' ? Number(totalInstallments) : null,
      currentInstallment: type === 'installment' ? Number(currentInstallment) : null,
      categoryId: null,
      notes: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })
    setCommitmentModal(null)
    setMessage(type === 'fixed' ? 'Adicionado como conta fixa em Previsão.' : 'Adicionado como parcelamento em Previsão.')
  }

  return (
    <ScreenContainer title="Registros">
      <Card className={styles.filtersCard}>
        <div className={styles.filtersHeader}>
          <h2 className={styles.sectionTitle}>Filtros</h2>
          {hasActiveFilters && (
            <button type="button" className={styles.clearBtn} onClick={clearFilters}>
              Limpar filtros
            </button>
          )}
        </div>
        <div className={styles.filtersGrid}>
          <label className={styles.field} htmlFor="records-month-filter">
            <span>Mês</span>
            <input
              id="records-month-filter"
              type="month"
              value={monthFilter}
              onChange={(event) => setMonthFilter(event.target.value)}
            />
          </label>
          <label className={styles.field} htmlFor="records-type-filter">
            <span>Tipo</span>
            <select
              id="records-type-filter"
              value={costTypeFilter}
              onChange={(event) => setCostTypeFilter(event.target.value as CostTypeFilter)}
            >
              <option value="all">Todos</option>
              <option value="company">Empresa</option>
              <option value="personal">Pessoal</option>
            </select>
          </label>
          <label className={styles.field} htmlFor="records-group-filter">
            <span>Natureza</span>
            <select
              id="records-group-filter"
              value={dreGroupFilter}
              onChange={(event) => setDreGroupFilter(event.target.value as DreGroupFilter)}
            >
              <option value="all">Todas</option>
              <option value="revenue">Receita</option>
              <option value="deductions">Dedução</option>
              <option value="expenses">Despesa</option>
            </select>
          </label>
          <label className={styles.field} htmlFor="records-category-filter">
            <span>Categoria</span>
            <select
              id="records-category-filter"
              value={categoryFilter}
              onChange={(event) => setCategoryFilter(event.target.value)}
            >
              <option value="">Todas</option>
              {allCategories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </label>
          <label className={`${styles.field} ${styles.searchField}`} htmlFor="records-search">
            <span>Buscar descrição</span>
            <div className={styles.searchWrapper}>
              <input
                id="records-search"
                type="search"
                value={searchText}
                onChange={(event) => setSearchText(event.target.value)}
                placeholder="Digite para filtrar…"
              />
              {searchText && (
                <button
                  type="button"
                  className={styles.clearSearch}
                  onClick={() => setSearchText('')}
                  aria-label="Limpar busca"
                >
                  ✕
                </button>
              )}
            </div>
          </label>
        </div>
      </Card>

      <div className={styles.kpiGrid}>
        <Card>
          <p className={styles.kpiLabel}>Total no filtro</p>
          <strong className={styles.kpiValue}>{formatCurrency(summary.total)}</strong>
        </Card>
        <Card>
          <p className={styles.kpiLabel}>Empresa</p>
          <strong className={styles.kpiValue}>{formatCurrency(summary.company)}</strong>
        </Card>
        <Card>
          <p className={styles.kpiLabel}>Pessoal</p>
          <strong className={styles.kpiValue}>{formatCurrency(summary.personal)}</strong>
        </Card>
      </div>

      <Card>
        <div className={styles.listHeader}>
          <h2 className={styles.sectionTitle}>Lançamentos</h2>
          {hasActiveFilters && (
            <span className={styles.resultCount}>
              {entries.length} de {totalUnfiltered}
            </span>
          )}
          <div className={styles.listActions}>
            <button
              type="button"
              className={`${styles.onlyFlaggedToggle} ${onlyFlagged ? styles.active : ''}`}
              onClick={() => setOnlyFlagged((v) => !v)}
            >
              🚩 Para revisar
            </button>
            <Button size="sm" variant="outline" onClick={exportCsv}>
              Exportar CSV
            </Button>
          </div>
        </div>
        <p className={styles.warning}>Atenção: após o fechamento do mês, edição e remoção ficam bloqueadas.</p>
        {message ? <p className={styles.message}>{message}</p> : null}

        {editState ? (
          <div className={styles.editCard}>
            <h3 className={styles.editTitle}>Editar lançamento</h3>
            <div className={styles.editGrid}>
              <label className={styles.field} htmlFor="edit-type">
                <span>Tipo</span>
                <select
                  id="edit-type"
                  value={editState.costType}
                  onChange={(event) =>
                    setEditState((current) =>
                      current
                        ? {
                            ...current,
                            costType: event.target.value as CostType,
                            categoryId: '',
                          }
                        : current
                    )
                  }
                >
                  <option value="company">Empresa</option>
                  <option value="personal">Pessoal</option>
                </select>
              </label>
              <label className={styles.field} htmlFor="edit-group">
                <span>Natureza</span>
                <select
                  id="edit-group"
                  value={editState.dreGroup}
                  onChange={(event) =>
                    setEditState((current) =>
                      current
                        ? {
                            ...current,
                            dreGroup: event.target.value as DreGroup,
                            categoryId: '',
                          }
                        : current
                    )
                  }
                >
                  <option value="revenue">Receita</option>
                  <option value="deductions">Dedução</option>
                  <option value="expenses">Despesa</option>
                </select>
              </label>
              <label className={styles.field} htmlFor="edit-category">
                <span>Categoria</span>
                <select
                  id="edit-category"
                  value={editState.categoryId}
                  onChange={(event) =>
                    setEditState((current) =>
                      current
                        ? {
                            ...current,
                            categoryId: event.target.value,
                          }
                        : current
                    )
                  }
                >
                  <option value="">Selecione...</option>
                  {availableCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                label="Descrição"
                value={editState.description}
                onChange={(event) =>
                  setEditState((current) =>
                    current
                      ? {
                          ...current,
                          description: event.target.value,
                        }
                      : current
                  )
                }
              />
              <Input
                label="Valor"
                inputMode="decimal"
                value={editState.amount}
                onChange={(event) =>
                  setEditState((current) =>
                    current
                      ? {
                          ...current,
                          amount: formatAmountInput(event.target.value),
                        }
                      : current
                  )
                }
              />
            </div>
            <div className={styles.editActions}>
              <Button size="sm" onClick={saveEdit}>Salvar alterações</Button>
              <Button size="sm" variant="outline" onClick={() => setEditState(null)}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : null}

        {attachmentError && <p className={styles.message} style={{ color: 'var(--color-negative)' }}>{attachmentError}</p>}
        {entries.length === 0 ? (
          <p className={styles.emptyState}>Nenhum lançamento encontrado para os filtros atuais.</p>
        ) : (
          <ul className={styles.list}>
            {entries.map((entry) => {
              const attached = hasAttachment(entry.id)
              return (
                <li key={entry.id} className={`${styles.row} ${entry.flaggedForReview ? styles.rowFlagged : ''}`}>
                  <div className={styles.rowInfo}>
                    <p className={styles.rowTitle}>
                      {entry.description}
                      {entry.flaggedForReview && <span className={styles.flaggedBadge}>Para revisar</span>}
                      {attached && <span className={styles.attachBadge}>📎</span>}
                    </p>
                    <p className={styles.rowMeta}>
                      {costTypeLabel(entry.costType)} · {dreGroupLabel(entry.dreGroup)} · {entry.categoryName} · {entry.month}
                    </p>
                  </div>
                  <div className={styles.rowTail}>
                    <strong className={styles.rowAmount}>{formatCurrency(entry.amount)}</strong>
                    <div className={styles.rowActions}>
                      <button
                        type="button"
                        className={`${styles.flagBtn} ${entry.flaggedForReview ? styles.flagActive : ''}`}
                        onClick={() => handleToggleFlag(entry.id)}
                        title={entry.flaggedForReview ? 'Remover revisão' : 'Marcar para revisão'}
                      >🚩</button>
                      {attached ? (
                        <button type="button" className={styles.attachBtn} onClick={() => setViewingAttachment(entry.id)} title="Ver comprovante">📎</button>
                      ) : (
                        <>
                          <input
                            type="file"
                            accept="image/*,application/pdf"
                            style={{ display: 'none' }}
                            ref={(el) => { fileInputRefs.current[entry.id] = el }}
                            onChange={(e) => { if (e.target.files?.[0]) handleAttachFile(entry.id, e.target.files[0]); e.target.value = '' }}
                          />
                          <button type="button" className={styles.attachBtn} onClick={() => fileInputRefs.current[entry.id]?.click()} title="Anexar comprovante">📎</button>
                        </>
                      )}
                      <div className={styles.rowMenu}>
                        <button
                          type="button"
                          className={styles.menuBtn}
                          onClick={() => { setMenuOpenId(menuOpenId === entry.id ? null : entry.id); setConfirmRemoveId(null) }}
                          disabled={!canMutateEntry(entry.month)}
                          aria-label="Mais opções"
                        >⋯</button>
                        {menuOpenId === entry.id && (
                          <div className={styles.menuDropdown}>
                            {confirmRemoveId === entry.id ? (
                              <>
                                <span className={styles.menuConfirmText}>Remover este lançamento?</span>
                                <button type="button" className={styles.menuItemDanger} onClick={() => { removeEntry(entry.id); setMenuOpenId(null); setConfirmRemoveId(null) }}>Confirmar</button>
                                <button type="button" className={styles.menuItemCancel} onClick={() => setConfirmRemoveId(null)}>Cancelar</button>
                              </>
                            ) : (
                              <>
                                <button type="button" className={styles.menuItem} onClick={() => { openEdit(entry.id); setMenuOpenId(null) }}>Editar</button>
                                <button type="button" className={styles.menuItem} onClick={() => openCommitmentModal(entry.id, 'fixed')}>+ Conta fixa</button>
                                <button type="button" className={styles.menuItem} onClick={() => openCommitmentModal(entry.id, 'installment')}>+ Parcelamento</button>
                                <button type="button" className={styles.menuItemDanger} onClick={() => setConfirmRemoveId(entry.id)}>Remover</button>
                                {attached && <button type="button" className={styles.menuItemDanger} onClick={() => { handleRemoveAttachment(entry.id); setMenuOpenId(null) }}>Remover comprovante</button>}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {viewingAttachment && (() => {
          const att = getAttachment(viewingAttachment)
          if (!att) return null
          return (
            <div className={styles.attachModal} onClick={() => setViewingAttachment(null)}>
              <div className={styles.attachModalInner} onClick={(e) => e.stopPropagation()}>
                <div className={styles.attachModalHeader}>
                  <span className={styles.attachModalName}>{att.name}</span>
                  <button type="button" className={styles.attachModalClose} onClick={() => setViewingAttachment(null)}>✕ Fechar</button>
                </div>
                {att.type.startsWith('image/') ? (
                  <img src={att.data} alt={att.name} className={styles.attachPreview} />
                ) : (
                  <iframe src={att.data} title={att.name} className={styles.attachPreview} />
                )}
                <a href={att.data} download={att.name} className={styles.attachDownload}>Baixar arquivo</a>
              </div>
            </div>
          )
        })()}
      </Card>

      {commitmentModal && (
        <div className={styles.attachModal} onClick={() => setCommitmentModal(null)}>
          <div className={styles.commitmentModalInner} onClick={(e) => e.stopPropagation()}>
            <div className={styles.attachModalHeader}>
              <span className={styles.attachModalName}>
                {commitmentModal.type === 'fixed' ? 'Adicionar como conta fixa' : 'Adicionar como parcelamento'}
              </span>
              <button type="button" className={styles.attachModalClose} onClick={() => setCommitmentModal(null)}>✕ Fechar</button>
            </div>

            <div className={styles.commitmentModalBody}>
              <div className={styles.commitmentPreview}>
                <span className={styles.commitmentPreviewLabel}>{commitmentModal.description}</span>
                <strong className={styles.commitmentPreviewAmount}>{formatCurrency(commitmentModal.amount)}</strong>
              </div>

              {commitmentModal.type === 'fixed' ? (
                <label className={styles.commitmentField}>
                  <span>Data de fim (opcional)</span>
                  <input
                    type="month"
                    value={commitmentModal.endMonth}
                    min={commitmentModal.startMonth}
                    onChange={(e) => setCommitmentModal((m) => m && ({ ...m, endMonth: e.target.value }))}
                    placeholder={commitmentModal.startMonth}
                  />
                  <small className={styles.commitmentHint}>Deixe em branco para recorrência contínua.</small>
                </label>
              ) : (
                <div className={styles.commitmentInstallmentRow}>
                  <label className={styles.commitmentField}>
                    <span>Parcela atual</span>
                    <input
                      type="number"
                      min={1}
                      value={commitmentModal.currentInstallment}
                      onChange={(e) => setCommitmentModal((m) => m && ({ ...m, currentInstallment: e.target.value }))}
                    />
                  </label>
                  <span className={styles.commitmentOf}>de</span>
                  <label className={styles.commitmentField}>
                    <span>Total de parcelas</span>
                    <input
                      type="number"
                      min={1}
                      value={commitmentModal.totalInstallments}
                      onChange={(e) => setCommitmentModal((m) => m && ({ ...m, totalInstallments: e.target.value }))}
                    />
                  </label>
                </div>
              )}

              {commitmentModal.error && <p className={styles.commitmentError}>{commitmentModal.error}</p>}

              <button type="button" className={styles.commitmentSubmit} onClick={submitCommitment}>
                {commitmentModal.type === 'fixed' ? 'Salvar como conta fixa' : 'Salvar parcelamento'}
              </button>
              <small className={styles.commitmentHint}>Aparecerá em Previsão → Compromissos.</small>
            </div>
          </div>
        </div>
      )}
    </ScreenContainer>
  )
}
