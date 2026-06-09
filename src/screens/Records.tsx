import { useMemo, useState } from 'react'
import ScreenContainer from '../components/ScreenContainer'
import { Card, Button, Input } from '../components/ui'
import { listCategories, type CostType, type DreGroup } from '../categoryStore'
import { formatCurrency, getMonthContext } from './financialOverview'
import { getLaunchEntryById, listLaunchEntries, removeLaunchEntry, updateLaunchEntry } from '../launchStore'
import { monthLifecycleStore } from '../monthLifecycle'
import styles from './Records.module.css'

type CostTypeFilter = 'all' | 'company' | 'personal'
type DreGroupFilter = 'all' | DreGroup

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
  const [monthFilter, setMonthFilter] = useState(monthFromNow())
  const [costTypeFilter, setCostTypeFilter] = useState<CostTypeFilter>('all')
  const [dreGroupFilter, setDreGroupFilter] = useState<DreGroupFilter>('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [searchText, setSearchText] = useState('')
  const [editState, setEditState] = useState<EditState | null>(null)
  const [message, setMessage] = useState('')

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
      }),
    [categoryFilter, costTypeFilter, dreGroupFilter, monthContext.companyId, monthFilter, searchText]
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

  return (
    <ScreenContainer title="Ver Registros">
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

        {entries.length === 0 ? (
          <p className={styles.emptyState}>Nenhum lançamento encontrado para os filtros atuais.</p>
        ) : (
          <ul className={styles.list}>
            {entries.map((entry) => (
              <li key={entry.id} className={styles.row}>
                <div className={styles.rowInfo}>
                  <p className={styles.rowTitle}>{entry.description}</p>
                  <p className={styles.rowMeta}>
                    {costTypeLabel(entry.costType)} · {dreGroupLabel(entry.dreGroup)} · {entry.categoryName} · {entry.month}
                  </p>
                </div>
                <div className={styles.rowTail}>
                  <strong className={styles.rowAmount}>{formatCurrency(entry.amount)}</strong>
                  <div className={styles.rowActions}>
                    <Button size="sm" variant="ghost" onClick={() => openEdit(entry.id)} disabled={!canMutateEntry(entry.month)}>
                      Editar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => removeEntry(entry.id)} disabled={!canMutateEntry(entry.month)}>
                      Remover
                    </Button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </ScreenContainer>
  )
}
