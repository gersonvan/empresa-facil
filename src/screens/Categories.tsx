import { useMemo, useState } from 'react'
import ScreenContainer from '../components/ScreenContainer'
import { Button, Card, Input } from '../components/ui'
import { createCategory, deleteCategory, listCategories, updateCategory, type CostType, type DreGroup } from '../categoryStore'
import styles from './Categories.module.css'

interface FormState {
  name: string
  costType: CostType
  dreGroup: DreGroup
}

const initialForm: FormState = {
  name: '',
  costType: 'company',
  dreGroup: 'expenses',
}

export default function Categories() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [refreshToken, setRefreshToken] = useState(0)

  const categories = useMemo(() => listCategories(), [refreshToken])

  function resetForm() {
    setForm(initialForm)
    setEditingId(null)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      if (editingId) {
        updateCategory(editingId, form)
        setMessage('Categoria atualizada com sucesso.')
      } else {
        createCategory(form)
        setMessage('Categoria criada com sucesso.')
      }

      resetForm()
      setRefreshToken((current) => current + 1)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível salvar a categoria.')
    }
  }

  function startEdit(categoryId: string) {
    const category = categories.find((item) => item.id === categoryId)
    if (!category) {
      setMessage('Categoria não encontrada para edição.')
      return
    }

    setEditingId(category.id)
    setForm({
      name: category.name,
      costType: category.costType,
      dreGroup: category.dreGroup,
    })
    setMessage('')
  }

  function handleDelete(categoryId: string) {
    const category = categories.find((item) => item.id === categoryId)
    const categoryName = category?.name ?? 'esta categoria'
    const confirmed = window.confirm(
      `Tem certeza que deseja remover ${categoryName}? Esta ação não poderá ser desfeita.`
    )
    if (!confirmed) {
      return
    }

    deleteCategory(categoryId)
    if (editingId === categoryId) {
      resetForm()
    }

    setRefreshToken((current) => current + 1)
    setMessage('Categoria removida com sucesso.')
  }

  return (
    <ScreenContainer title="Categorias">
      <Card className={styles.formCard}>
        <h2 className={styles.sectionTitle}>{editingId ? 'Editar categoria' : 'Nova categoria'}</h2>
        {message ? <p className={styles.message}>{message}</p> : null}

        <form className={styles.formGrid} onSubmit={handleSubmit}>
          <Input
            label="Nome"
            placeholder="Ex.: Materiais de escritório"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          />

          <label className={styles.field} htmlFor="category-type">
            <span>Tipo</span>
            <select
              id="category-type"
              value={form.costType}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  costType: event.target.value as CostType,
                }))
              }
            >
              <option value="company">Empresa</option>
              <option value="personal">Pessoal</option>
            </select>
          </label>

          <label className={styles.field} htmlFor="category-group">
            <span>Natureza</span>
            <select
              id="category-group"
              value={form.dreGroup}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  dreGroup: event.target.value as DreGroup,
                }))
              }
            >
              <option value="revenue">Receita</option>
              <option value="deductions">Dedução</option>
              <option value="expenses">Despesa</option>
            </select>
          </label>

          <div className={styles.formActions}>
            <Button size="sm" type="submit">
              {editingId ? 'Salvar categoria' : 'Criar categoria'}
            </Button>
            {editingId ? (
              <Button size="sm" variant="outline" onClick={resetForm}>
                Cancelar edição
              </Button>
            ) : null}
          </div>
        </form>
      </Card>

      <Card>
        <h2 className={styles.sectionTitle}>Categorias cadastradas</h2>
        <p className={styles.helper}>Cadastre categorias de receita, dedução e despesa para empresa e pessoal.</p>
        <ul className={styles.list}>
          {categories.map((category) => (
            <li key={category.id} className={styles.row}>
              <div>
                <p className={styles.rowTitle}>{category.name}</p>
                <p className={styles.rowMeta}>
                  {category.costType === 'company' ? 'Empresa' : 'Pessoal'} ·{' '}
                  {category.dreGroup === 'revenue'
                    ? 'Receita'
                    : category.dreGroup === 'deductions'
                      ? 'Dedução'
                      : 'Despesa'}
                </p>
              </div>
              <div className={styles.rowActions}>
                <Button size="sm" variant="ghost" onClick={() => startEdit(category.id)}>
                  Editar
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleDelete(category.id)}>
                  Remover
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </ScreenContainer>
  )
}
