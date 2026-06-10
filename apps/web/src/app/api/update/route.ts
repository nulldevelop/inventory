import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const expectedToken = process.env.AGENT_TOKEN || 'default_token'
  if (authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const version = req.nextUrl.searchParams.get('version')
  if (!version) {
    return NextResponse.json(
      { error: 'version query param obrigatório' },
      { status: 400 },
    )
  }

  const latest = await prisma.agentRelease.findFirst({
    orderBy: { createdAt: 'desc' },
  })

  if (!latest || latest.version === version) {
    return NextResponse.json({ update_available: false })
  }

  return NextResponse.json({
    update_available: true,
    version: latest.version,
    download_url: latest.downloadUrl,
  })
}
