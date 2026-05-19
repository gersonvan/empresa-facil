import { useId } from 'react'
import type { InputHTMLAttributes } from 'react'
import styles from './Input.module.css'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  helperText?: string
  errorText?: string
}

export default function Input({
  label,
  helperText,
  errorText,
  id,
  className = '',
  ...props
}: InputProps) {
  const generatedId = useId()
  const inputId = id ?? generatedId
  const descriptionId = helperText || errorText ? `${inputId}-description` : undefined

  return (
    <label className={styles.field} htmlFor={inputId}>
      <span className={styles.label}>{label}</span>
      <input
        id={inputId}
        className={`${styles.input} ${errorText ? styles.error : ''} ${className}`.trim()}
        aria-invalid={Boolean(errorText)}
        aria-describedby={descriptionId}
        {...props}
      />
      {helperText || errorText ? (
        <span className={errorText ? styles.errorText : styles.helperText} id={descriptionId}>
          {errorText || helperText}
        </span>
      ) : null}
    </label>
  )
}