// EmpresaFacil — All Screen Components

// ── Mock Data ─────────────────────────────────────────────────────────────────
const EF_DATA = {
  companies: [
    { id: 1, name: 'Padaria São João', type: 'MEI', regime: 'Simples Nacional', cnpj: '12.345.678/0001-90', active: true },
    { id: 2, name: 'João Silva (Pessoal)', type: 'PF', regime: null, cnpj: null, active: false },
  ],
  kpis: { receita: 48500, despesas: 31200, resultado: 17300, deltaReceita: 12, deltaDespesas: -3 },
  dre: { receitaBruta: 48500, aliquota: 9.0, deducoes: -4365, despesas: -31200, resultado: 12935 },
  entries: [
    { id: 1, desc: 'Fornecedor de farinhas', val: -1200, cat: 'Insumos', date: 'Hoje', type: 'custo', origin: 'empresa' },
    { id: 2, desc: 'Venda balcão — manhã', val: 3400, cat: 'Vendas', date: 'Hoje', type: 'receita', origin: 'empresa' },
    { id: 3, desc: 'Energia elétrica', val: -780, cat: 'Utilidades', date: '18/05', type: 'custo', origin: 'empresa' },
    { id: 4, desc: 'Venda delivery — tarde', val: 1850, cat: 'Vendas', date: '18/05', type: 'receita', origin: 'empresa' },
    { id: 5, desc: 'Aluguel', val: -3500, cat: 'Aluguel', date: '01/05', type: 'custo', origin: 'empresa' },
    { id: 6, desc: 'Pró-labore', val: -4000, cat: 'Pró-labore', date: '01/05', type: 'custo', origin: 'pessoal' },
  ],
  monthClose: { status: 'aberto', label: 'Aberto', progress: 68, total: 66, done: 45, due: '31/05/2026' },
  history: [
    { month: 'Abril 2026', status: 'fechado', resultado: 14200 },
    { month: 'Março 2026', status: 'fechado', resultado: 11800 },
    { month: 'Fevereiro 2026', status: 'fechado', resultado: 9500 },
  ],
  importPreview: [
    { line: 1, desc: 'Fornecedor farinha — 01/05', ok: true },
    { line: 2, desc: 'Aluguel — 01/05', ok: true },
    { line: 3, desc: 'Categoria inválida: "fornec"', ok: false, err: 'Categoria não reconhecida' },
    { line: 4, desc: 'Energia — 05/05', ok: true },
    { line: 5, desc: 'Pró-labore — 01/05', ok: true },
    { line: 6, desc: 'Venda balcão — 10/05', ok: true },
    { line: 7, desc: 'Data inválida: "32/05/2026"', ok: false, err: 'Data inválida' },
    { line: 8, desc: 'Fornecedor embalagens — 12/05', ok: true },
  ],
  catsCusto: ['Insumos', 'Aluguel', 'Utilidades', 'Funcionários', 'Fornecedores', 'Marketing', 'Equipamentos', 'Pró-labore', 'Outros'],
  catsReceita: ['Vendas balcão', 'Vendas delivery', 'Serviços', 'Outros'],
};

