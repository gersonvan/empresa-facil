import type { ReactNode } from 'react'
import NavBar from './NavBar'
import styles from './Shell.module.css'

interface ShellProps {
  children: ReactNode
}

export default function Shell({ children }: ShellProps) {
  return (
    <div className={styles.shell}>
      <NavBar />
      <main className={styles.content}>{children}</main>
    </div>
  )
}
