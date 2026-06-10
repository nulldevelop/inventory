import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const expectedToken = process.env.AGENT_TOKEN || 'default_token'
  if (authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const hostname = req.nextUrl.searchParams.get('hostname')
  if (!hostname)
    return NextResponse.json({ error: 'hostname obrigatório' }, { status: 400 })

  const cmd = await prisma.pendingCommand.findUnique({ where: { hostname } })
  if (cmd) {
    await prisma.pendingCommand.delete({ where: { hostname } })
    return NextResponse.json({ action: cmd.action })
  }

  return NextResponse.json({ action: null })
}
