interface SymbolProps {
  size?: number
  onDark?: boolean
}

export function EFSymbol({ size = 48, onDark = false }: SymbolProps) {
  const bg = onDark ? 'rgba(255,255,255,0.12)' : '#1B4332'
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}>
      <rect width="48" height="48" rx="11" fill={bg} />
      <rect x="8"  y="29" width="8" height="12" rx="2.5" fill="white" opacity="0.52" />
      <rect x="20" y="21" width="8" height="20" rx="2.5" fill="white" opacity="0.76" />
      <rect x="32" y="11" width="8" height="30" rx="2.5" fill="white" />
    </svg>
  )
}

interface WordmarkProps {
  size?: number
  onDark?: boolean
}

export function EFWordmark({ size = 24, onDark = false }: WordmarkProps) {
  return (
    <span style={{
      fontFamily: 'Figtree, sans-serif',
      fontSize: size,
      lineHeight: 1,
      letterSpacing: '-0.026em',
      whiteSpace: 'nowrap',
      userSelect: 'none',
    }}>
      <span style={{ fontWeight: 700, color: onDark ? 'white' : '#1A1A18' }}>Empresa</span>
      <span style={{ fontWeight: 800, color: onDark ? '#74C69D' : '#1B4332' }}>Facil</span>
    </span>
  )
}

interface LogoProps {
  iconSize?: number
  onDark?: boolean
  showTagline?: boolean
}

export function EFLogo({ iconSize = 40, onDark = false, showTagline = false }: LogoProps) {
  const gap = Math.round(iconSize * 0.27)
  const wordSize = Math.round(iconSize * 0.56)
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap }}>
      <EFSymbol size={iconSize} onDark={onDark} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <EFWordmark size={wordSize} onDark={onDark} />
        {showTagline && (
          <span style={{
            fontSize: Math.round(wordSize * 0.48),
            color: onDark ? 'rgba(200,230,214,0.68)' : '#9A9690',
            fontWeight: 400,
            letterSpacing: '0.01em',
          }}>
            Controle financeiro simples
          </span>
        )}
      </div>
    </div>
  )
}
