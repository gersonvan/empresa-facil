import { useMemo } from 'react'
import ScreenContainer from '../components/ScreenContainer'
import { Card } from '../components/ui'
import { listCategories } from '../categoryStore'
import styles from './ChartOfAccounts.module.css'

interface AccountGroup {
  code: string
  title: string
  costType: 'company' | 'personal'
  dreGroup: 'revenue' | 'expenses'
}

const accountGroups: AccountGroup[] = [
  { code: '1.1', title: 'Receitas Empresariais', costType: 'company', dreGroup: 'revenue' },
  { code: '1.2', title: 'Receitas Pessoais', costType: 'personal', dreGroup: 'revenue' },
  { code: '2.1', title: 'Despesas Empresariais', costType: 'company', dreGroup: 'expenses' },
  { code: '2.2', title: 'Despesas Pessoais', costType: 'personal', dreGroup: 'expenses' },
]

function normalizeCategoryCode(index: number, groupCode: string) {
  const number = String(index + 1).padStart(2, '0')
  return `${groupCode}.${number}`
}

export default function ChartOfAccounts() {
  const groupedAccounts = useMemo(() => {
    return accountGroups.map((group) => {
      const categories = listCategories({
        costType: group.costType,
        dreGroup: group.dreGroup,
      }).map((category, index) => ({
        code: normalizeCategoryCode(index, group.code),
        name: category.name,
      }))

      return {
        ...group,
        categories,
      }
    })
  }, [])

  return (
    <ScreenContainer title="Plano de Contas">
      <Card className={styles.introCard}>
        <h2 className={styles.sectionTitle}>Estrutura sugerida</h2>
        <p className={styles.helperText}>
          Este plano organiza receitas e despesas de Empresa/Pessoal por natureza DRE. As categorias em cada grupo
          vêm da tela de Categorias e servem como base para evolução contábil.
        </p>
      </Card>

      <div className={styles.grid}>
        {groupedAccounts.map((group) => (
          <Card key={group.code}>
            <h2 className={styles.sectionTitle}>
              {group.code} · {group.title}
            </h2>
            {group.categories.length === 0 ? (
              <p className={styles.emptyText}>Sem categorias neste grupo. Cadastre em Categorias.</p>
            ) : (
              <ul className={styles.list}>
                {group.categories.map((category) => (
                  <li key={category.code} className={styles.row}>
                    <span className={styles.code}>{category.code}</span>
                    <span className={styles.name}>{category.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        ))}
      </div>
    </ScreenContainer>
  )
}