// ── ScreenDashboard ───────────────────────────────────────────────────────────
const ScreenDashboard = ({ onLancar, company }) => {
  const t = useTK();
  const d = EF_DATA;
  const comp = company || d.companies[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: t.text, letterSpacing: '-0.02em' }}>Bom dia!</div>
          <div style={{ fontSize: '14px', color: t.text2, marginTop: '2px' }}>Maio 2026 · {comp.name}</div>
        </div>
        <EFBtn v="primary" sz="md" onClick={onLancar}
          icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}>
          Registrar lançamento
        </EFBtn>
      </div>

      {/* KPIs */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        <EFKpiCard label="Receita" value={d.kpis.receita} delta={d.kpis.deltaReceita} />
        <EFKpiCard label="Despesas" value={-d.kpis.despesas} delta={d.kpis.deltaDespesas} />
        <EFKpiCard label="Resultado" value={d.kpis.resultado} isResult={true} />
      </div>

      {/* Next Step */}
      <EFCard style={{ background: t.greenLite, borderColor: 'rgba(27,67,50,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: t.greenMid, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Próximo passo</div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: t.green }}>Você tem 2 lançamentos de ontem pendentes</div>
            <div style={{ fontSize: '13px', color: t.greenMid, marginTop: '3px' }}>Registre agora para manter o DRE atualizado</div>
          </div>
          <EFBtn v="outline" sz="sm" onClick={onLancar}
            icon={<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            style={{ borderColor: t.green, color: t.green }}>
            Registrar agora
          </EFBtn>
        </div>
      </EFCard>

      {/* Recent Entries */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ fontSize: '14px', fontWeight: 700, color: t.text }}>Lançamentos recentes</div>
          <EFBtn v="ghost" sz="sm" style={{ color: t.text3, fontSize: '12px' }}>Ver todos</EFBtn>
        </div>
        <EFCard p="0">
          {d.entries.map((e, i) => (
            <div key={e.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '9px', flexShrink: 0,
                  background: e.type === 'receita' ? t.posBg : t.negBg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px'
                }}>
                  {e.type === 'receita' ? '↑' : '↓'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600, color: t.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{e.desc}</div>
                  <div style={{ fontSize: '12px', color: t.text3, marginTop: '2px', display: 'flex', gap: '8px' }}>
                    <span>{e.cat}</span>
                    {e.origin === 'pessoal' && <EFBadge v="info">Pessoal</EFBadge>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: e.type === 'receita' ? t.pos : t.neg, fontVariantNumeric: 'tabular-nums' }}>
                    {e.type === 'receita' ? '+' : ''}{fmtR(e.val)}
                  </div>
                  <div style={{ fontSize: '12px', color: t.text3, marginTop: '2px' }}>{e.date}</div>
                </div>
              </div>
              {i < d.entries.length - 1 && <EFHr />}
            </div>
          ))}
        </EFCard>
      </div>
    </div>
  );
};

