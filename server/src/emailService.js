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

    const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 16px">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:12px;border:1px solid #e5e7eb;overflow:hidden">

        <!-- Header -->
        <tr><td style="background:#4f46e5;padding:24px 32px">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#ffffff22;border-radius:8px;width:36px;height:36px;text-align:center;vertical-align:middle;font-size:14px;font-weight:800;color:#ffffff;letter-spacing:-0.5px">EF</td>
              <td style="padding-left:10px;color:#ffffff;font-size:17px;font-weight:700;letter-spacing:-0.3px">EmpresaFácil</td>
            </tr>
          </table>
        </td></tr>

        <!-- Body -->
        <tr><td style="padding:32px 32px 24px">
          <p style="margin:0 0 8px;font-size:22px;font-weight:700;color:#111827;letter-spacing:-0.5px">
            ${isInvite ? 'Você foi convidado!' : 'Seu link de acesso'}
          </p>
          <p style="margin:0 0 28px;font-size:15px;color:#6b7280;line-height:1.6">${intro}</p>

          <table cellpadding="0" cellspacing="0">
            <tr><td style="border-radius:8px;background:#4f46e5">
              <a href="${url}" style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;letter-spacing:-0.2px">
                ${callToAction} →
              </a>
            </td></tr>
          </table>

          <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;line-height:1.6">
            Este link expira em <strong style="color:#6b7280">15 minutos</strong> e só pode ser usado uma vez.<br>
            Se você não solicitou este email, pode ignorá-lo com segurança.
          </p>
        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:16px 32px 28px;border-top:1px solid #f3f4f6">
          <p style="margin:0 0 6px;font-size:11px;color:#d1d5db;text-transform:uppercase;letter-spacing:0.08em">Link alternativo</p>
          <p style="margin:0;font-size:11px;color:#9ca3af;word-break:break-all;line-height:1.5">${url}</p>
        </td></tr>

      </table>
      <p style="margin:16px 0 0;font-size:11px;color:#9ca3af;text-align:center">
        © ${new Date().getFullYear()} EmpresaFácil · <a href="https://empresafacil.gersonvan.com.br/privacidade" style="color:#9ca3af">Privacidade</a>
      </p>
    </td></tr>
  </table>
</body>
</html>`

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
