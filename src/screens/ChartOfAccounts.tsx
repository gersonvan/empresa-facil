import { useMemo, useState } from 'react'
import ScreenContainer from '../components/ScreenContainer'
import { Button, Card } from '../components/ui'
import {
  addCategoryToGroup,
  getAvailableCategoriesForGroup,
  getPlanGroups,
  moveCategoryWithinGroup,
  removeCategoryFromGroup,
  resetPlanToDefaults,
  type PlanGroupKey,
  type PlanGroupState,
} from '../planStore'
import { listCategories } from '../categoryStore'
import styles from './ChartOfAccounts.module.css'

interface DragState {
  groupKey: PlanGroupKey
  categoryId: string
  index: number
}

export default function ChartOfAccounts() {
  const [planGroups, setPlanGroups] = useState<PlanGroupState[]>(() => getPlanGroups())
  const [editModeByGroup, setEditModeByGroup] = useState<Record<PlanGroupKey, boolean>>({
    'company-revenue': false,
    'personal-revenue': false,
    'company-expenses': false,
    'personal-expenses': false,
  })
  const [selectedCategoryByGroup, setSelectedCategoryByGroup] = useState<Record<PlanGroupKey, string | null>>({
    'company-revenue': null,
    'personal-revenue': null,
    'company-expenses': null,
    'personal-expenses': null,
  })
  const [pendingAddByGroup, setPendingAddByGroup] = useState<Record<PlanGroupKey, string>>({
    'company-revenue': '',
    'personal-revenue': '',
    'company-expenses': '',
    'personal-expenses': '',
  })
  const [dragState, setDragState] = useState<DragState | null>(null)
  const [message, setMessage] = useState('')

  const groupedMetrics = useMemo(() => {
    return planGroups.map((group) => ({
      key: group.key,
      count: group.categoryIds.length,
      availableCount: getAvailableCategoriesForGroup(group.key).length,
    }))
  }, [planGroups])

  function toggleEditMode(groupKey: PlanGroupKey) {
    setEditModeByGroup((current) => ({
      ...current,
      [groupKey]: !current[groupKey],
    }))
    setSelectedCategoryByGroup((current) => ({
      ...current,
      [groupKey]: null,
    }))
    setMessage('')
  }

  function handleAddCategory(groupKey: PlanGroupKey) {
    const categoryId = pendingAddByGroup[groupKey]
    if (!categoryId) {
      setMessage('Escolha uma categoria para adicionar.')
      return
    }

    try {
      const next = addCategoryToGroup(groupKey, categoryId)
      setPlanGroups(next)
      setPendingAddByGroup((current) => ({ ...current, [groupKey]: '' }))
      setMessage('Categoria adicionada ao plano.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível adicionar a categoria.')
    }
  }

  function handleRemoveCategory(groupKey: PlanGroupKey) {
    const selectedId = selectedCategoryByGroup[groupKey]
    if (!selectedId) {
      setMessage('Selecione uma categoria antes de remover.')
      return
    }

    try {
      const next = removeCategoryFromGroup(groupKey, selectedId)
      setPlanGroups(next)
      setSelectedCategoryByGroup((current) => ({ ...current, [groupKey]: null }))
      setMessage('Categoria removida do plano.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível remover a categoria.')
    }
  }

  function handleDrop(groupKey: PlanGroupKey, toIndex: number) {
    if (!dragState || dragState.groupKey !== groupKey) {
      return
    }

    try {
      const next = moveCategoryWithinGroup(groupKey, dragState.index, toIndex)
      setPlanGroups(next)
      setMessage('Ordem atualizada.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível reordenar o plano.')
    } finally {
      setDragState(null)
    }
  }

  function restoreDefaults() {
    const confirmed = window.confirm('Restaurar o plano para a configuração padrão? As ordens editadas serão perdidas.')
    if (!confirmed) {
      return
    }

    setPlanGroups(resetPlanToDefaults())
    setMessage('Plano restaurado para o padrão.')
  }

  return (
    <ScreenContainer title="Plano de Contas">
      <Card className={styles.introCard}>
        <div className={styles.headerRow}>
          <div>
            <h2 className={styles.sectionTitle}>Estrutura editável</h2>
            <p className={styles.helperText}>
              Arraste e solte para mudar a ordem. Use o botão + para incluir categorias e o - para remover a categoria
              selecionada do grupo. As alterações ficam salvas localmente.
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={restoreDefaults}>
            Restaurar padrão
          </Button>
        </div>
        {message ? <p className={styles.message}>{message}</p> : null}
      </Card>

      <div className={styles.grid}>
        {planGroups.map((group) => {
          const availableCategories = getAvailableCategoriesForGroup(group.key)
          const isEditing = editModeByGroup[group.key]
          const selectedCategoryId = selectedCategoryByGroup[group.key]

          return (
            <Card key={group.key} className={styles.groupCard}>
              <div className={styles.groupHeader}>
                <div>
                  <h2 className={styles.sectionTitle}>{group.title}</h2>
                  <p className={styles.helperText}>
                    {group.costType === 'company' ? 'Empresa' : 'Pessoal'} · {group.dreGroup === 'revenue' ? 'Receitas' : 'Despesas'} ·{' '}
                    {group.categoryIds.length} categoria(s)
                  </p>
                </div>
                <Button size="sm" variant={isEditing ? 'primary' : 'outline'} onClick={() => toggleEditMode(group.key)}>
                  {isEditing ? 'Finalizar edição' : 'Editar ordem'}
                </Button>
              </div>

              {isEditing ? (
                <div className={styles.toolbar}>
                  <div className={styles.toolbarAddRow}>
                    <select
                      className={styles.select}
                      value={pendingAddByGroup[group.key]}
                      onChange={(event) => setPendingAddByGroup((current) => ({ ...current, [group.key]: event.target.value }))}
                    >
                      <option value="">Adicionar categoria...</option>
                      {availableCategories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <Button size="sm" onClick={() => handleAddCategory(group.key)}>
                      +
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleRemoveCategory(group.key)}>
                      -
                    </Button>
                  </div>
                  <p className={styles.toolbarHint}>
                    Segure e arraste um item para reordenar. Clique em um item para selecioná-lo antes de usar o -.
                  </p>
                </div>
              ) : null}

              {group.categoryIds.length === 0 ? (
                <p className={styles.emptyText}>Sem categorias neste grupo. Use o + para adicionar categorias.</p>
              ) : (
                <ul className={styles.list}>
                  {group.categoryIds.map((categoryId, index) => {
                    const category = listCategories({ costType: group.costType, dreGroup: group.dreGroup }).find(
                      (item) => item.id === categoryId
                    )

                    if (!category) {
                      return null
                    }

                    return (
                      <li
                        key={category.id}
                        className={`${styles.row} ${selectedCategoryId === category.id ? styles.rowSelected : ''}`}
                        draggable={isEditing}
                        onDragStart={() => setDragState({ groupKey: group.key, categoryId: category.id, index })}
                        onDragOver={(event) => event.preventDefault()}
                        onDrop={() => handleDrop(group.key, index)}
                        onClick={() =>
                          isEditing
                            ? setSelectedCategoryByGroup((current) => ({ ...current, [group.key]: category.id }))
                            : null
                        }
                      >
                        <span className={styles.code}>{String(index + 1).padStart(2, '0')}</span>
                        <span className={styles.name}>{category.name}</span>
                        {isEditing ? <span className={styles.dragHint}>Segure para mover</span> : null}
                      </li>
                    )
                  })}
                </ul>
              )}
            </Card>
          )
        })}
      </div>

      <Card className={styles.footerCard}>
        <h2 className={styles.sectionTitle}>Resumo do plano</h2>
        <div className={styles.summaryGrid}>
          {groupedMetrics.map((metric) => (
            <div key={metric.key} className={styles.summaryItem}>
              <strong className={styles.summaryValue}>{metric.count}</strong>
              <span className={styles.summaryLabel}>{metric.availableCount} disponíveis</span>
            </div>
          ))}
        </div>
      </Card>
    </ScreenContainer>
  )
}
