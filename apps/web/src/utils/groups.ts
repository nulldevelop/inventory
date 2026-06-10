import type { AgentSummary } from '@/lib/types'

export const SECRETARIAS = new Set([
  'Administração',
  'Cultura',
  'Desenvolvimento Econômico',
  'Desenvolvimento Social',
  'Desenvolvimento Sustentável',
  'Educação',
  'Governo e Assuntos Jurídicos',
  'Infraestrutura',
  'Mulher e Igualdade Racial',
  'Ordem Pública e Segurança',
  'Saúde',
  'Tecnologia da Informação',
  'Urbanismo',
  'Procuradoria',
])

export const OUTROS_ORGAOS = new Set([
  'Controladoria Geral',
  'Ouvidoria Geral',
  'Procuradoria Geral',
  'Conselhos Municipais',
])

export const ALL_GROUPS = [
  { label: 'SECRETARIAS', options: [...SECRETARIAS] },
  { label: 'OUTROS ÓRGÃOS', options: [...OUTROS_ORGAOS] },
]

export function parentCategory(
  grupo: string | null | undefined,
): string | null {
  if (!grupo) return null
  if (SECRETARIAS.has(grupo)) return 'SECRETARIAS'
  if (OUTROS_ORGAOS.has(grupo)) return 'OUTROS ÓRGÃOS'
  return 'OUTROS'
}

export function groupAgents(agents: AgentSummary[]) {
  const map: Record<string, Record<string, Record<string, AgentSummary[]>>> = {}
  for (const a of agents) {
    const cat = parentCategory(a.grupo) ?? '__none__'
    const grp = a.grupo || '__sem_grupo__'
    const sub = a.subgrupo || '__sem_sub__'
    if (!map[cat]) map[cat] = {}
    if (!map[cat][grp]) map[cat][grp] = {}
    if (!map[cat][grp][sub]) map[cat][grp][sub] = []
    map[cat][grp][sub].push(a)
  }
  return map
}

export const CATEGORY_ORDER = ['SECRETARIAS', 'OUTROS ÓRGÃOS', '__none__']
