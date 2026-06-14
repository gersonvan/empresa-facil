import { Link } from 'react-router-dom'
import styles from './Legal.module.css'

export default function Terms() {
  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <Link to="/login" className={styles.back}>← Voltar ao login</Link>

        <h1 className={styles.title}>Termos de Uso</h1>
        <p className={styles.updated}>Última atualização: junho de 2025</p>

        <section className={styles.section}>
          <h2>1. Aceitação</h2>
          <p>Ao criar uma conta ou usar o EmpresaFácil, você concorda com estes Termos de Uso. Se não concordar, não utilize o serviço.</p>
        </section>

        <section className={styles.section}>
          <h2>2. O serviço</h2>
          <p>EmpresaFácil oferece ferramentas de controle financeiro para MEIs e microempresas. O serviço é fornecido "como está", podendo ser modificado ou descontinuado com aviso prévio de 30 dias.</p>
        </section>

        <section className={styles.section}>
          <h2>3. Sua conta</h2>
          <ul>
            <li>Você é responsável por manter a segurança do seu acesso.</li>
            <li>Não compartilhe seus links de acesso com terceiros.</li>
            <li>Uma conta corresponde a uma pessoa física ou jurídica.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>4. Uso aceitável</h2>
          <p>É proibido usar o EmpresaFácil para:</p>
          <ul>
            <li>Registrar dados falsos ou fraudulentos.</li>
            <li>Tentar acessar dados de outras empresas.</li>
            <li>Realizar engenharia reversa ou ataques ao sistema.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>5. Planos e pagamentos</h2>
          <ul>
            <li>O plano Free é gratuito e pode ter limitações de funcionalidades.</li>
            <li>Planos pagos são cobrados mensalmente via Stripe.</li>
            <li>O cancelamento encerra a cobrança no próximo ciclo; os dados permanecem acessíveis até o fim do período pago.</li>
            <li>Não há reembolso proporcional por cancelamentos antecipados.</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>6. Seus dados</h2>
          <p>Você é o proprietário dos dados financeiros que insere no EmpresaFácil. Não reivindicamos nenhum direito sobre eles. Consulte nossa <Link to="/privacidade">Política de Privacidade</Link> para detalhes sobre armazenamento e proteção.</p>
        </section>

        <section className={styles.section}>
          <h2>7. Limitação de responsabilidade</h2>
          <p>O EmpresaFácil não se responsabiliza por decisões financeiras tomadas com base nas informações exibidas, nem por perdas decorrentes de falhas temporárias do serviço.</p>
        </section>

        <section className={styles.section}>
          <h2>8. Alterações</h2>
          <p>Podemos atualizar estes termos. Notificaremos por e-mail com 15 dias de antecedência em caso de mudanças materiais.</p>
        </section>

        <section className={styles.section}>
          <h2>9. Contato</h2>
          <p>Dúvidas: <a href="mailto:contato@gersonvan.com.br">contato@gersonvan.com.br</a></p>
        </section>
      </div>
    </div>
  )
}
