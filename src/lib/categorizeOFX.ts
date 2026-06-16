// Categorizador por regras para transações OFX importadas.
// Retorna a melhor categoria das defaults do EmpresaFácil com base em keywords
// na descrição da transação bancária.

import type { DreGroup } from '../categoryStore'

export interface CategorySuggestion {
  categoryId: string
  categoryName: string
  dreGroup: DreGroup
  costType: 'company' | 'personal'
}

type Rule = {
  keywords: string[]
  suggestion: CategorySuggestion
}

// Normaliza a descrição para matching: minúsculas, sem acentos, sem caracteres especiais
function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9 ]/g, ' ')
}

// ─── Regras por prioridade (primeira que bater ganha) ───────────────────────
// Ordem importa: regras mais específicas primeiro

const COMPANY_EXPENSE_RULES: Rule[] = [
  // Impostos e taxas
  {
    keywords: ['das ', 'simples nacional', 'darf', 'gps previdencia', 'inss', 'fgts', 'iss ', 'icms', 'irpj', 'csll', 'cofins', 'pis ', 'irrf', 'recibo federal', 'receita federal', 'pgfn', 'tributo'],
    suggestion: { categoryId: 'cat-company-expense-tax', categoryName: 'Impostos e taxas', dreGroup: 'expenses', costType: 'company' },
  },
  // Serviços contábeis e jurídicos
  {
    keywords: ['contabilidade', 'contador', 'escritorio contabil', 'juridico', 'advogado', 'cartorio', 'assessoria contabil', 'honorario contabil', 'departamento pessoal'],
    suggestion: { categoryId: 'cat-company-expense-legal', categoryName: 'Serviços contábeis e jurídicos', dreGroup: 'expenses', costType: 'company' },
  },
  // Folha de pagamento
  {
    keywords: ['folha pagamento', 'salario', 'pagamento salario', '13 salario', 'decimo terceiro', 'ferias', 'rescisao', 'vale transporte', 'vale refeicao', 'pro labore', 'remuneracao'],
    suggestion: { categoryId: 'cat-company-expense-payroll', categoryName: 'Folha de pagamento', dreGroup: 'expenses', costType: 'company' },
  },
  // Aluguel
  {
    keywords: ['aluguel', 'locacao', 'aloc imovel', 'arrendamento', 'coworking', 'sala comercial'],
    suggestion: { categoryId: 'cat-company-expense-rent', categoryName: 'Aluguel', dreGroup: 'expenses', costType: 'company' },
  },
  // Software e tecnologia
  {
    keywords: ['aws', 'amazon web', 'google cloud', 'azure', 'digital ocean', 'github', 'notion', 'slack', 'zoom', 'microsoft 365', 'office 365', 'adobe', 'canva', 'hostinger', 'locaweb', 'cloudflare', 'vercel', 'netlify', 'heroku', 'hubspot', 'mailchimp', 'sendgrid', 'twilio', 'stripe', 'dropbox', 'figma', 'asana', 'trello', 'jira', 'linear', 'clickup', 'monday', 'pipedrive', 'rdstation', 'conta azul', 'bling', 'tiny erp', 'nfse', 'dominio', 'hospedagem', 'cloud', 'software', 'sistema'],
    suggestion: { categoryId: 'cat-company-expense-tech', categoryName: 'Software e tecnologia', dreGroup: 'expenses', costType: 'company' },
  },
  // Marketing
  {
    keywords: ['meta ads', 'facebook ads', 'google ads', 'tiktok ads', 'instagram ads', 'linkedin ads', 'youtube ads', 'marketing', 'publicidade', 'propaganda', 'anuncio', 'impulsionamento', 'google analytics', 'semrush', 'ahrefs', 'hotmart', 'monetizze', 'eduzz', 'influencer', 'assessoria marketing', 'agencia digital'],
    suggestion: { categoryId: 'cat-company-expense-marketing', categoryName: 'Marketing', dreGroup: 'expenses', costType: 'company' },
  },
  // Energia e utilidades
  {
    keywords: ['enel', 'cemig', 'cpfl', 'coelba', 'cemar', 'elektro', 'equatorial', 'neoenergia', 'energisa', 'celpe', 'cosern', 'coelce', 'sabesp', 'copasa', 'sanepar', 'cedae', 'embasa', 'cagece', 'caema', 'compesa', 'energia eletrica', 'conta luz', 'conta agua', 'agua esgoto', 'saneamento', 'gas encanado', 'comgas', 'gas natural', 'vivo fibra', 'vivo internet', 'claro internet', 'claro fixo', 'tim fixo', 'oi fibra', 'oi internet', 'net virtua', 'sky', 'brisanet', 'unifique', 'sumicity', 'internet banda larga', 'servico telefonico', 'telefone fixo'],
    suggestion: { categoryId: 'cat-company-expense-utilities', categoryName: 'Energia e utilidades', dreGroup: 'expenses', costType: 'company' },
  },
  // Fretes e logística
  {
    keywords: ['correios', 'jadlog', 'loggi', 'total express', 'sequoia', 'braspress', 'fedex', 'dhl', 'ups', 'tnt', 'azul cargo', 'latam cargo', 'frete', 'entrega', 'sedex', 'pac ', 'transportadora', 'despacho', 'logistica', 'envio'],
    suggestion: { categoryId: 'cat-company-expense-logistics', categoryName: 'Fretes e logística', dreGroup: 'expenses', costType: 'company' },
  },
  // Viagens corporativas
  {
    keywords: ['uber', '99pop', 'cabify', 'latam', 'gol ', 'azul ', 'tam ', 'avianca', 'passagem aerea', 'passagem', 'hotel', 'hospedagem', 'airbnb', 'booking', 'expedia', 'combustivel', 'gasolina', 'abastecimento', 'pedagio', 'estacionamento', 'taxi', 'aeroporto', 'viagem'],
    suggestion: { categoryId: 'cat-company-expense-travel', categoryName: 'Viagens corporativas', dreGroup: 'expenses', costType: 'company' },
  },
  // Manutenção e reparos
  {
    keywords: ['manutencao', 'reparo', 'conserto', 'assistencia tecnica', 'tecnico', 'eletricista', 'encanador', 'pintura', 'reforma', 'instalacao', 'ar condicionado'],
    suggestion: { categoryId: 'cat-company-expense-maintenance', categoryName: 'Manutenção e reparos', dreGroup: 'expenses', costType: 'company' },
  },
  // Material de escritório
  {
    keywords: ['papelaria', 'kalunga', 'staples', 'office total', 'impressora', 'cartucho', 'toner', 'material escritorio', 'material de escritorio', 'suprimento'],
    suggestion: { categoryId: 'cat-company-expense-office', categoryName: 'Material de escritório', dreGroup: 'expenses', costType: 'company' },
  },
]

