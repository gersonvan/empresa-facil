import type { ReactNode } from 'react'
import styles from './ScreenContainer.module.css'

interface ScreenContainerProps {
  title: string
  children: ReactNode
}

export default function ScreenContainer({ title, children }: ScreenContainerProps) {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>{title}</h1>
      </header>
      <div className={styles.body}>{children}</div>
    </div>
  )
}
