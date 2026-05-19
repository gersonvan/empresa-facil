import type { ReactNode } from 'react'
import ThemeToggle from './ThemeToggle'
import styles from './ScreenContainer.module.css'

interface ScreenContainerProps {
  title: string
  children: ReactNode
}

export default function ScreenContainer({ title, children }: ScreenContainerProps) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headingGroup}>
          <h1 className={styles.title}>{title}</h1>
          <p className={styles.subtitle}>Interface alinhada aos tokens do sistema.</p>
        </div>
        <ThemeToggle />
      </header>
      <div className={styles.body}>{children}</div>
    </div>
  )
}
