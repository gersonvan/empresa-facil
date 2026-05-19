// EmpresaFacil — Design Tokens + Base UI Components
// Tokens: warm off-white bg, forest green accent, Figtree font

const EFTokens = {
  light: {
    bg: '#F8F7F4', card: '#FFFFFF', subtle: '#F2EFE9',
    border: '#E8E3DA', borderSt: '#C5BEB2',
    text: '#1A1A18', text2: '#5C5954', text3: '#9A9690',
    green: '#1B4332', greenMid: '#2D6A4F', greenLite: '#E4F2EB',
    pos: '#15803D', posBg: '#F0FDF4',
    neg: '#B91C1C', negBg: '#FFF1F1',
    warn: '#92400E', warnBg: '#FFFBEB',
    info: '#1D4ED8', infoBg: '#EFF6FF',
    sidebarBg: '#1B4332', sidebarText: '#C8E6D6', sidebarActive: '#FFFFFF',
    sidebarActiveBg: 'rgba(255,255,255,0.12)',
  },
  dark: {
    bg: '#111210', card: '#1C1E1B', subtle: '#252720',
    border: '#2E312B', borderSt: '#404540',
    text: '#F0EDE6', text2: '#9A9690', text3: '#6A6660',
    green: '#52B788', greenMid: '#74C69D', greenLite: '#0C2015',
    pos: '#52B788', posBg: '#0C2015',
    neg: '#F87171', negBg: '#2D1515',
    warn: '#FBBF24', warnBg: '#291D08',
    info: '#60A5FA', infoBg: '#1A2540',
    sidebarBg: '#0D160F', sidebarText: '#6A8A72', sidebarActive: '#F0EDE6',
    sidebarActiveBg: 'rgba(255,255,255,0.08)',
  }
};

const EFTK = React.createContext(EFTokens.light);
const useTK = () => React.useContext(EFTK);
const fmtR = v => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
const fmtRShort = v => {
  const abs = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (abs >= 1000) return `${sign}R$\u00a0${(abs/1000).toLocaleString('pt-BR', {minimumFractionDigits:1,maximumFractionDigits:1})}k`;
  return fmtR(v);
};

// ── Button ──────────────────────────────────────────────────────────────────
const EFBtn = ({ children, v = 'primary', sz = 'md', onClick, disabled, full, icon, style: sty }) => {
  const t = useTK();
  const [h, sh] = React.useState(false);
  const P = { sm: '6px 12px', md: '9px 16px', lg: '12px 22px', xl: '14px 28px' };
  const F = { sm: '12px', md: '13px', lg: '14px', xl: '15px' };
  const bgs = {
    primary: h ? t.greenMid : t.green,
    secondary: h ? t.subtle : t.card,
    ghost: h ? t.subtle : 'transparent',
    danger: h ? '#DC2626' : '#B91C1C',
    outline: h ? t.greenLite : 'transparent',
  };
  const cls = { primary: '#fff', secondary: t.text, ghost: t.text2, danger: '#fff', outline: t.green };
  const bds = { secondary: `1px solid ${t.border}`, outline: `1px solid ${t.green}` };
  return (
    <button onClick={disabled ? undefined : onClick}
      onMouseEnter={() => sh(true)} onMouseLeave={() => sh(false)}
      style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        gap: '6px', padding: P[sz], fontSize: F[sz], fontWeight: 600,
        fontFamily: 'inherit', border: bds[v] || 'none', borderRadius: '8px',
        cursor: disabled ? 'default' : 'pointer', background: bgs[v], color: cls[v],
        opacity: disabled ? 0.45 : 1, transition: 'all .15s',
        width: full ? '100%' : 'auto', lineHeight: 1, ...sty
      }}>
      {icon}{children}
    </button>
  );
};

// ── Card ─────────────────────────────────────────────────────────────────────
const EFCard = ({ children, style: sty, onClick, p = '20px' }) => {
  const t = useTK();
  const [h, sh] = React.useState(false);
  return (
    <div onClick={onClick} onMouseEnter={() => sh(true)} onMouseLeave={() => sh(false)}
      style={{
        background: t.card, border: `1px solid ${t.border}`, borderRadius: '12px',
        padding: p, cursor: onClick ? 'pointer' : 'default',
        boxShadow: h && onClick ? '0 6px 20px rgba(0,0,0,.1)' : '0 1px 3px rgba(0,0,0,.04)',
        transform: h && onClick ? 'translateY(-1px)' : 'none',
        transition: 'all .15s', ...sty
      }}>
      {children}
    </div>
  );
};

// ── Badge ─────────────────────────────────────────────────────────────────────
const EFBadge = ({ children, v = 'default', dot }) => {
  const t = useTK();
  const m = {
    default: [t.subtle, t.text2], success: [t.posBg, t.pos],
    error: [t.negBg, t.neg], warning: [t.warnBg, t.warn],
    primary: [t.greenLite, t.green], info: [t.infoBg, t.info],
  };
  const [bg, cl] = m[v] || m.default;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      padding: '3px 9px', borderRadius: '100px', fontSize: '11px',
      fontWeight: 700, background: bg, color: cl, letterSpacing: '0.2px'
    }}>
      {dot && <span style={{ width: 6, height: 6, borderRadius: '50%', background: cl, flexShrink: 0 }}></span>}
      {children}
    </span>
  );
};

