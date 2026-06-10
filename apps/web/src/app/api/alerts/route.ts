import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { activeAlerts } from '../ingest/route'

export const revalidate = 10

export async function GET() {
  const aliases = await prisma.agentAlias.findMany().catch(() => [])
  const aliasMap = new Map(aliases.map((a) => [a.serialNumber, a]))

  // Alertas de threshold (CPU, RAM, disco, temp)
  const thresholdAlerts = Array.from(activeAlerts.entries()).map(
    ([serial, v]) => {
      const alias = aliasMap.get(serial)
      return { serial, ...v, displayName: alias?.customName ?? v.hostname }
    },
  )

  // Alertas de mudanca de hardware (ultimas 24h)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const recentChanges = await prisma.hardwareChangeLog.findMany({
    where: { timestamp: { gte: oneDayAgo } },
    orderBy: { timestamp: 'desc' },
    select: {
      serialNumber: true,
      component: true,
      field: true,
      oldValue: true,
      newValue: true,
      timestamp: true,
    },
  })

  // Agrupar mudancas por agente
  const changesByAgent = new Map<string, typeof recentChanges>()
  for (const change of recentChanges) {
    const list = changesByAgent.get(change.serialNumber) || []
    list.push(change)
    changesByAgent.set(change.serialNumber, list)
  }

  // Buscar hostnames dos agentes com mudancas
  const agentSerials = [...changesByAgent.keys()]
  const agents =
    agentSerials.length > 0
      ? await prisma.agent.findMany({
          where: { serialNumber: { in: agentSerials } },
          select: { serialNumber: true, hostname: true },
        })
      : []
  const agentMap = new Map(agents.map((a) => [a.serialNumber, a.hostname]))

  const componentLabels: Record<string, string> = {
    ram: 'RAM',
    cpu: 'CPU',
    gpu: 'GPU',
    disk: 'Disco',
    network: 'IP',
  }

  const hardwareAlerts = [...changesByAgent.entries()].map(
    ([serial, changes]) => {
      const hostname = agentMap.get(serial) || serial
      const alias = aliasMap.get(serial)
      return {
        serial,
        hostname,
        displayName: alias?.customName ?? hostname,
        alerts: changes.map((c) => ({
          type: 'hardware',
          msg: `${componentLabels[c.component] || c.component} alterado`,
        })),
        ts: changes[0].timestamp.getTime(),
      }
    },
  )

  return NextResponse.json([...thresholdAlerts, ...hardwareAlerts])
}
