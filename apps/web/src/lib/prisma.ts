import 'dotenv/config'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from '@/generated/prisma/client'

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL não está definida no ambiente')
}

let url: URL
try {
  url = new URL(process.env.DATABASE_URL)
} catch {
  throw new Error('DATABASE_URL não é uma URL de conexão válida')
}

// Preserva configuração de SSL/TLS vinda da query string da connection string,
// que de outra forma seria descartada ao montar as opções do adapter.
// Suporta os formatos comuns: ?ssl=true, ?sslmode=require, ?sslaccept=strict.
function parseSsl(
  params: URLSearchParams,
): boolean | { rejectUnauthorized: boolean } | undefined {
  const ssl = params.get('ssl')?.toLowerCase()
  const sslmode = params.get('sslmode')?.toLowerCase()
  const sslaccept = params.get('sslaccept')?.toLowerCase()

  // Modos que aceitam certificados inválidos/auto-assinados
  if (ssl === 'false' || ssl === '0' || sslmode === 'disable') return undefined
  if (
    sslaccept === 'accept_invalid_certs' ||
    sslmode === 'require' ||
    sslmode === 'prefer'
  ) {
    return { rejectUnauthorized: false }
  }
  // Verificação estrita
  if (
    ssl === 'true' ||
    ssl === '1' ||
    sslaccept === 'strict' ||
    sslmode === 'verify-ca' ||
    sslmode === 'verify-full'
  ) {
    return true
  }
  return undefined
}

const ssl = parseSsl(url.searchParams)

const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: url.port ? Number(url.port) : 3306,
  user: decodeURIComponent(url.username),
  password: decodeURIComponent(url.password),
  database: url.pathname.replace(/^\//, ''),
  connectionLimit: 5,
  // Trata DATETIME como UTC, alinhado à convenção do Prisma. Sem isso, o
  // driver mariadb usa o fuso local do Node ao gravar/ler, gerando offset
  // (ex.: lastUpdateAt adiantado em horas no banco).
  timezone: 'Z',
  ...(ssl !== undefined ? { ssl } : {}),
})

// Singleton: em dev, o HMR do Next reavalia este módulo a cada alteração e, sem
// cache global, criaria um novo PrismaClient (e novo pool) por reload, vazando
// conexões. Reaproveita a instância via globalThis.
const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient
}

const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export { prisma }
