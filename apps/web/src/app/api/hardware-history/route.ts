import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const serialNumber = req.nextUrl.searchParams.get('serialNumber')
  if (!serialNumber) {
    return NextResponse.json(
      { error: 'serialNumber is required' },
      { status: 400 },
    )
  }

  const limit = Math.min(
    Number(req.nextUrl.searchParams.get('limit')) || 50,
    200,
  )

  const logs = await prisma.hardwareChangeLog.findMany({
    where: { serialNumber },
    orderBy: { timestamp: 'desc' },
    take: limit,
    select: {
      id: true,
      timestamp: true,
      component: true,
      field: true,
      oldValue: true,
      newValue: true,
    },
  })

  return NextResponse.json(logs)
}
