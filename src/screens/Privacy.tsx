import { Link } from 'react-router-dom'
import styles from './Legal.module.css'

export default function Privacy() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link to="/login" className={styles.back}>← Voltar ao login</Link>

        <h1 className={styles.title}>Política de Privacidade</h1>
        <p className={styles.updated}>Última atualização: junho de 2025</p>

        <section className={styles.section}>
          <h2>1. Quem somos</h2>
          <p>EmpresaFácil é um serviço de controle financeiro para MEIs e microempresas brasileiras, disponível em <strong>empresafacil.gersonvan.com.br</strong>.</p>
        </section>

        <section className={styles.section}>
          <h2>2. Dados que coletamos</h2>
          <ul>
            <li><strong>Dados de cadastro:</strong> nome e endereço de e-mail, fornecidos no login.</li>
            <li><strong>Dados financeiros:</strong> receitas, despesas e lançamentos inseridos por você.</li>
            <li><strong>Dados de uso:</strong> logs de acesso e eventos de sincronização.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>3. Como usamos seus dados</h2>
          <ul>
            <li>Autenticar sua conta e enviar links de acesso.</li>
            <li>Armazenar e sincronizar seus dados financeiros entre dispositivos.</li>
            <li>Processar pagamentos de assinatura via Stripe.</li>
            <li>Melhorar a plataforma com base em logs agregados.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>4. Compartilhamento de dados</h2>
          <p>Não vendemos seus dados. Compartilhamos apenas com prestadores de serviço essenciais:</p>
          <ul>
            <li><strong>Google Cloud Platform</strong> — hospedagem e banco de dados.</li>
            <li><strong>Resend</strong> — envio de e-mails transacionais.</li>
            <li><strong>Stripe</strong> — processamento de pagamentos.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>5. Seus direitos (LGPD)</h2>
          <p>Conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:</p>
          <ul>
            <li>Acessar os dados que temos sobre você.</li>
            <li>Corrigir dados incompletos ou desatualizados.</li>
            <li>Solicitar a exclusão dos seus dados.</li>
            <li>Revogar o consentimento a qualquer momento.</li>
          </ul>
          <p>Para exercer seus direitos, entre em contato: <a href="mailto:contato@gersonvan.com.br">contato@gersonvan.com.br</a></p>
        </section>

        <section className={styles.section}>
          <h2>6. Retenção de dados</h2>
          <p>Seus dados são mantidos enquanto sua conta estiver ativa. Após solicitação de exclusão, removemos os dados em até 30 dias.</p>
        </section>

        <section className={styles.section}>
          <h2>7. Segurança</h2>
          <p>Utilizamos HTTPS em todas as comunicações, autenticação por token JWT e armazenamento seguro em banco de dados criptografado na Google Cloud.</p>
        </section>

        <section className={styles.section}>
          <h2>8. Contato</h2>
          <p>Dúvidas sobre esta política: <a href="mailto:contato@gersonvan.com.br">contato@gersonvan.com.br</a></p>
        </section>
      </div>
    </div>
  )
}
