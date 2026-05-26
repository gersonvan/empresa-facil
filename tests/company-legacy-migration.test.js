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

  storage.setItem(
    'empresa-facil:launch-entries:v1',
    JSON.stringify([
      { id: 'ln-1', companyId: 'cmp-launch', month: '2026-05', costType: 'company', description: 'A', amount: 1 },
    ])
  )
  storage.setItem(
    'empresa-facil:tax-profile:v1',
    JSON.stringify([{ companyId: 'cmp-tax', annualRevenueForecast: 1000 }])
  )
  storage.setItem(
    'empresa-facil:deduction-reconciliation:v1',
    JSON.stringify([{ companyId: 'cmp-rec', month: '2026-05', estimatedTotalDeductions: 0, actualTotalDeductions: 0, adjustmentValue: 0, status: 'open', reviewedBy: 'owner', reviewedAt: new Date().toISOString(), notes: '' }])
  )
  storage.setItem(
    'empresa-facil:month-lifecycle:v1',
    JSON.stringify({
      'cmp-life:2026-05': { companyId: 'cmp-life', month: '2026-05', status: 'open' },
    })
  )

  const windowMock = createWindowMock(storage)
  globalThis.window = windowMock
  globalThis.localStorage = storage

  const { listCompanies } = await import('../src/companyStore.ts')

  const companies = listCompanies({ includeArchived: true })
  const ids = companies.map((company) => company.id)

  assert.equal(ids.includes('cmp-launch'), true)
  assert.equal(ids.includes('cmp-tax'), true)
  assert.equal(ids.includes('cmp-rec'), true)
  assert.equal(ids.includes('cmp-life'), true)

  console.log('Company legacy migration validation passed.')
}

run()
