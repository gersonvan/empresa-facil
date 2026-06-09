import { useEffect, useState } from 'react'
import { syncClient, type SyncStatus } from '../syncClient'

export function useSyncStatus(): SyncStatus {
  const [status, setStatus] = useState<SyncStatus>(syncClient.getStatus())

  useEffect(() => {
    return syncClient.onStatusChange(setStatus)
  }, [])

  return status
}
