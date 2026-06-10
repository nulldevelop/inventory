import { type NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { AgentRawData } from '@/lib/types'

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

    const cpuRaw =
      raw?.cpu_model ??
      raw?.cpu_brand ??
      (typeof raw?.cpu === 'object' ? raw?.cpu?.brand : raw?.cpu) ??
      ''
    const cpu = typeof cpuRaw === 'string' ? cpuRaw : ''

    if (cpuFilter === 'i3-i5') {
      const hasI3 = cpu.toLowerCase().includes('i3')
      const hasI5 = cpu.toLowerCase().includes('i5')
      if (!hasI3 && !hasI5) return false
    }
    if (cpuFilter === 'i7-baixo') {
      const i7Match = cpu.match(/i7[- ](\d)/)
      const isI7 = cpu.toLowerCase().includes('i7')
      const isLowGen = i7Match && parseInt(i7Match[1], 10) <= 5
      if (!isI7 || !isLowGen) return false
    }
    if (cpuFilter === 'i7-alto') {
      const i7Match = cpu.match(/i7[- ](\d)/)
      const isI7 = cpu.toLowerCase().includes('i7')
      const isHighGen = i7Match && parseInt(i7Match[1], 10) > 5
      if (!isI7 || !isHighGen) return false
    }
    if (cpuFilter === 'i9') {
      if (!cpu.toLowerCase().includes('i9')) return false
    }
    if (cpuFilter === 'outros') {
      const isIntel =
        cpu.toLowerCase().includes('i3') ||
        cpu.toLowerCase().includes('i5') ||
        cpu.toLowerCase().includes('i7') ||
        cpu.toLowerCase().includes('i9')
      const isAMD = cpu.toLowerCase().includes('amd')
      if (isIntel || isAMD) return false
    }

    const disks = raw?.disks
    if (diskType && diskType !== 'todos' && disks) {
      const hasType = Array.isArray(disks)
        ? disks.some((d) => {
            const t = String(d.type ?? '').toLowerCase()
            if (diskType === 'ssd')
              return t.includes('ssd') || t.includes('nvme')
            if (diskType === 'hdd')
              return t.includes('hdd') || t.includes('mecanico')
            return false
          })
        : false
      if (!hasType) return false
    }

    return true
  })

  const header = [
    'Hostname',
    'Nome Personalizado',
    'Secretaria',
    'Setor',
    'Serial Number',
    'Status',
    'Ultima Atualizacao',
    'Tempo Ultima Atualizacao',
    'Sistema Operacional',
    'Versao SO',
    'Processador',
    'Nucleos CPU',
    'Memoria RAM',
    'RAM Uso %',
    'HD',
    'Disco Uso %',
    'GPU',
    'VRAM GB',
    'IP Address',
    'MAC Address',
    'Fabricante',
    'Modelo',
    'Demais Informacoes',
  ]

  const csvLines: string[] = []

  csvLines.push(escapeCSV(header.join(';')))

  for (const agent of filtered) {
    const alias = aliasMap.get(agent.serialNumber)
    const raw = agent.rawJson as AgentRawData

    const hostname = cleanValue(agent.hostname)
    const customName = cleanValue(alias?.customName ?? '')
    const grupo = cleanValue(alias?.grupo ?? '')
    const subgrupo = cleanValue(alias?.subgrupo ?? '')
    const serial = cleanValue(agent.serialNumber)
    const status = agent.isOnline ? 'Online' : 'Offline'
    const lastUpdate = formatDate(agent.lastUpdateAt)
    const lastUpdateRelative = getRelativeTime(agent.lastUpdateAt)

    const osName = cleanValue(raw?.os ?? raw?.platform ?? 'N/A')
    const osVersion = 'N/A'

    const cpu = cleanValue(
      raw?.cpu_model ?? raw?.cpu_brand ?? raw?.cpu ?? 'N/A',
    )
    const cpuCores = String(
      raw?.cpu_physical_cores ??
        raw?.cpu_logical_cores ??
        raw?.cpu_cores ??
        'N/A',
    )

    const mem = raw?.memory
    const ramTotal = calculateRAM(mem)
    const ramUsage = mem?.percentage ?? mem?.used_percent ?? 0
    const memSticks =
      mem?.memories?.length ?? mem?.banks?.length ?? mem?.slots?.length ?? 1
    const ramFormat =
      ramTotal > 0
        ? `${ramTotal.toFixed(1)} GB | ${memSticks} ${memSticks === 1 ? 'pente' : 'pentes'}`
        : 'N/A'

    const disks = raw?.disks
    let diskInfo = 'N/A'
    let diskUsagePct = 'N/A'
    if (disks && Array.isArray(disks) && disks.length > 0) {
      const disk = disks[0]
      const diskTypeVal = (
        disk.fstype ??
        disk.type ??
        disk.model ??
        'Unknown'
      ).toString()
      const sizeBytes =
        disk.size_bytes ??
        disk.size ??
        disk.capacity ??
        disk.total_bytes ??
        disk.total ??
        0
      let sizeGB =
        sizeBytes > 0 ? Math.round(sizeBytes / (1024 * 1024 * 1024)) : 0
      if (sizeGB === 0 && disk.model) {
        const modelMatch = String(disk.model).match(/(\d+)\s*GB/i)
        if (modelMatch) sizeGB = parseInt(modelMatch[1], 10)
      }
      if (sizeGB === 0 && disk.model) {
        const modelMatch = String(disk.model).match(/(\d+)\s*TB/i)
        if (modelMatch) sizeGB = parseInt(modelMatch[1], 10) * 1000
      }
      const usageVal =
        disk.percentage ?? disk.usage_percent ?? disk.used_percent ?? 0

      const diskTypeClean = cleanValue(diskTypeVal) || 'N/A'
      const diskSizeStr = sizeGB > 0 ? `${sizeGB} GB` : 'N/A'
      diskInfo = `${diskTypeClean} | ${diskSizeStr}`
      diskUsagePct = usageVal > 0 ? `${usageVal.toFixed(1)}%` : 'N/A'
    }

    const gpus = raw?.gpus
    let gpuInfo = 'N/A'
    let vramInfo = 'N/A'
    let demaisInfo = 'N/A'
    if (gpus && Array.isArray(gpus) && gpus.length > 0) {
      const gpu = gpus[0]
      gpuInfo = cleanValue(gpu.name ?? gpu.model ?? 'N/A') || 'N/A'
      const vramBytes = gpu.vram_total_bytes ?? gpu.memory_total ?? 0
      const vramGB = vramBytes / (1024 * 1024 * 1024)
      vramInfo = vramGB > 0 ? vramGB.toFixed(1) : 'N/A'
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
      mac = cleanValue(net0?.mac ?? 'N/A')
    }

    const sys = raw?.system ?? raw?.system_info ?? {}
    const manufacturer =
      cleanValue(sys?.manufacturer ?? sys?.vendor ?? 'N/A') || 'N/A'
    const model = cleanValue(sys?.model ?? sys?.product ?? 'N/A') || 'N/A'

    const gpusAll = raw?.gpus
    if (gpusAll && Array.isArray(gpusAll) && gpusAll.length > 0) {
      const gpuNames = gpusAll
        .map((g: Record<string, unknown>) => g.name ?? g.model ?? '')
        .filter(Boolean)
        .join(';')
      demaisInfo = gpuNames || 'N/A'
    }

    const row = [
      hostname,
      customName,
      grupo,
      subgrupo,
      serial,
      status,
      lastUpdate,
      lastUpdateRelative,
      osName,
      osVersion,
      cpu,
      cpuCores,
      ramFormat,
      ramUsage > 0 ? `${ramUsage.toFixed(1)}%` : 'N/A',
      diskInfo,
      diskUsagePct,
      gpuInfo,
      vramInfo,
      ip,
      mac,
      manufacturer,
      model,
      demaisInfo,
    ]

    csvLines.push(escapeCSV(row.join(';')))
  }

  const bom = '\uFEFF'
  const csv = bom + csvLines.join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename=relatorio_inventario_${formatDateFile(new Date())}.csv`,
    },
  })
}

function escapeCSV(value: string): string {
  if (
    value.includes(';') ||
    value.includes('\n') ||
    value.includes('\r') ||
    value.includes('"')
  ) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

function cleanValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value).normalize('NFC').trim()
}

function formatDate(date: Date): string {
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDateFile(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function getRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffMin < 1) return 'Agora'
  if (diffMin < 60) return `${diffMin} min`
  if (diffHour < 24) return `${diffHour}h`
  if (diffDay === 1) return '1 dia'
  if (diffDay < 30) return `${diffDay} dias`
  return formatDate(date)
}

function calculateRAM(mem: AgentRawData['memory']): number {
  if (!mem) return 0

  if (mem.total_gb) return mem.total_gb
  if (mem.total) return mem.total

  if (mem.total_bytes) {
    return mem.total_bytes / (1024 * 1024 * 1024)
  }

  if (mem.slots && Array.isArray(mem.slots)) {
    let total = 0
    for (const slot of mem.slots) {
      const bytes = slot.capacity_bytes ?? slot.capacity ?? 0
      total += bytes / (1024 * 1024 * 1024)
    }
    return total
  }

  return 0
}
