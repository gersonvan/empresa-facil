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

  useEffect(() => {
    const eventName = getActiveCompanyChangedEventName()

    function handleRefresh() {
      setRefreshToken((current) => current + 1)
    }

    window.addEventListener(eventName, handleRefresh)
    return () => window.removeEventListener(eventName, handleRefresh)
  }, [])

  const companies = useMemo(() => listCompanies({ includeArchived: false }), [refreshToken])

  if (companies.length === 0) {
    return null
  }

  const activeCompanyId = getActiveCompanyId()

  return (
    <label className={styles.field} htmlFor="company-switcher">
      <span>Empresa ativa</span>
      <select
        id="company-switcher"
        value={activeCompanyId}
        onChange={(event) => setActiveCompany(event.target.value)}
      >
        {companies.map((company) => (
          <option key={company.id} value={company.id}>
            {company.name}
          </option>
        ))}
      </select>
    </label>
  )
}