const COMPANY_REVENUE_RULES: Rule[] = [
  // Receitas financeiras
  {
    keywords: ['rendimento', 'rend cdb', 'rend lci', 'rend lca', 'juros poupanca', 'juros recebido', 'rentabilidade', 'aplicacao financeira'],
    suggestion: { categoryId: 'cat-company-revenue-financial', categoryName: 'Receitas financeiras', dreGroup: 'revenue', costType: 'company' },
  },
  // Comissões recebidas
  {
    keywords: ['comissao', 'indicacao', 'afiliado', 'revenda', 'parceria'],
    suggestion: { categoryId: 'cat-company-revenue-commissions', categoryName: 'Comissões recebidas', dreGroup: 'revenue', costType: 'company' },
  },
  // Serviços (default para entradas empresa)
  {
    keywords: ['nota fiscal', 'nf ', 'nfse', 'servico prestado', 'honorario', 'consultoria', 'pix recebido', 'ted recebida', 'doc recebido', 'transferencia recebida', 'pagamento recebido', 'deposito recebido'],
    suggestion: { categoryId: 'cat-company-revenue-services', categoryName: 'Serviços', dreGroup: 'revenue', costType: 'company' },
  },
]

const PERSONAL_EXPENSE_RULES: Rule[] = [
  // Fatura de cartão
  {
    keywords: ['fatura cartao', 'pgto cartao', 'pagamento cartao', 'fatura mastercard', 'fatura visa', 'fatura elo', 'fatura nubank', 'pgto fat'],
    suggestion: { categoryId: 'cat-personal-expense-credit-card', categoryName: 'Fatura de cartão', dreGroup: 'expenses', costType: 'personal' },
  },
  // Saúde
  {
    keywords: ['farmacia', 'drogaria', 'droga', 'clinica', 'medico', 'consulta', 'exame', 'laboratorio', 'hospital', 'plano saude', 'plano de saude', 'unimed', 'amil', 'sulamerica saude', 'bradesco saude', 'hapvida', 'notredame', 'fisioterapeuta', 'psicologo', 'dentista', 'odonto', 'academia', 'smart fit', 'bluefit'],
    suggestion: { categoryId: 'cat-personal-expense-health', categoryName: 'Saúde', dreGroup: 'expenses', costType: 'personal' },
  },
  // Alimentação
  {
    keywords: ['supermercado', 'mercado', 'carrefour', 'atacadao', 'assai', 'extra ', 'walmart', 'big', 'hortifruti', 'pao de acucar', 'zona sul', 'nordestao', 'ifood', 'rappi', 'restaurante', 'lanchonete', 'padaria', 'acougue', 'delivery', 'mc donalds', 'burger king', 'subway', 'pizza', 'churrascaria'],
    suggestion: { categoryId: 'cat-personal-expense-food', categoryName: 'Alimentação', dreGroup: 'expenses', costType: 'personal' },
  },
  // Transporte
  {
    keywords: ['uber', '99pop', 'cabify', 'onibus', 'metro', 'metrô', 'trem', 'passagem', 'combustivel', 'gasolina', 'etanol', 'ipva', 'dpvat', 'licenciamento', 'pedagio', 'sem parar', 'conectcar', 'veloe', 'estacionamento', 'oficina', 'autopeca', 'manutencao carro', 'troca oleo'],
    suggestion: { categoryId: 'cat-personal-expense-transport', categoryName: 'Transporte', dreGroup: 'expenses', costType: 'personal' },
  },
  // Educação
  {
    keywords: ['escola', 'universidade', 'faculdade', 'mensalidade', 'colegio', 'curso', 'idioma', 'wizard', 'cultura inglesa', 'fisk', 'descomplica', 'udemy', 'coursera', 'alura', 'rocketseat', 'dio ', 'material escolar', 'livro', 'amazon livro'],
    suggestion: { categoryId: 'cat-personal-expense-education', categoryName: 'Educação', dreGroup: 'expenses', costType: 'personal' },
  },
  // Lazer
  {
    keywords: ['netflix', 'spotify', 'amazon prime', 'hbo', 'hbo max', 'disney', 'globoplay', 'paramount', 'apple tv', 'ingresso', 'cinema', 'teatro', 'show', 'evento', 'steam', 'playstation', 'xbox', 'nintendo', 'apple arcade', 'deezer'],
    suggestion: { categoryId: 'cat-personal-expense-leisure', categoryName: 'Lazer', dreGroup: 'expenses', costType: 'personal' },
  },
  // Seguros
  {
    keywords: ['seguro', 'porto seguro', 'tokio marine', 'zurich', 'allianz', 'liberty', 'caixa seguradora', 'bb seguro', 'bradesco seguro', 'sulamerica seguro', 'prudential', 'metlife'],
    suggestion: { categoryId: 'cat-personal-expense-insurance', categoryName: 'Seguros', dreGroup: 'expenses', costType: 'personal' },
  },
  // Moradia
  {
    keywords: ['condominio', 'iptu', 'aluguel', 'gas encanado', 'comgas', 'water', 'enel residencial', 'conta de energia', 'sabesp residencial'],
    suggestion: { categoryId: 'cat-personal-expense-housing', categoryName: 'Moradia', dreGroup: 'expenses', costType: 'personal' },
  },
  // Contas domésticas (utilities pessoais)
  {
    keywords: ['enel', 'cemig', 'cpfl', 'coelba', 'neoenergia', 'equatorial', 'sabesp', 'copasa', 'sanepar', 'energia', 'agua ', 'luz ', 'vivo', 'claro', 'tim', 'oi ', 'net ', 'internet', 'telefone'],
    suggestion: { categoryId: 'cat-personal-expense-utilities', categoryName: 'Contas domésticas', dreGroup: 'expenses', costType: 'personal' },
  },
]

