#!/usr/bin/env node

const fs = require('fs');
const https = require('https');
const path = require('path');
const { spawnSync } = require('child_process');

const PACKAGE_ROOT = path.resolve(__dirname, '..');
const PROJECT_ROOT = path.resolve(PACKAGE_ROOT, '..', '..');
const DOCS_ROOT = path.join(PROJECT_ROOT, 'docs');
const CONVERT_SCRIPT = path.join(__dirname, 'convert-md-to-adf.js');

const DEFAULT_PARENT_ID = '25526438';
const DEFAULT_SPACE_KEY = 'EmpresaFac1';
const DEFAULT_SITE_BASE_URL = 'https://gersonvan.atlassian.net/wiki';

const DOCS = [
  ['README', path.join(PROJECT_ROOT, 'README.md')],
  ['01 - Visao geral', path.join(DOCS_ROOT, '01-visao-geral.md')],
  ['02 - Arquitetura', path.join(DOCS_ROOT, '02-arquitetura.md')],
  ['03 - Stack e dependencias', path.join(DOCS_ROOT, '03-stack-e-dependencias.md')],
  ['04 - Estrutura do projeto', path.join(DOCS_ROOT, '04-estrutura-do-projeto.md')],
  ['05 - Modelo de dominio', path.join(DOCS_ROOT, '05-modelo-de-dominio.md')],
  ['06 - Fluxos de negocio', path.join(DOCS_ROOT, '06-fluxos-de-negocio.md')],
  ['07 - Interface externa', path.join(DOCS_ROOT, '07-interface-externa.md')],
  ['08 - Frontend', path.join(DOCS_ROOT, '08-frontend.md')],
  ['09 - Backend', path.join(DOCS_ROOT, '09-backend.md')],
  ['10 - Configuracao e ambientes', path.join(DOCS_ROOT, '10-configuracao-e-ambientes.md')],
  ['11 - Infraestrutura e deployment', path.join(DOCS_ROOT, '11-infraestrutura-e-deployment.md')],
  ['Condicional - Banco de dados', path.join(DOCS_ROOT, 'banco-de-dados.md')],
  ['Condicional - Autenticacao e autorizacao', path.join(DOCS_ROOT, 'auth.md')],
  ['Condicional - Integracoes externas', path.join(DOCS_ROOT, 'integracoes-externas.md')],
  ['Condicional - Notificacoes', path.join(DOCS_ROOT, 'notificacoes.md')],
  ['Condicional - Multi-tenancy', path.join(DOCS_ROOT, 'multi-tenancy.md')],
  ['Relatorio QA PADTec', path.join(DOCS_ROOT, 'padtec-qa-report.md')],
];

function parseArgs() {
  const parsed = {
    parentId: process.env.CONFLUENCE_PARENT_ID || DEFAULT_PARENT_ID,
    spaceKey: process.env.CONFLUENCE_SPACE_KEY || DEFAULT_SPACE_KEY,
    dryRun: false,
  };
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--parent-id') parsed.parentId = args[++i];
    else if (arg === '--space-id') parsed.spaceId = args[++i];
    else if (arg === '--space-key') parsed.spaceKey = args[++i];
    else if (arg === '--dry-run') parsed.dryRun = true;
    else if (arg === '--site-base-url') parsed.siteBaseUrl = args[++i];
  }
  return parsed;
}

function loadConfig() {
  const configPath = path.join(PACKAGE_ROOT, 'config.js');
  const fileConfig = fs.existsSync(configPath) ? require(configPath) : {};
  const email = process.env.ATLASSIAN_EMAIL || process.env.CONFLUENCE_EMAIL || fileConfig.email;
  const token =
    process.env.ATLASSIAN_API_TOKEN ||
    process.env.ATLASSIAN_TOKEN ||
    process.env.CONFLUENCE_API_TOKEN ||
    process.env.CONFLUENCE_TOKEN ||
    fileConfig.token;
  const cloudId = process.env.CONFLUENCE_CLOUD_ID || fileConfig.cloudId;
  const spaceId = process.env.CONFLUENCE_SPACE_ID || fileConfig.spaceId;
  const siteBaseUrl = process.env.CONFLUENCE_SITE_BASE_URL || fileConfig.siteBaseUrl || DEFAULT_SITE_BASE_URL;

  return {
    email,
    token,
    cloudId,
    spaceId,
    siteBaseUrl,
    options: fileConfig.options || {},
  };
}

