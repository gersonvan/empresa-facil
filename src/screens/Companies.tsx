import { useMemo, useState } from 'react'
import ScreenContainer from '../components/ScreenContainer'
import { Button, Card, Input } from '../components/ui'
import {
  createCompany,
  getActiveCompanyId,
  getCompanyById,
  listCompanies,
  setActiveCompany,
  updateCompany,
} from '../companyStore'
import styles from './Companies.module.css'

interface FormState {
  name: string
  cnpj: string
  segment: string
}

const initialForm: FormState = {
  name: '',
  cnpj: '',
  segment: '',
}

function formatCnpj(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 14)

  if (digits.length <= 2) {
    return digits
  }

  if (digits.length <= 5) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`
  }

  if (digits.length <= 8) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`
  }

  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`
  }

  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12)}`
}

export default function Companies() {
  const [form, setForm] = useState<FormState>(initialForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [message, setMessage] = useState('')
  const [refreshToken, setRefreshToken] = useState(0)

  const companies = useMemo(() => listCompanies({ includeArchived: true }), [refreshToken])
  const activeCompanyId = getActiveCompanyId()

  function refreshList() {
    setRefreshToken((current) => current + 1)
  }

  function resetForm() {
    setForm(initialForm)
    setEditingId(null)
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      if (editingId) {
        updateCompany(editingId, {
          name: form.name,
          cnpj: form.cnpj,
          segment: form.segment,
        })
        setMessage('Empresa atualizada com sucesso.')
      } else {
        createCompany({
          name: form.name,
          cnpj: form.cnpj,
          segment: form.segment,
        })
        setMessage('Empresa criada com sucesso.')
      }

      resetForm()
      refreshList()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível salvar a empresa.')
    }
  }

  function startEdit(companyId: string) {
    const company = getCompanyById(companyId)
    if (!company) {
      setMessage('Empresa não encontrada para edição.')
      return
    }

    setEditingId(company.id)
    setForm({
      name: company.name,
      cnpj: company.cnpj ?? '',
      segment: company.segment ?? '',
    })
    setMessage('')
  }

  function activateCompany(companyId: string) {
    try {
      setActiveCompany(companyId)
      setMessage('Empresa ativa atualizada com sucesso.')
      refreshList()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível ativar esta empresa.')
    }
  }

  function toggleArchive(companyId: string) {
    const company = getCompanyById(companyId)
    if (!company) {
      setMessage('Empresa não encontrada.')
      return
    }

    if (company.id === activeCompanyId && company.status === 'active') {
      setMessage('Não é possível arquivar a empresa ativa atual. Ative outra empresa antes.')
      return
    }

    try {
      updateCompany(company.id, {
        status: company.status === 'active' ? 'archived' : 'active',
      })
      setMessage(company.status === 'active' ? 'Empresa arquivada com sucesso.' : 'Empresa reativada com sucesso.')
      refreshList()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Não foi possível atualizar o status da empresa.')
    }
  }

  return (
    <ScreenContainer title="Empresas">
      <Card className={styles.formCard}>
        <h2 className={styles.sectionTitle}>{editingId ? 'Editar empresa' : 'Nova empresa'}</h2>
        <p className={styles.helper}>Cadastre empresas para separar DRE, lançamentos e deduções por contexto.</p>
        {message ? <p className={styles.message}>{message}</p> : null}

        <form className={styles.formGrid} onSubmit={handleSubmit}>
          <Input
            label="Nome da empresa"
            placeholder="Ex.: Oficina Horizonte"
            value={form.name}
            onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
            required
          />

          <Input
            label="CNPJ (opcional)"
            inputMode="numeric"
            placeholder="00.000.000/0001-00"
            value={formatCnpj(form.cnpj)}
            onChange={(event) => setForm((current) => ({ ...current, cnpj: event.target.value }))}
          />

          <Input
            label="Segmento (opcional)"
            placeholder="Ex.: Serviços"
            value={form.segment}
            onChange={(event) => setForm((current) => ({ ...current, segment: event.target.value }))}
          />

          <div className={styles.formActions}>
            <Button size="sm" type="submit">
              {editingId ? 'Salvar empresa' : 'Criar empresa'}
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
        <h2 className={styles.sectionTitle}>Empresas cadastradas</h2>
        <ul className={styles.list}>
          {companies.map((company) => (
            <li key={company.id} className={styles.row}>
              <div>
                <p className={styles.rowTitle}>
                  {company.name}{' '}
                  {company.id === activeCompanyId ? <span className={styles.badge}>Ativa</span> : null}
                </p>
                <p className={styles.rowMeta}>
                  {company.cnpj ? `CNPJ: ${formatCnpj(company.cnpj)}` : 'CNPJ não informado'}
                  {' · '}
                  {company.segment || 'Segmento não informado'}
                  {' · '}
                  {company.status === 'active' ? 'Ativa' : 'Arquivada'}
                </p>
              </div>
              <div className={styles.rowActions}>
                <Button size="sm" variant="ghost" onClick={() => startEdit(company.id)}>
                  Editar
                </Button>
                {company.status === 'active' && company.id !== activeCompanyId ? (
                  <Button size="sm" variant="secondary" onClick={() => activateCompany(company.id)}>
                    Ativar
                  </Button>
                ) : null}
                <Button size="sm" variant="outline" onClick={() => toggleArchive(company.id)}>
                  {company.status === 'active' ? 'Arquivar' : 'Reativar'}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </ScreenContainer>
  )
}
