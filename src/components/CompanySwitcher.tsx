import { useEffect, useMemo, useState } from 'react'
import {
  getActiveCompanyChangedEventName,
  getActiveCompanyId,
  listCompanies,
  setActiveCompany,
} from '../companyStore'
import styles from './CompanySwitcher.module.css'

export default function CompanySwitcher() {
  const [refreshToken, setRefreshToken] = useState(0)
  const [toastName, setToastName] = useState<string | null>(null)

  useEffect(() => {
    const eventName = getActiveCompanyChangedEventName()
    function handleRefresh() { setRefreshToken((current) => current + 1) }
    window.addEventListener(eventName, handleRefresh)
    return () => window.removeEventListener(eventName, handleRefresh)
  }, [])

  const companies = useMemo(() => listCompanies({ includeArchived: false }), [refreshToken])

  if (companies.length === 0) return null

  const activeCompanyId = getActiveCompanyId()

  function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const chosen = companies.find((c) => c.id === event.target.value)
    setActiveCompany(event.target.value)
    if (chosen) {
      setToastName(chosen.name)
      setTimeout(() => setToastName(null), 2200)
    }
  }

  return (
    <div className={styles.wrapper}>
      {toastName && (
        <div className={styles.toast} role="status" aria-live="polite">
          {toastName} ativa
        </div>
      )}
      <label className={styles.field} htmlFor="company-switcher">
        <span>Empresa ativa</span>
        <select
          id="company-switcher"
          value={activeCompanyId}
          onChange={handleChange}
        >
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