function assertConfig(config, args) {
  const missing = [];
  if (!config.email || config.email === 'seu-email@dominio.com') missing.push('ATLASSIAN_EMAIL ou CONFLUENCE_EMAIL');
  if (!config.token || config.token === 'SEU_TOKEN_AQUI') missing.push('ATLASSIAN_API_TOKEN ou CONFLUENCE_API_TOKEN');
  if (missing.length) {
    throw new Error(`Credenciais/configuracoes ausentes: ${missing.join(', ')}`);
  }
}

function request(config, method, apiPath, body = null) {
  const auth = Buffer.from(`${config.email}:${config.token}`).toString('base64');
  const payload = body ? JSON.stringify(body) : null;
  const directSite = !config.cloudId || config.cloudId === 'SEU_CLOUD_ID_AQUI';
  const site = new URL(config.siteBaseUrl || DEFAULT_SITE_BASE_URL);
  const options = {
    hostname: directSite ? site.hostname : 'api.atlassian.com',
    path: directSite ? `${site.pathname.replace(/\/$/, '')}/api/v2${apiPath}` : `/ex/confluence/${config.cloudId}/wiki/api/v2${apiPath}`,
    method,
    headers: {
      Authorization: `Basic ${auth}`,
      Accept: 'application/json',
    },
  };
  if (payload) {
    options.headers['Content-Type'] = 'application/json';
    options.headers['Content-Length'] = Buffer.byteLength(payload);
  }

  const timeout = config.options.httpTimeout || 180000;
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        const parsed = data ? safeJson(data) : null;
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ statusCode: res.statusCode, data: parsed, raw: data });
          return;
        }
        reject(new Error(`HTTP ${res.statusCode} ${method} ${apiPath}: ${data}`));
      });
    });
    req.setTimeout(timeout, () => {
      req.destroy(new Error(`Timeout ${method} ${apiPath}`));
    });
    req.on('error', reject);
    if (payload) req.write(payload);
    req.end();
  });
}

function safeJson(data) {
  try {
    return JSON.parse(data);
  } catch (_error) {
    return data;
  }
}

function convertToAdf(markdownPath) {
  const result = spawnSync(process.execPath, [CONVERT_SCRIPT, markdownPath], {
    cwd: PACKAGE_ROOT,
    encoding: 'utf8',
  });
  if (result.status !== 0) {
    throw new Error(`Falha convertendo ${markdownPath}: ${result.stderr || result.stdout}`);
  }
  const adfPath = markdownPath.replace(/\.md$/, '.adf.json');
  if (!fs.existsSync(adfPath)) {
    throw new Error(`ADF nao gerado para ${markdownPath}`);
  }
  return JSON.parse(fs.readFileSync(adfPath, 'utf8'));
}

async function getSpaceId(config, args) {
  if (args.spaceId) return args.spaceId;
  if (config.spaceId && config.spaceId !== 'SEU_SPACE_ID_AQUI') return config.spaceId;
  const response = await request(config, 'GET', `/spaces?keys=${encodeURIComponent(args.spaceKey)}&limit=1`);
  const space = response.data?.results?.[0];
  if (!space?.id) throw new Error(`Espaco nao encontrado para key ${args.spaceKey}`);
  return space.id;
}

async function findPageByTitle(config, spaceId, parentId, title) {
  const query = `/pages?space-id=${encodeURIComponent(spaceId)}&title=${encodeURIComponent(title)}&status=current&limit=25`;
  const response = await request(config, 'GET', query);
  return (response.data?.results || []).find((page) => String(page.parentId || '') === String(parentId)) || null;
}

async function getPage(config, pageId) {
  const response = await request(config, 'GET', `/pages/${pageId}`);
  return response.data;
}

