import assert from 'node:assert/strict'

function createStorage() {
  const map = new Map()
  return {
    getItem(key) {
      return map.get(key) ?? null
    },
    setItem(key, value) {
      map.set(key, String(value))
    },
    removeItem(key) {
      map.delete(key)
    },
    clear() {
      map.clear()
    },
  }
}

function createWindowMock(storage) {
  const listeners = new Map()

  return {
    localStorage: storage,
    addEventListener(eventName, handler) {
      const current = listeners.get(eventName) ?? []
      listeners.set(eventName, [...current, handler])
    },
    removeEventListener(eventName, handler) {
      const current = listeners.get(eventName) ?? []
      listeners.set(
        eventName,
        current.filter((candidate) => candidate !== handler)
      )
    },
    dispatchEvent(event) {
      const handlers = listeners.get(event.type) ?? []
      handlers.forEach((handler) => handler(event))
      return true
    },
  }
}

async function run() {
  const storage = createStorage()

  globalThis.Event = class Event {
    constructor(type) {
      this.type = type
    }
  }

  const windowMock = createWindowMock(storage)
  globalThis.window = windowMock
  globalThis.localStorage = storage

  const { createCompany, getActiveCompanyId, setActiveCompany } = await import('../src/companyStore.ts')
  const { getTaxProfile, upsertTaxProfile } = await import('../src/taxProfileStore.ts')
  const { getDeductionReconciliation, saveDeductionReconciliation } = await import('../src/reconciliationStore.ts')

  const companyA = createCompany({ name: 'Empresa A' })
  const companyB = createCompany({ name: 'Empresa B' })

  setActiveCompany(companyA.id)
  assert.equal(getActiveCompanyId(), companyA.id)
  upsertTaxProfile({
    companyId: getActiveCompanyId(),
    annualRevenueForecast: 120000,
  })

  setActiveCompany(companyB.id)
  assert.equal(getActiveCompanyId(), companyB.id)
  upsertTaxProfile({
    companyId: getActiveCompanyId(),
    annualRevenueForecast: 480000,
  })

  const profileA = getTaxProfile(companyA.id)
  const profileB = getTaxProfile(companyB.id)

  assert.equal(profileA?.annualRevenueForecast, 120000)
  assert.equal(profileB?.annualRevenueForecast, 480000)

  saveDeductionReconciliation({
    companyId: companyA.id,
    month: '2026-05',
    estimatedTotalDeductions: 100,
    actualTotalDeductions: 95,
    adjustmentValue: -5,
    status: 'reconciled',
    reviewedBy: 'owner',
  })

  saveDeductionReconciliation({
    companyId: companyB.id,
    month: '2026-05',
    estimatedTotalDeductions: 200,
    actualTotalDeductions: 210,
    adjustmentValue: 10,
    status: 'reconciled',
    reviewedBy: 'owner',
  })

  const reconA = getDeductionReconciliation(companyA.id, '2026-05')
  const reconB = getDeductionReconciliation(companyB.id, '2026-05')

  assert.equal(reconA?.adjustmentValue, -5)
  assert.equal(reconB?.adjustmentValue, 10)

  console.log('Company context isolation validation passed.')
}

run()