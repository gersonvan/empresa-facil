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
  storage.setItem('empresa-facil:active-company-id', 'legacy-company')

  globalThis.Event = class Event {
    constructor(type) {
      this.type = type
    }
  }

  const windowMock = createWindowMock(storage)
  globalThis.window = windowMock
  globalThis.localStorage = storage

  const {
    createCompany,
    getActiveCompany,
    getActiveCompanyId,
    getCompanyById,
    listCompanies,
    setActiveCompany,
    updateCompany,
  } = await import('../src/companyStore.ts')

  const seeded = getActiveCompany()
  assert.equal(seeded?.id, 'legacy-company', 'legacy active company should be migrated to company seed')

  const created = createCompany({
    name: 'Oficina Horizonte',
    cnpj: '12.345.678/0001-90',
    segment: 'Serviços',
  })

  assert.equal(created.name, 'Oficina Horizonte')
  assert.equal(created.cnpj, '12345678000190')

  setActiveCompany(created.id)
  assert.equal(getActiveCompanyId(), created.id, 'active company should switch after explicit activation')

  const loaded = getCompanyById(created.id)
  assert.equal(loaded?.segment, 'Serviços')

  updateCompany(created.id, { status: 'archived' })
  const archived = getCompanyById(created.id)
  assert.equal(archived?.status, 'archived')

  const activeCompanies = listCompanies()
  assert.equal(
    activeCompanies.some((company) => company.id === created.id),
    false,
    'archived company should not appear in active list'
  )

  assert.equal(
    getActiveCompanyId() !== created.id,
    true,
    'archiving active company should force fallback to another active company'
  )

  console.log('Company store foundation validation passed.')
}

run()