// ── ScreenLancamento (3 steps) ────────────────────────────────────────────────
const ScreenLancamento = ({ onClose, onSuccess }) => {
  const t = useTK();
  const [step, setStep] = React.useState(1);
  const [tipo, setTipo] = React.useState('custo');
  const [origem, setOrigem] = React.useState('empresa');
  const [valor, setValor] = React.useState('');
  const [desc, setDesc] = React.useState('');
  const [cat, setCat] = React.useState('');
  const [data, setData] = React.useState('19/05/2026');
  const [done, setDone] = React.useState(false);

  const cats = tipo === 'receita' ? EF_DATA.catsReceita : (origem === 'pessoal' ? ['Alimentação', 'Saúde', 'Transporte', 'Lazer', 'Pró-labore', 'Outros'] : EF_DATA.catsCusto);

  const handleConfirm = () => {
    setDone(true);
    setTimeout(() => { if (onSuccess) onSuccess(); }, 2200);
  };

  const StepDot = ({ n }) => (
    <div style={{
      width: n === step ? 20 : 8, height: 8, borderRadius: 100,
      background: n <= step ? t.green : t.border,
      transition: 'all .25s'
    }}></div>
  );

  if (done) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', padding: '48px 24px', textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: t.posBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>✓</div>
      <div>
        <div style={{ fontSize: '18px', fontWeight: 800, color: t.text }}>Registrado com sucesso!</div>
        <div style={{ fontSize: '14px', color: t.text2, marginTop: '6px' }}>{desc || 'Lançamento'} — {valor ? fmtR(parseFloat(valor.replace(',', '.'))) : '—'}</div>
      </div>
      <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
        <EFBtn v="secondary" sz="md" onClick={() => { setStep(1); setDone(false); setValor(''); setDesc(''); setCat(''); }}>Registrar outro</EFBtn>
        <EFBtn v="primary" sz="md" onClick={onClose}>Ver no Dashboard</EFBtn>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: `1px solid ${t.border}` }}>
        <div>
          <div style={{ fontSize: '16px', fontWeight: 800, color: t.text }}>Registrar lançamento</div>
          <div style={{ fontSize: '12px', color: t.text3, marginTop: '2px' }}>Passo {step} de 3</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
            <StepDot n={1} /><StepDot n={2} /><StepDot n={3} />
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.text3, fontSize: '18px', lineHeight: 1, padding: '4px', borderRadius: '6px' }}>✕</button>
        </div>
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: t.text2, marginBottom: '10px' }}>O que você quer registrar?</div>
            <EFSeg full opts={[{ v: 'custo', l: '↓ Custo' }, { v: 'receita', l: '↑ Receita' }]} val={tipo} onChange={setTipo} />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: t.text2, marginBottom: '10px' }}>Para qual contexto?</div>
            <EFSeg full opts={[{ v: 'empresa', l: '🏢 Empresa' }, { v: 'pessoal', l: '👤 Pessoal' }]} val={origem} onChange={setOrigem} />
          </div>
          <div style={{ background: t.subtle, borderRadius: '10px', padding: '14px 16px' }}>
            <div style={{ fontSize: '12px', color: t.text3 }}>
              {tipo === 'custo' && origem === 'empresa' && 'Custos operacionais, fornecedores, aluguel, funcionários…'}
              {tipo === 'custo' && origem === 'pessoal' && 'Gastos pessoais do sócio — separados das contas da empresa.'}
              {tipo === 'receita' && origem === 'empresa' && 'Vendas, serviços prestados, receitas operacionais…'}
              {tipo === 'receita' && origem === 'pessoal' && 'Receitas pessoais do sócio — pró-labore, dividendos…'}
            </div>
          </div>
          <EFBtn v="primary" sz="lg" full onClick={() => setStep(2)}
            icon={<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}>
            Continuar
          </EFBtn>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <EFInput label="Valor" big prefix="R$" val={valor} onChange={setValor} ph="0,00" autoFocus helper="Use ponto ou vírgula como decimal" />
          <EFInput label="Descrição" val={desc} onChange={setDesc} ph={tipo === 'receita' ? 'Ex: Venda balcão — manhã' : 'Ex: Fornecedor de farinhas'} />
          <EFSel label="Categoria" val={cat} onChange={setCat}
            opts={[{ v: '', l: 'Selecione…' }, ...cats.map(c => ({ v: c, l: c }))]} />
          <EFInput label="Data" val={data} onChange={setData} ph="dd/mm/aaaa" opt />
          <EFHr label="Opcional" />
          <EFInput label="Nota fiscal / número" val="" onChange={() => {}} ph="Ex: NF-e 001234" opt />
          <div style={{ display: 'flex', gap: '10px' }}>
            <EFBtn v="secondary" sz="lg" onClick={() => setStep(1)}>← Voltar</EFBtn>
            <EFBtn v="primary" sz="lg" full disabled={!valor || !desc} onClick={() => setStep(3)}>Continuar →</EFBtn>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && (
        <div style={{ padding: '28px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ fontSize: '13px', fontWeight: 600, color: t.text2 }}>Confira antes de registrar</div>
          <EFCard style={{ background: tipo === 'receita' ? t.posBg : t.negBg, borderColor: tipo === 'receita' ? '#BBF7D0' : '#FECACA' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <EFBadge v={tipo === 'receita' ? 'success' : 'error'}>{tipo === 'receita' ? '↑ Receita' : '↓ Custo'}</EFBadge>
                  <EFBadge v="default">{origem === 'empresa' ? 'Empresa' : 'Pessoal'}</EFBadge>
                </div>
                <div style={{ fontSize: '16px', fontWeight: 700, color: t.text }}>{desc}</div>
                <div style={{ fontSize: '13px', color: t.text2, marginTop: '4px' }}>{cat || 'Sem categoria'} · {data}</div>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: tipo === 'receita' ? t.pos : t.neg, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap', marginLeft: '12px' }}>
                {tipo === 'receita' ? '+' : '-'}R${valor}
              </div>
            </div>
          </EFCard>
          <div style={{ display: 'flex', gap: '10px' }}>
            <EFBtn v="secondary" sz="lg" onClick={() => setStep(2)}>← Voltar</EFBtn>
            <EFBtn v="primary" sz="lg" full onClick={handleConfirm}>Registrar agora</EFBtn>
          </div>
        </div>
      )}
    </div>
  );
};

// ── ScreenDRE ─────────────────────────────────────────────────────────────────
const ScreenDRE = () => {
  const t = useTK();
  const d = EF_DATA.dre;
  const margem = ((d.resultado / d.receitaBruta) * 100).toFixed(1);

  const Row = ({ label, value, isTotal, indent, sublabel }) => (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
      padding: isTotal ? '16px 20px' : '12px 20px',
      background: isTotal ? t.subtle : 'transparent',
      borderTop: isTotal ? `1px solid ${t.border}` : 'none',
    }}>
      <div>
        <div style={{ fontSize: isTotal ? '15px' : '14px', fontWeight: isTotal ? 800 : 500, color: isTotal ? t.text : t.text2, paddingLeft: indent ? '16px' : 0 }}>{label}</div>
        {sublabel && <div style={{ fontSize: '12px', color: t.text3, paddingLeft: indent ? '16px' : 0 }}>{sublabel}</div>}
      </div>
      <div style={{
        fontSize: isTotal ? '20px' : '15px', fontWeight: isTotal ? 800 : 600,
        color: value > 0 ? (isTotal ? t.pos : t.text) : t.neg,
        fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.01em'
      }}>
        {value > 0 ? '+' : ''}{fmtR(value)}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: t.text, letterSpacing: '-0.02em' }}>DRE Mensal</div>
          <div style={{ fontSize: '14px', color: t.text2, marginTop: '2px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <span>Maio 2026</span>
            <EFBadge v="primary">Simples Nacional</EFBadge>
          </div>
        </div>
      </div>

      <EFCard p="0" style={{ overflow: 'hidden' }}>
        <Row label="Receita Bruta" value={d.receitaBruta} />
        <EFHr />
        <Row label="(−) Deduções / Simples Nacional" value={d.deducoes} sublabel={`Alíquota estimada ${d.aliquota}%`} />
        <EFHr />
        <Row label="(−) Despesas totais" value={d.despesas} />
        <Row label="Despesas fixas" value={-22000} indent sublabel="Aluguel, folha, utilidades" />
        <Row label="Despesas variáveis" value={-9200} indent sublabel="Insumos, fornecedores" />
        <EFHr />
        <Row label="= Resultado do Período" value={d.resultado} isTotal />
        <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: '12px', color: t.text3 }}>Margem líquida estimada</div>
          <div style={{ fontSize: '14px', fontWeight: 700, color: t.pos }}>{margem}%</div>
        </div>
        <div style={{ height: '8px', background: t.subtle }}>
          <div style={{ height: '100%', width: `${margem}%`, background: t.pos, borderRadius: '0 4px 4px 0', transition: 'width .6s ease' }}></div>
        </div>
      </EFCard>

      <EFCard style={{ background: t.warnBg, borderColor: '#FDE68A' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠️</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: t.warn }}>Estimativa sujeita a validação</div>
            <div style={{ fontSize: '12px', color: t.warn, marginTop: '4px', opacity: 0.8 }}>Os valores de Simples Nacional são calculados automaticamente com base na alíquota configurada. Valide sempre com seu contador antes de usar para fins fiscais.</div>
          </div>
        </div>
      </EFCard>
    </div>
  );
};