const PERSONAL_REVENUE_RULES: Rule[] = [
  // Rendimentos de investimentos
  {
    keywords: ['rendimento', 'rend cdb', 'rend lci', 'juros poupanca', 'dividendo', 'jscp', 'proventos', 'rentabilidade', 'nuinvest', 'xp investimento', 'rico investimento', 'inter invest'],
    suggestion: { categoryId: 'cat-personal-revenue-investments', categoryName: 'Rendimentos de investimentos', dreGroup: 'revenue', costType: 'personal' },
  },
  // Salário
  {
    keywords: ['salario', 'pagamento salario', 'folha pagamento', 'pro labore', 'remuneracao', 'contracheque'],
    suggestion: { categoryId: 'cat-personal-revenue-salary', categoryName: 'Salário', dreGroup: 'revenue', costType: 'personal' },
  },
  // Freelance
  {
    keywords: ['freelance', 'free lance', 'projeto', 'consultoria', 'honorario', 'servico prestado'],
    suggestion: { categoryId: 'cat-personal-revenue-freelance', categoryName: 'Freelance', dreGroup: 'revenue', costType: 'personal' },
  },
]

function matchRules(desc: string, rules: Rule[]): CategorySuggestion | null {
  for (const rule of rules) {
    if (rule.keywords.some((kw) => desc.includes(kw))) {
      return rule.suggestion
    }
  }
  return null
}

export function suggestCategory(
  description: string,
  costType: 'company' | 'personal',
  type: 'Entrada' | 'Saída'
): CategorySuggestion | null {
  const desc = normalize(description)

  if (costType === 'company') {
    if (type === 'Entrada') return matchRules(desc, COMPANY_REVENUE_RULES)
    return matchRules(desc, COMPANY_EXPENSE_RULES)
  }

  // personal
  if (type === 'Entrada') return matchRules(desc, PERSONAL_REVENUE_RULES)
  return matchRules(desc, PERSONAL_EXPENSE_RULES)
}
