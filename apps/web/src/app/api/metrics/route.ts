import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get('search') || ''
  const status = req.nextUrl.searchParams.get('status') // 'online' | 'offline' | 'all'
  const grupo = req.nextUrl.searchParams.get('grupo')
  // Saneamento: evita NaN/negativos vindos da query (ex.: ?page=abc) que
  // gerariam skip/take inválidos no Prisma.
  const rawPage = parseInt(req.nextUrl.searchParams.get('page') || '1', 10)
  const rawLimit = parseInt(req.nextUrl.searchParams.get('limit') || '100', 10)
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1
  const limit =
    Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 10000) : 100
  const offset = (page - 1) * limit

  // biome-ignore lint/suspicious/noExplicitAny: where dinâmico do Prisma
  const where: any = { AND: [] }

  if (search) {
    where.AND.push({
      OR: [
        // MySQL usa collation case-insensitive por padrão (não há "mode: insensitive")
        { hostname: { contains: search } },
        { alias: { customName: { contains: search } } },
        { serialNumber: { contains: search } },
      ],
    })
  }

  if (status === 'online') {
    where.AND.push({ isOnline: true })
  } else if (status === 'offline') {
    where.AND.push({ isOnline: false })
  }

  if (grupo) {
    where.AND.push({ alias: { grupo: grupo } })
  }

  // Se não houver filtros, simplificamos o objeto where
  const finalWhere = where.AND.length === 0 ? {} : where

  // Buscamos o total e os dados em paralelo
  const [total, agents] = await Promise.all([
    prisma.agent.count({ where: finalWhere }),
    prisma.agent.findMany({
      where: finalWhere,
      skip: offset,
      take: limit,
      orderBy: [{ isOnline: 'desc' }, { hostname: 'asc' }],
      select: {
        serialNumber: true,
        hostname: true,
        osJson: true,
        isOnline: true,
        lastUpdateAt: true,
        alias: {
          select: {
            customName: true,
            grupo: true,
            subgrupo: true,
          },
        },
      },
    }),
  ])

  const data = agents.map((agent) => {
    return {
      id: agent.serialNumber,
      hostname: agent.hostname,
      displayName: agent.alias?.customName ?? agent.hostname,
      grupo: agent.alias?.grupo ?? null,
      subgrupo: agent.alias?.subgrupo ?? null,
      os: agent.osJson,
      lastUpdate: agent.lastUpdateAt.toISOString(),
      isOnline: agent.isOnline,
      agent_version: '...', // Simplificado para performance
    }
  })

  return NextResponse.json({
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  })
}
