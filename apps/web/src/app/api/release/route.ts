import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const expectedToken = process.env.AGENT_TOKEN || 'default_token'
  if (authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { version, download_url } = body

  if (!version || !download_url) {
    return NextResponse.json(
      { error: 'version e download_url são obrigatórios' },
      { status: 400 },
    )
  }

  const release = await prisma.agentRelease.upsert({
    where: { version },
    update: { downloadUrl: download_url },
    create: { version, downloadUrl: download_url },
  })

  return NextResponse.json({
    message: `Release ${release.version} registrada`,
    release,
  })
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const expectedToken = process.env.AGENT_TOKEN || 'default_token'
  if (authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const releases = await prisma.agentRelease.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
  })

  return NextResponse.json(releases)
}
