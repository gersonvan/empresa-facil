import type { HTMLAttributes, ReactNode } from 'react'
import styles from './Card.module.css'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  interactive?: boolean
  padding?: 'compact' | 'regular'
}

export default function Card({
  children,
  interactive = false,
  padding = 'regular',
  className = '',
  ...props
}: CardProps) {
  return (
    <div
      className={`${styles.card} ${styles[padding]} ${interactive ? styles.interactive : ''} ${className}`.trim()}
      {...props}
    >
      {children}
    </div>
  )
}