// ── ScreenFechamento ──────────────────────────────────────────────────────────
const ScreenFechamento = () => {
  const t = useTK();
  const [status, setStatus] = React.useState('aberto');
  const mc = EF_DATA.monthClose;

  const statusMap = {
    aberto: { badge: 'default', label: 'Aberto', next: 'Em Revisão', action: 'Enviar para revisão', tip: `${mc.done} de ${mc.total} lançamentos registrados` },
    revisao: { badge: 'warning', label: 'Em Revisão', next: 'Fechado', action: 'Aprovar e fechar', tip: 'Aguardando aprovação do Dono' },
    fechado: { badge: 'success', label: 'Fechado', next: null, action: null, tip: 'Mês encerrado e aprovado' },
  };
  const s = statusMap[status];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: t.text, letterSpacing: '-0.02em' }}>Fechamento Mensal</div>
        <div style={{ fontSize: '14px', color: t.text2, marginTop: '2px' }}>Controle de status dos períodos</div>
      </div>

      {/* Current month */}
      <EFCard>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: t.text }}>Maio 2026</div>
            <div style={{ fontSize: '13px', color: t.text3, marginTop: '2px' }}>Prazo: {mc.due}</div>
          </div>
          <EFBadge v={s.badge} dot>{s.label}</EFBadge>
        </div>

        {status !== 'fechado' && (
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: t.text2 }}>{s.tip}</span>
              <span style={{ fontSize: '12px', fontWeight: 700, color: t.text }}>{mc.progress}%</span>
            </div>
            <div style={{ height: '6px', background: t.subtle, borderRadius: '100px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${mc.progress}%`, background: t.green, borderRadius: '100px', transition: 'width .6s ease' }}></div>
            </div>
          </div>
        )}

        {status === 'fechado' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 14px', background: t.posBg, borderRadius: '10px', marginBottom: '16px' }}>
            <span style={{ fontSize: '20px' }}>✓</span>
            <div style={{ fontSize: '14px', fontWeight: 600, color: t.pos }}>Maio 2026 fechado com sucesso</div>
          </div>
        )}

        {s.action && (
          <EFBtn v={status === 'revisao' ? 'primary' : 'secondary'} sz="lg" full
            onClick={() => setStatus(status === 'aberto' ? 'revisao' : 'fechado')}
            icon={status === 'revisao' ? <span>✓</span> : null}>
            {s.action} →
          </EFBtn>
        )}
      </EFCard>

      {/* History */}
      <div>
        <div style={{ fontSize: '14px', fontWeight: 700, color: t.text, marginBottom: '12px' }}>Histórico</div>
        <EFCard p="0">
          {EF_DATA.history.map((h, i) => (
            <div key={h.month}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: 32, height: 32, borderRadius: '8px', background: t.posBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', color: t.pos }}>✓</div>
                  <div>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: t.text }}>{h.month}</div>
                    <EFBadge v="success">Fechado</EFBadge>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: t.pos, fontVariantNumeric: 'tabular-nums' }}>+{fmtRShort(h.resultado)}</div>
                  <EFBtn v="ghost" sz="sm" style={{ color: t.text3, fontSize: '12px', padding: '3px 8px' }}>Ver →</EFBtn>
                </div>
              </div>
              {i < EF_DATA.history.length - 1 && <EFHr />}
            </div>
          ))}
        </EFCard>
      </div>
    </div>
  );
};