// ── Input ─────────────────────────────────────────────────────────────────────
const EFInput = ({ label, type = 'text', val, onChange, ph, prefix, helper, opt, big, autoFocus }) => {
  const t = useTK();
  const [f, sf] = React.useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {label && (
        <label style={{ fontSize: '12px', fontWeight: 600, color: t.text2 }}>
          {label}{opt && <span style={{ fontWeight: 400, color: t.text3 }}> (opcional)</span>}
        </label>
      )}
      <div style={{
        display: 'flex', alignItems: 'stretch',
        border: `1.5px solid ${f ? t.greenMid : t.border}`,
        borderRadius: '8px', overflow: 'hidden', background: t.card, transition: 'border-color .15s'
      }}>
        {prefix && (
          <span style={{
            padding: '0 12px', background: t.subtle, color: t.text2,
            borderRight: `1px solid ${t.border}`, display: 'flex',
            alignItems: 'center', fontSize: big ? '18px' : '13px', fontWeight: 700
          }}>{prefix}</span>
        )}
        <input type={type} value={val} onChange={e => onChange && onChange(e.target.value)}
          placeholder={ph} onFocus={() => sf(true)} onBlur={() => sf(false)} autoFocus={autoFocus}
          style={{
            flex: 1, padding: big ? '14px 16px' : '10px 12px', border: 'none',
            outline: 'none', background: 'transparent', fontSize: big ? '22px' : '14px',
            color: t.text, fontFamily: 'inherit', fontWeight: big ? 700 : 400,
            fontVariantNumeric: 'tabular-nums'
          }} />
      </div>
      {helper && <span style={{ fontSize: '11px', color: t.text3 }}>{helper}</span>}
    </div>
  );
};

// ── Select ────────────────────────────────────────────────────────────────────
const EFSel = ({ label, val, onChange, opts, opt: optional }) => {
  const t = useTK();
  const [f, sf] = React.useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      {label && (
        <label style={{ fontSize: '12px', fontWeight: 600, color: t.text2 }}>
          {label}{optional && <span style={{ fontWeight: 400, color: t.text3 }}> (opcional)</span>}
        </label>
      )}
      <select value={val} onChange={e => onChange && onChange(e.target.value)}
        onFocus={() => sf(true)} onBlur={() => sf(false)}
        style={{
          padding: '10px 12px', border: `1.5px solid ${f ? t.greenMid : t.border}`,
          borderRadius: '8px', background: t.card, fontSize: '14px', color: t.text,
          fontFamily: 'inherit', outline: 'none', cursor: 'pointer', transition: 'border-color .15s'
        }}>
        {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
};

// ── Segmented ─────────────────────────────────────────────────────────────────
const EFSeg = ({ opts, val, onChange, full }) => {
  const t = useTK();
  return (
    <div style={{
      display: 'flex', background: t.subtle, borderRadius: '10px',
      padding: '3px', gap: '2px', width: full ? '100%' : 'auto'
    }}>
      {opts.map(o => (
        <button key={o.v} onClick={() => onChange(o.v)}
          style={{
            flex: 1, padding: '9px 16px', border: 'none', borderRadius: '8px',
            fontFamily: 'inherit', fontSize: '14px', fontWeight: 600, cursor: 'pointer',
            background: val === o.v ? t.card : 'transparent',
            color: val === o.v ? t.text : t.text2,
            boxShadow: val === o.v ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
            transition: 'all .15s'
          }}>
          {o.l}
        </button>
      ))}
    </div>
  );
};

// ── Divider ───────────────────────────────────────────────────────────────────
const EFHr = ({ label }) => {
  const t = useTK();
  if (label) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: '4px 0' }}>
      <div style={{ flex: 1, height: '1px', background: t.border }}></div>
      <span style={{ fontSize: '11px', color: t.text3, fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: '1px', background: t.border }}></div>
    </div>
  );
  return <div style={{ height: '1px', background: t.border }}></div>;
};

// ── KPI Card ──────────────────────────────────────────────────────────────────
const EFKpiCard = ({ label, value, delta, isResult, warning }) => {
  const t = useTK();
  const positive = value >= 0;
  const valColor = isResult ? (positive ? t.pos : t.neg) : t.text;
  return (
    <EFCard style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '12px', fontWeight: 600, color: t.text3, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '26px', fontWeight: 800, color: valColor, fontVariantNumeric: 'tabular-nums', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
        {fmtRShort(value)}
      </div>
      {delta !== undefined && (
        <div style={{ marginTop: '8px', fontSize: '12px', color: delta >= 0 ? t.pos : t.neg, fontWeight: 600 }}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta)}% vs mês ant.
        </div>
      )}
      {warning && (
        <div style={{ marginTop: '8px', fontSize: '11px', color: t.warn }}>{warning}</div>
      )}
    </EFCard>
  );
};

Object.assign(window, {
  EFTokens, EFTK, useTK, fmtR, fmtRShort,
  EFBtn, EFCard, EFBadge, EFInput, EFSel, EFSeg, EFHr, EFKpiCard
});
