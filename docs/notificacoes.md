# Notificacoes

## Canais suportados

| Canal | Provedor | Biblioteca cliente | Versao | Evidencia |
|---|---|---|---|---|
| E-mail | SMTP configuravel | nodemailer | 8.0.10 | `server/package.json:19`; `server/package-lock.json:962-964`; `server/src/emailService.js:1-90` |

## Modelos de mensagem

| Template | Canal | Proposito | Localizacao | Evidencia |
|---|---|---|---|---|
| Magic link | E-mail | Autenticacao por link | Gerado em codigo | `server/src/emailService.js:66-90`; `server/src/routes/auth.js:64-81` |
| Convite de membro | E-mail | Convidar usuario para empresa | Gerado em codigo | `server/src/routes/members.js:49-94` |

## Gatilhos de envio

| Gatilho | Origem | Template | Destinatario | Evidencia |
|---|---|---|---|---|
| Solicitar magic link | `/auth/magic-link/request` | Magic link | E-mail informado | `server/src/routes/auth.js:64-81` |
| Convidar membro | `/api/companies/:companyId/members/invite` | Convite | E-mail convidado | `server/src/routes/members.js:47-94` |

## Rastreamento de entrega

`// CARENCIA: nao identificado no codigo`. O envio usa `sendMail` (`server/src/emailService.js:90`), mas nao foi identificado webhook de entrega, status persistido ou historico local de tentativas.

## Tratamento de falha de envio

| Falha | Resposta | Persistencia do registro | Evidencia |
|---|---|---|---|
| SMTP/transporte | Propagacao de erro para handler da rota/servidor | `// CARENCIA` | `server/src/emailService.js:90`; `server/src/app.js:66-76` |

## Preferencias do destinatario

`// CARENCIA: nao identificado no codigo`. Nao foram identificados opt-in/opt-out, frequencia maxima ou horario de silencio.
