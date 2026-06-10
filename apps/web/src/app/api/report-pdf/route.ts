import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { AgentRawData } from '@/lib/types'

function calculateRAM(mem: AgentRawData['memory']): number {
  if (!mem) return 0
  const total = mem.total_bytes ?? mem.total ?? 0
  return total / (1024 * 1024 * 1024)
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams

  const grupo = searchParams.get('grupo')
  const subgrupo = searchParams.get('subgrupo')
  const minRam = searchParams.get('minRam')
  const maxRam = searchParams.get('maxRam')
  const cpuFilter = searchParams.get('cpuFilter')
  const diskType = searchParams.get('diskType')

  const agents = await prisma.agent.findMany()
  const aliases = await prisma.agentAlias.findMany()
  const aliasMap = new Map(aliases.map((a) => [a.serialNumber, a]))

  const filtered = agents.filter((agent) => {
    const alias = aliasMap.get(agent.serialNumber)
    if (grupo && alias?.grupo !== grupo) return false
    if (subgrupo && alias?.subgrupo !== subgrupo) return false

    const raw = agent.rawJson as AgentRawData

    const mem = raw?.memory
    const ramTotal = calculateRAM(mem)
    if (minRam && ramTotal < parseFloat(minRam)) return false
    if (maxRam && ramTotal > parseFloat(maxRam)) return false

    const cpuData = raw?.cpu
    const cpuStr = String(
      raw?.cpu_model ??
        raw?.cpu_brand ??
        (typeof cpuData === 'object' ? cpuData?.model : cpuData) ??
        '',
    ).toLowerCase()

    if (cpuFilter) {
      if (cpuFilter === 'i3-i5') {
        const hasI3 = cpuStr.includes('i3')
        const hasI5 = cpuStr.includes('i5')
        if (!hasI3 && !hasI5) return false
      }
      if (cpuFilter === 'i7-baixo') {
        const i7Match = cpuStr.match(/i7[- ](\d)/)
        const isI7 = cpuStr.includes('i7')
        const isLowGen = i7Match && parseInt(i7Match[1], 10) <= 5
        if (!isI7 || !isLowGen) return false
      }
      if (cpuFilter === 'i7-alto') {
        const i7Match = cpuStr.match(/i7[- ](\d)/)
        const isI7 = cpuStr.includes('i7')
        const isHighGen = i7Match && parseInt(i7Match[1], 10) > 5
        if (!isI7 || !isHighGen) return false
      }
      if (cpuFilter === 'i9') {
        if (!cpuStr.includes('i9')) return false
      }
      if (cpuFilter === 'outros') {
        const isIntel =
          cpuStr.includes('i3') ||
          cpuStr.includes('i5') ||
          cpuStr.includes('i7') ||
          cpuStr.includes('i9')
        const isAMD = cpuStr.includes('amd')
        if (isIntel || isAMD) return false
      }
    }
    if (diskType) {
      const disks = raw?.disks
      const hasType = disks?.some((d) => {
        const t = String(d.fstype ?? d.type ?? d.model ?? '').toLowerCase()
        if (diskType === 'ssd') return t.includes('ssd') || t.includes('nvme')
        if (diskType === 'hdd')
          return t.includes('hdd') || t.includes('mecanico')
        return false
      })
      if (!hasType) return false
    }

    return true
  })

  const data = filtered.map((agent) => {
    const alias = aliasMap.get(agent.serialNumber)
    const raw = agent.rawJson as AgentRawData

    const osName = raw?.os ?? raw?.platform ?? 'N/A'
    const cpu = raw?.cpu_model ?? raw?.cpu_brand ?? 'N/A'
    const cpuCores = raw?.cpu_physical_cores ?? raw?.cpu_logical_cores ?? 'N/A'

    const mem = raw?.memory
    const ramTotal = calculateRAM(mem)
    const memSticks = mem?.slots?.length ?? 1
    const ramFormat =
      ramTotal > 0
        ? `${ramTotal.toFixed(1)} GB (${memSticks} ${memSticks === 1 ? 'pente' : 'pentes'})`
        : 'N/A'

    const disks = raw?.disks
    let diskInfo = 'N/A'
    if (disks && Array.isArray(disks) && disks.length > 0) {
      const disk = disks[0]
      const diskTypeVal = disk.fstype ?? disk.type ?? disk.model ?? 'Unknown'
      const sizeBytes = disk.total_bytes ?? disk.size ?? 0
      const sizeGB =
        sizeBytes > 0 ? Math.round(sizeBytes / (1024 * 1024 * 1024)) : 0
      diskInfo = `${diskTypeVal} - ${sizeGB > 0 ? `${sizeGB} GB` : 'N/A'}`
    }

    const gpus = raw?.gpus
    let gpuInfo = 'N/A'
    if (gpus && Array.isArray(gpus) && gpus.length > 0) {
      gpuInfo =
        gpus
          .map((g) => g.model ?? g.name ?? '')
          .filter(Boolean)
          .join(', ') || 'N/A'
    }

    const network = raw?.network
    let ip = 'N/A'
    let mac = 'N/A'
    if (network && Array.isArray(network) && network.length > 0) {
      const net0 = network[0]
      const ips = net0?.ips ?? net0?.ip
      if (Array.isArray(ips) && ips.length > 0) {
        ip = ips[0].split('/')[0]
      } else if (typeof ips === 'string') {
        ip = ips.split('/')[0]
      }
      mac = net0?.mac ?? 'N/A'
    }

    const sys = raw?.system ?? {}
    const manufacturer = sys?.manufacturer ?? 'N/A'
    const model = sys?.model ?? 'N/A'

    const lastUpdate = new Date(agent.lastUpdateAt).toLocaleString('pt-BR')

    return {
      hostname: agent.hostname,
      customName: alias?.customName ?? '',
      grupo: alias?.grupo ?? '',
      subgrupo: alias?.subgrupo ?? '',
      serial: agent.serialNumber,
      status: agent.isOnline ? 'Online' : 'Offline',
      lastUpdate,
      osName,
      cpu,
      cpuCores,
      ramFormat,
      diskInfo,
      gpuInfo,
      ip,
      mac,
      manufacturer,
      model,
    }
  })

  return NextResponse.json(data)
}