// ── ScreenImportar ────────────────────────────────────────────────────────────
const ScreenImportar = () => {
  const t = useTK();
  const [stage, setStage] = React.useState('upload'); // upload | preview | done
  const [drag, setDrag] = React.useState(false);
  const preview = EF_DATA.importPreview;
  const erros = preview.filter(p => !p.ok).length;
  const validas = preview.filter(p => p.ok).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: t.text, letterSpacing: '-0.02em' }}>Importar Planilha</div>
        <div style={{ fontSize: '14px', color: t.text2, marginTop: '2px' }}>Importe .xlsx ou .csv — máx. 5 MB</div>
      </div>

      {stage === 'upload' && (
        <div onMouseEnter={() => setDrag(true)} onMouseLeave={() => setDrag(false)}
          onClick={() => setStage('preview')}
          style={{
            border: `2px dashed ${drag ? t.green : t.border}`, borderRadius: '14px',
            padding: '48px 24px', textAlign: 'center', cursor: 'pointer',
            background: drag ? t.greenLite : t.subtle, transition: 'all .15s'
          }}>
          <div style={{ fontSize: '32px', marginBottom: '12px' }}>📄</div>
          <div style={{ fontSize: '15px', fontWeight: 700, color: t.text, marginBottom: '6px' }}>Arraste o arquivo aqui</div>
          <div style={{ fontSize: '13px', color: t.text3, marginBottom: '16px' }}>ou clique para selecionar</div>
          <EFBadge v="default">.xlsx · .csv · máx. 5 MB</EFBadge>
        </div>
      )}

      {stage === 'preview' && (
        <>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <EFBadge v="success">{validas} linhas válidas</EFBadge>
            {erros > 0 && <EFBadge v="error">{erros} erro{erros > 1 ? 's' : ''}</EFBadge>}
          </div>
          <EFCard p="0">
            {preview.map((row, i) => (
              <div key={row.line}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px' }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: '7px', flexShrink: 0,
                    background: row.ok ? t.posBg : t.negBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '13px', color: row.ok ? t.pos : t.neg,
                  }}>{row.ok ? '✓' : '✕'}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '13px', color: row.ok ? t.text : t.neg, fontWeight: row.ok ? 400 : 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.desc}</div>
                    {row.err && <div style={{ fontSize: '11px', color: t.neg, marginTop: '2px' }}>{row.err}</div>}
                  </div>
                  <div style={{ fontSize: '11px', color: t.text3, flexShrink: 0 }}>L{row.line}</div>
                </div>
                {i < preview.length - 1 && <EFHr />}
              </div>
            ))}
          </EFCard>
          <div style={{ display: 'flex', gap: '10px' }}>
            <EFBtn v="secondary" sz="lg" onClick={() => setStage('upload')}>Cancelar</EFBtn>
            <EFBtn v="primary" sz="lg" full onClick={() => setStage('done')}>Importar {validas} linhas válidas →</EFBtn>
          </div>
        </>
      )}

      {stage === 'done' && (
        <EFCard style={{ textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ fontSize: '36px', marginBottom: '12px' }}>✓</div>
          <div style={{ fontSize: '18px', fontWeight: 800, color: t.text, marginBottom: '6px' }}>{validas} lançamentos importados!</div>
          <div style={{ fontSize: '14px', color: t.text3, marginBottom: '24px' }}>{erros > 0 ? `${erros} linha${erros > 1 ? 's foram ignoradas' : ' foi ignorada'} por erros.` : 'Todos os lançamentos foram importados.'}</div>
          <EFBtn v="primary" sz="lg" onClick={() => setStage('upload')}>Nova importação</EFBtn>
        </EFCard>
      )}
    </div>
  );
};

