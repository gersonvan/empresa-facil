import ScreenContainer from '../components/ScreenContainer'
import { Card } from '../components/ui'
import styles from './Training.module.css'

const steps = [
  {
    title: '1. Painel inicial (Dashboard)',
    image: '/training/01-dashboard.png',
    bullets: [
      'Veja os três indicadores principais: Receita, Despesas e Resultado.',
      'Use o botão Registrar lançamento para iniciar rápido.',
      'Confira o bloco Próximo passo do dia para decidir a ação seguinte.',
    ],
  },
  {
    title: '2. Cadastro em 3 passos (Lançar)',
    image: '/training/02-lancar.png',
    bullets: [
      'Passo 1: escolha Empresa ou Pessoal.',
      'Passo 2: preencha Descrição e Valor (obrigatórios).',
      'Ative "Repetir mensalmente" para despesas fixas — o sistema sugere o lançamento todo mês.',
      'Passo 3: confirme e salve.',
    ],
  },
  {
    title: '3. Leitura do DRE do mês',
    image: '/training/03-dre.png',
    bullets: [
      'Revise Receita, Deduções, Despesas e Resultado operacional.',
      'Use composição de custos para entender o peso de cada grupo.',
      'Resultado positivo indica operação saudável no período.',
    ],
  },
  {
    title: '4. Revisão e fechamento do mês',
    image: '/training/04-fechamento-mes.png',
    bullets: [
      'Fluxo: Aberto -> Em revisão -> Fechado.',
      'Fechamento bloqueia alterações acidentais no mês.',
      'Suporte fiscal e auxiliar: sempre validar com contador.',
    ],
  },
  {
    title: '5. Projeção de Fluxo de Caixa (novo)',
    bullets: [
      'Use os filtros de horizonte (3, 6 e 12 meses) para prever o comprometimento futuro.',
      'Cadastre contas fixas e parcelamentos na mesma tela da projeção.',
      'Acompanhe pico de comprometimento e totais por mês em fixas e parceladas.',
    ],
  },
  {
    title: '6. Gestão de compromissos e rastreabilidade',
    bullets: [
      'Edite compromissos existentes e avance parcelas com um clique.',
      'Meses fechados bloqueiam edição, remoção e avanço para preservar controle.',
      'Consulte o histórico de alterações para auditar o que foi alterado e quando.',
    ],
  },
  {
    title: '7. Revisão de deduções previstas (novo)',
    bullets: [
      'Acesse Deduções para filtrar por mês, status e faixa aplicada.',
      'Aprove, rejeite ou edite o valor das deduções sugeridas automaticamente.',
      'Sempre trate os valores como apoio operacional e valide com contador.',
    ],
  },
  {
    title: '8. Reconciliação mensal previsto vs real',
    bullets: [
      'Na Revisão do Mês, informe o total real de deduções apuradas.',
      'Compare a diferença real menos previsto antes de gerar ajuste.',
      'Gere o ajuste de reconciliação para fechar o mês com rastreabilidade.',
    ],
  },
  {
    title: '9. Importação de extrato bancário (OFX)',
    bullets: [
      'Baixe o arquivo .ofx no internet banking do seu banco (Itaú, Bradesco, Santander, BB, Caixa, Nubank, Inter e outros).',
      'Clique em "Importar" na barra de navegação, arraste o arquivo ou selecione pelo botão.',
      'Revise a prévia: edite descrições, escolha Empresa ou Pessoal por linha e veja a categoria sugerida automaticamente.',
      'Duplicatas (mesmo valor + descrição já existente) são detectadas e ignoradas automaticamente.',
      'Todos os lançamentos importados ficam marcados para revisão — confirme as categorias antes de fechar o mês.',
    ],
  },
  {
    title: '10. Categorização automática por regras',
    bullets: [
      'Ao importar um OFX, o sistema sugere a categoria com base em palavras-chave da descrição bancária.',
      'Exemplos: "DAS SIMPLES" → Impostos e taxas; "AWS" → Software e tecnologia; "META ADS" → Marketing.',
      'Funciona sem internet e sem custo — processado direto no navegador.',
      'Se a sugestão não for adequada, ajuste a categoria manualmente nos Registros antes de fechar o mês.',
    ],
  },
]

export default function Training() {
  return (
    <ScreenContainer title="Treinamento">
      <Card className={styles.intro}>
        <h2 className={styles.sectionTitle}>Como usar o sistema (iniciante)</h2>
        <p className={styles.copy}>
          Este treinamento foi pensado para quem nunca usou controle financeiro.
          Siga os blocos abaixo na ordem, incluindo a etapa de revisão de deduções previstas.
        </p>
      </Card>

      <div className={styles.grid}>
        {steps.map((step) => (
          <Card key={step.title} className={styles.stepCard}>
            <h3 className={styles.stepTitle}>{step.title}</h3>
            {step.image ? <img className={styles.image} src={step.image} alt={step.title} loading="lazy" /> : null}
            <ul className={styles.list}>
              {step.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card className={styles.checklist}>
        <h2 className={styles.sectionTitle}>Checklist rápido de aprendizado</h2>
        <ul className={styles.list}>
          <li>Conseguiu cadastrar 1 lançamento de Empresa.</li>
          <li>Conseguiu cadastrar 1 lançamento de Pessoal.</li>
          <li>Ativou "Repetir mensalmente" em uma despesa fixa recorrente.</li>
          <li>Conseguiu registrar 1 dedução separada de despesa.</li>
          <li>Conseguiu interpretar o Resultado no DRE.</li>
          <li>Entendeu o fechamento mensal e o bloqueio de período fechado.</li>
          <li>Conseguiu cadastrar 1 conta fixa e 1 parcelamento na projeção.</li>
          <li>Conseguiu editar um compromisso e consultar o histórico de alterações.</li>
          <li>Conseguiu revisar 1 dedução prevista e alterar seu status.</li>
          <li>Conseguiu executar reconciliação mensal de deduções com ajuste.</li>
          <li>Importou um extrato OFX do banco e revisou as transações na prévia.</li>
          <li>Verificou as categorias sugeridas automaticamente e ajustou as incorretas.</li>
        </ul>
      </Card>
    </ScreenContainer>
  )
}
