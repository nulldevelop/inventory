import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const revalidate = 10

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const [agent, alias] = await Promise.all([
    prisma.agent.findUnique({ where: { serialNumber: id } }),
    prisma.agentAlias.findUnique({ where: { serialNumber: id } }),
  ])

  if (!agent)
    return NextResponse.json(
      { error: 'Agente não encontrado' },
      { status: 404 },
    )

  return NextResponse.json({
    ...(agent.rawJson as object),
    displayName: alias?.customName ?? agent.hostname,
    grupo: alias?.grupo ?? null,
    subgrupo: alias?.subgrupo ?? null,
    isOnline: agent.isOnline,
    lastUpdate: agent.lastUpdateAt.toISOString(),
  })
}