async function createPage(config, spaceId, parentId, title, adf) {
  const payload = {
    spaceId: String(spaceId),
    status: 'current',
    title,
    parentId: String(parentId),
    body: {
      representation: 'atlas_doc_format',
      value: JSON.stringify(adf),
    },
  };
  const response = await request(config, 'POST', '/pages', payload);
  return response.data;
}

async function updatePage(config, page, title, adf) {
  const payload = {
    id: String(page.id),
    status: 'current',
    title,
    spaceId: String(page.spaceId),
    parentId: page.parentId ? String(page.parentId) : undefined,
    body: {
      representation: 'atlas_doc_format',
      value: JSON.stringify(adf),
    },
    version: {
      number: Number(page.version.number) + 1,
      message: 'Atualizacao PADTec EmpresaFacil',
    },
  };
  const response = await request(config, 'PUT', `/pages/${page.id}`, payload);
  return response.data;
}

function buildIndexMarkdown(results) {
  const lines = [
    '# EmpresaFacil - Documentacao tecnica',
    '',
    'Indice publicado automaticamente a partir dos arquivos Markdown do repositorio.',
    '',
    '## Paginas',
    '',
  ];
  for (const item of results) {
    lines.push(`- [${item.title}](${item.url})`);
  }
  lines.push('', `Atualizado em ${new Date().toISOString()}.`);
  return lines.join('\n');
}

function markdownToSimpleAdf(markdown) {
  const lines = markdown.split('\n');
  const content = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const heading = line.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      content.push({
        type: 'heading',
        attrs: { level: heading[1].length },
        content: [{ type: 'text', text: heading[2] }],
      });
      continue;
    }
    const list = line.match(/^- \[([^\]]+)\]\(([^)]+)\)$/);
    if (list) {
      content.push({
        type: 'bulletList',
        content: [{
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [{
              type: 'text',
              text: list[1],
              marks: [{ type: 'link', attrs: { href: list[2] } }],
            }],
          }],
        }],
      });
      continue;
    }
    content.push({ type: 'paragraph', content: [{ type: 'text', text: line }] });
  }
  return { type: 'doc', version: 1, content };
}

async function main() {
  const args = parseArgs();
  const config = loadConfig();
  if (args.dryRun) {
    for (const [title, markdownPath] of DOCS) {
      if (!fs.existsSync(markdownPath)) throw new Error(`Arquivo nao encontrado: ${markdownPath}`);
      console.log(`[dry-run] ${title} <- ${path.relative(PROJECT_ROOT, markdownPath)}`);
    }
    return;
  }
  assertConfig(config, args);
  const spaceId = await getSpaceId(config, args);
  const parent = await getPage(config, args.parentId);
  console.log(`Publicando em: ${parent.title} (${args.parentId})`);
  console.log(`Space ID: ${spaceId}`);

  const results = [];
  for (const [title, markdownPath] of DOCS) {
    if (!fs.existsSync(markdownPath)) throw new Error(`Arquivo nao encontrado: ${markdownPath}`);
    const adf = convertToAdf(markdownPath);
    const existing = await findPageByTitle(config, spaceId, args.parentId, title);
    const page = existing
      ? await updatePage(config, existing, title, adf)
      : await createPage(config, spaceId, args.parentId, title, adf);
    const action = existing ? 'atualizada' : 'criada';
    const url = `${config.siteBaseUrl}${page._links?.webui || `/spaces/${args.spaceKey}/pages/${page.id}`}`;
    console.log(`${action}: ${title} -> ${url}`);
    results.push({ title, url });
  }

  const indexAdf = markdownToSimpleAdf(buildIndexMarkdown(results));
  const refreshedParent = await getPage(config, args.parentId);
  const updatedParent = await updatePage(config, refreshedParent, refreshedParent.title, indexAdf);
  const parentUrl = `${config.siteBaseUrl}${updatedParent._links?.webui || `/spaces/${args.spaceKey}/pages/${updatedParent.id}`}`;
  console.log(`indice atualizado: ${parentUrl}`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
