import nodemailer from 'nodemailer'

class EmailService {
  constructor({ config }) {
    this.config = config
    this.transporter = config.smtpHost
      ? nodemailer.createTransport({
          host: config.smtpHost,
          port: config.smtpPort,
          secure: config.smtpPort === 465,
          auth: config.smtpUser
            ? { user: config.smtpUser, pass: config.smtpPass }
            : undefined,
        })
      : null
  }

  async sendMagicLink({ to, token, purpose, frontendUrl }) {
    const url = `${frontendUrl}/auth/magic-link/verify?token=${token}`
    const isInvite = purpose === 'invite'

    const subject = isInvite
      ? 'Você foi convidado para o EmpresaFácil'
      : 'Seu link de acesso ao EmpresaFácil'

    const callToAction = isInvite ? 'Aceitar convite' : 'Entrar agora'
    const intro = isInvite
      ? 'Você foi convidado para acessar o EmpresaFácil.'
      : 'Clique no link abaixo para entrar no EmpresaFácil.'

    const html = `
      <!DOCTYPE html>
      <html>
        <body style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 16px;color:#1f2937">
          <h2 style="margin-bottom:8px">EmpresaFácil</h2>
          <p>${intro}</p>
          <p style="margin:24px 0">
            <a href="${url}"
               style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;
                      text-decoration:none;display:inline-block;font-weight:600">
              ${callToAction}
            </a>
          </p>
          <p style="font-size:13px;color:#6b7280">
            Este link expira em 15 minutos.<br>
            Se você não solicitou este email, pode ignorá-lo com segurança.
          </p>
          <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0">
          <p style="font-size:12px;color:#9ca3af">
            Ou copie e cole o link no seu navegador:<br>
            <span style="word-break:break-all">${url}</span>
          </p>
        </body>
      </html>
    `

    if (!this.transporter) {
      console.log(`[EmailService] Magic link para ${to}:\n  ${url}`)
      return
    }

    await this.transporter.sendMail({
      from: this.config.smtpFrom,
      to,
      subject,
      html,
    })
  }
}

export { EmailService }
