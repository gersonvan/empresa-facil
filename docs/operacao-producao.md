# Operacao de producao

## Arquitetura ativa

```text
Usuario
  -> empresafacil.gersonvan.com.br (Vercel)
  -> empresafacil-api.onrender.com (Render)
  -> Supabase PostgreSQL (Sao Paulo)
```

## Verificacoes de rotina

```bash
curl -fsS https://empresafacil.gersonvan.com.br
curl -fsS https://empresafacil-api.onrender.com/health
curl -fsS https://empresafacil-api.onrender.com/ready
```

Resultados esperados:

- O dominio retorna o HTML do frontend servido pela Vercel.
- `/health` retorna `status: ok`.
- `/ready` confirma acesso da API ao banco.

## Deploy

1. Envie a alteracao revisada para o branch `main`.
2. Confirme o deploy automatico no Render e na Vercel.
3. Verifique os tres endpoints acima.

O Render esta no plano Free. A primeira requisicao apos inatividade pode levar mais tempo devido a hibernacao do servico.

## Autenticacao

Antes de habilitar um metodo de entrada, configure suas credenciais no servico `empresafacil-api` do Render. O login consulta `GET /auth/providers` e exibe somente os metodos que a API declarou disponiveis.

### Google OAuth

No cliente OAuth **EmpresaFacil** do Google Cloud, mantenha estes URIs:

- Origem JavaScript: `https://empresafacil.gersonvan.com.br`
- Redirecionamento autorizado: `https://empresafacil-api.onrender.com/auth/google/callback`

No Render, defina `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET`. Nunca registre o segredo em arquivos, commits ou variaveis de frontend.

### Link por e-mail

No Render, defina `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` e `SMTP_FROM`. Sem SMTP, a API responde que o envio esta indisponivel e nao cria um token de acesso. O link enviado aponta para a API, que valida o token e redireciona para o frontend autenticado.

## Operacao de importacoes

1. Escolha um perfil OFX nativo ou configure um perfil CSV da empresa ativa.
2. Revise a previa e importe os itens desejados; cada item fica pendente de revisao.
3. Em **Revisar importados**, aprove operacoes normais ou marque somente transferencias internas confirmadas. A segunda decisao exclui o item da DRE e registra o historico.

Perfis, memoria de categorizacao e decisoes de revisao sao sincronizados pelo mesmo event store dos demais dados financeiros. A deteccao de transferencia e apenas um alerta: nunca exclui um lancamento automaticamente.

## Incidente e reversao

Nao exclua recursos no GCP sem uma decisao explicita de descarte. O ambiente anterior permanece como alternativa de retorno:

- Cloud SQL `empresafacil-pg`: parada por `activation-policy=never`.
- Cloud Run `empresafacil-api`: sem permissao publica `allUsers`.
- Bucket `gs://empresafacil.gersonvan.com.br`: sem leitura publica `allUsers`.

Para uma reversao controlada:

1. Restaure o banco e o acesso aos servicos antigos no GCP.
2. Valide o ambiente antigo por URL direta antes de mexer no DNS.
3. Somente entao repointe o registro DNS do subdominio.

## Limites conhecidos

- OAuth Google/Microsoft, SMTP e Stripe exigem configuracao de credenciais externas antes de uso em producao.
- O banco Supabase Free e o Render Free possuem limites operacionais e nao devem ser tratados como configuracao de alta disponibilidade.
- Segredos ficam apenas nos paineis de Vercel, Render e Supabase; nunca devem ser adicionados a arquivos versionados.
