import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const agent = await prisma.agent.findUnique({ where: { serialNumber: id } })
  if (!agent)
    return NextResponse.json(
      { error: 'Agente não encontrado' },
      { status: 404 },
    )

  const { action } = await req.json()
  if (!['shutdown', 'restart', 'lock'].includes(action)) {
    return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
  }

  await prisma.pendingCommand.upsert({
    where: { hostname: agent.hostname },
    update: { action },
    create: { hostname: agent.hostname, action },
  })

  return NextResponse.json({
    message: 'Comando enviado. Será executado na próxima checagem do agente.',
  })
}