// ── ScreenEmpresas ────────────────────────────────────────────────────────────
const ScreenEmpresas = ({ company, onSwitch }) => {
  const t = useTK();
  const companies = EF_DATA.companies;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <div style={{ fontSize: '22px', fontWeight: 800, color: t.text, letterSpacing: '-0.02em' }}>Minhas Empresas</div>
        <div style={{ fontSize: '14px', color: t.text2, marginTop: '2px' }}>Troque de empresa a qualquer momento</div>
      </div>

      <EFCard p="0">
        {companies.map((c, i) => {
          const active = (company || companies[0]).id === c.id;
          return (
            <div key={c.id}>
              <div onClick={() => onSwitch(c)}
                style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px', cursor: 'pointer', background: active ? t.greenLite : 'transparent', transition: 'background .15s', borderRadius: i === 0 ? '12px 12px 0 0' : i === companies.length - 1 ? '0 0 12px 12px' : 0 }}>
                <div style={{ width: 44, height: 44, borderRadius: '12px', background: active ? t.green : t.subtle, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', fontWeight: 800, color: active ? '#fff' : t.text2, flexShrink: 0 }}>
                  {c.name.charAt(0)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: active ? t.green : t.text }}>{c.name}</div>
                  <div style={{ fontSize: '12px', color: t.text3, marginTop: '3px' }}>
                    {c.type}{c.regime ? ` · ${c.regime}` : ''}{c.cnpj ? ` · ${c.cnpj}` : ''}
                  </div>
                </div>
                <div>
                  {active ? (
                    <EFBadge v="primary" dot>Ativa</EFBadge>
                  ) : (
                    <EFBtn v="secondary" sz="sm" onClick={() => onSwitch(c)}>Usar</EFBtn>
                  )}
                </div>
              </div>
              {i < companies.length - 1 && <EFHr />}
            </div>
          );
        })}
      </EFCard>

      <EFBtn v="secondary" sz="lg" full
        icon={<svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>}>
        Adicionar empresa
      </EFBtn>

      <EFCard style={{ background: t.infoBg, borderColor: '#BFDBFE' }}>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ fontSize: '16px', flexShrink: 0 }}>ℹ️</span>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: t.info }}>Multiempresa no MVP</div>
            <div style={{ fontSize: '12px', color: t.info, marginTop: '4px', opacity: 0.85 }}>Todos os dados são isolados por empresa. Ao trocar, o dashboard e DRE refletem a empresa selecionada.</div>
          </div>
        </div>
      </EFCard>
    </div>
  );
};

Object.assign(window, {
  EF_DATA,
  ScreenDashboard,
  ScreenLancamento,
  ScreenDRE,
  ScreenFechamento,
  ScreenImportar,
  ScreenEmpresas,
});
