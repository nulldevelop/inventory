import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const { serialNumber, customName, grupo, subgrupo } = await req.json()

  if (!serialNumber || !customName) {
    return NextResponse.json(
      { error: 'Serial Number e Custom Name são obrigatórios' },
      { status: 400 },
    )
  }

  const alias = await prisma.agentAlias.upsert({
    where: { serialNumber },
    update: { customName, grupo: grupo || null, subgrupo: subgrupo || null },
    create: {
      serialNumber,
      customName,
      grupo: grupo || null,
      subgrupo: subgrupo || null,
    },
  })

  return NextResponse.json({ message: 'Nome atualizado com sucesso', alias })
}
