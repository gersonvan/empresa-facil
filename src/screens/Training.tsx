import ScreenContainer from '../components/ScreenContainer'
import { Card } from '../components/ui'
import styles from './Training.module.css'

const steps = [
  {
    title: '1. Painel inicial (Dashboard)',
    image: '/training/01-dashboard.png',
    bullets: [
      'Veja os tres indicadores principais: Receita, Despesas e Resultado.',
      'Use o botao Registrar lancamento para iniciar rapido.',
      'Confira o bloco Proximo passo do dia para decidir a acao seguinte.',
    ],
  },
  {
    title: '2. Cadastro em 3 passos (Lancar)',
    image: '/training/02-lancar.png',
    bullets: [
      'Passo 1: escolha Empresa ou Pessoal.',
      'Passo 2: preencha Descricao e Valor (obrigatorios).',
      'Passo 3: confirme e salve.',
    ],
  },
  {
    title: '3. Leitura do DRE do mes',
    image: '/training/03-dre.png',
    bullets: [
      'Revise Receita, Deducoes, Despesas e Resultado operacional.',
      'Use composicao de custos para entender peso de cada grupo.',
      'Resultado positivo indica operacao saudavel no periodo.',
    ],
  },
  {
    title: '4. Revisao e fechamento do mes',
    image: '/training/04-fechamento-mes.png',
    bullets: [
      'Fluxo: Aberto -> Em revisao -> Fechado.',
      'Fechamento bloqueia alteracoes acidentais no mes.',
      'Suporte fiscal e auxiliar: sempre validar com contador.',
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
          Siga os 4 blocos abaixo na ordem.
        </p>
      </Card>

      <div className={styles.grid}>
        {steps.map((step) => (
          <Card key={step.title} className={styles.stepCard}>
            <h3 className={styles.stepTitle}>{step.title}</h3>
            <img className={styles.image} src={step.image} alt={step.title} loading="lazy" />
            <ul className={styles.list}>
              {step.bullets.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <Card className={styles.checklist}>
        <h2 className={styles.sectionTitle}>Checklist rapido de aprendizado</h2>
        <ul className={styles.list}>
          <li>Conseguiu cadastrar 1 lancamento de Empresa.</li>
          <li>Conseguiu cadastrar 1 lancamento de Pessoal.</li>
          <li>Conseguiu interpretar o Resultado no DRE.</li>
          <li>Entendeu o fechamento mensal e o bloqueio de periodo fechado.</li>
        </ul>
      </Card>
    </ScreenContainer>
  )
}
