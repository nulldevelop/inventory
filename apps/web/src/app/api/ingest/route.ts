import { type NextRequest, NextResponse } from 'next/server'
import { checkThresholds } from '@/lib/alerts'
import { prisma } from '@/lib/prisma'

// Throttle de snapshots em memória de processo (OK para Vercel warm instances)
const lastSaved = new Map<string, number>()
// Cache de alertas ativos em memória de processo
export const activeAlerts = new Map<
  string,
  { hostname: string; alerts: { type: string; msg: string }[]; ts: number }
>()

// O baseline para detecção de mudança de hardware é o rawJson PERSISTIDO do
// agente (comparado no POST), então sobrevive a restart do servidor e ao
// intervalo longo entre telemetrias (8h). Sem cache em memória de processo.

type HardwareFingerprint = {
  ramTotalBytes: number | null
  ramSlotsCount: number | null
  ramSlots: string | null
  cpuModel: string | null
  cpuBrand: string | null
  cpuPhysicalCores: number | null
  cpuLogicalCores: number | null
  gpus: string | null
  disks: string | null
  ips: string | null
}

function extractHardwareFingerprint(
  body: Record<string, unknown>,
): HardwareFingerprint {
  const memory = body.memory as Record<string, unknown> | undefined
  const slots = memory?.slots as Array<Record<string, unknown>> | undefined

  const gpus = body.gpus as Array<Record<string, unknown>> | undefined
  const gpuFingerprint = gpus?.map((g) => ({
    name: g.name || g.model,
    vram_total_bytes: g.vram_total_bytes || g.memory_total,
  }))

  const disks = body.disks as Array<Record<string, unknown>> | undefined
  const diskFingerprint = disks?.map((d) => ({
    device: d.device,
    model: d.model,
    total_bytes: d.total_bytes || d.size_bytes || d.size,
  }))

  // Extrair IPs de todas as interfaces de rede (ignorar loopback)
  const network = body.network as Array<Record<string, unknown>> | undefined
  const ipList = network
    ?.filter((n) => {
      const iface = (n.interface as string) || ''
      return !iface.toLowerCase().includes('loopback') && n.mac
    })
    .flatMap((n) => {
      const ips =
        (n.ips as string[]) ||
        (Array.isArray(n.ip)
          ? (n.ip as string[])
          : n.ip
            ? [n.ip as string]
            : [])
      return ips.filter((ip: string) => ip.includes('.')) // apenas IPv4
    })
    .sort()

  return {
    ramTotalBytes:
      (memory?.total_bytes as number) ?? (memory?.total as number) ?? null,
    ramSlotsCount: slots?.length ?? null,
    ramSlots: slots
      ? JSON.stringify(
          slots.map((s) => ({ capacity: s.capacity_bytes ?? s.capacity })),
        )
      : null,
    cpuModel:
      (body.cpu_model as string) ??
      ((body.cpu as Record<string, unknown>)?.model as string) ??
      null,
    cpuBrand:
      (body.cpu_brand as string) ??
      ((body.cpu as Record<string, unknown>)?.brand as string) ??
      null,
    cpuPhysicalCores: (body.cpu_physical_cores as number) ?? null,
    cpuLogicalCores:
      (body.cpu_logical_cores as number) ??
      ((body.cpu as Record<string, unknown>)?.count as number) ??
      null,
    gpus: gpuFingerprint ? JSON.stringify(gpuFingerprint) : null,
    disks: diskFingerprint ? JSON.stringify(diskFingerprint) : null,
    ips: ipList && ipList.length > 0 ? JSON.stringify(ipList) : null,
  }
}

type ChangeEntry = {
  component: string
  field: string
  oldValue: string
  newValue: string
}

function detectHardwareChanges(
  prev: HardwareFingerprint,
  curr: HardwareFingerprint,
): ChangeEntry[] {
  const changes: ChangeEntry[] = []

  // RAM
  if (
    prev.ramTotalBytes != null &&
    curr.ramTotalBytes != null &&
    prev.ramTotalBytes !== curr.ramTotalBytes
  ) {
    changes.push({
      component: 'ram',
      field: 'total_bytes',
      oldValue: String(prev.ramTotalBytes),
      newValue: String(curr.ramTotalBytes),
    })
  }
  if (
    prev.ramSlotsCount != null &&
    curr.ramSlotsCount != null &&
    prev.ramSlotsCount !== curr.ramSlotsCount
  ) {
    changes.push({
      component: 'ram',
      field: 'slots_count',
      oldValue: String(prev.ramSlotsCount),
      newValue: String(curr.ramSlotsCount),
    })
  }
  if (
    prev.ramSlots != null &&
    curr.ramSlots != null &&
    prev.ramSlots !== curr.ramSlots
  ) {
    changes.push({
      component: 'ram',
      field: 'slots_detail',
      oldValue: prev.ramSlots,
      newValue: curr.ramSlots,
    })
  }

  // CPU
  if (
    prev.cpuModel != null &&
    curr.cpuModel != null &&
    prev.cpuModel !== curr.cpuModel
  ) {
    changes.push({
      component: 'cpu',
      field: 'model',
      oldValue: prev.cpuModel,
      newValue: curr.cpuModel,
    })
  }
  if (
    prev.cpuBrand != null &&
    curr.cpuBrand != null &&
    prev.cpuBrand !== curr.cpuBrand
  ) {
    changes.push({
      component: 'cpu',
      field: 'brand',
      oldValue: prev.cpuBrand,
      newValue: curr.cpuBrand,
    })
  }
  if (
    prev.cpuPhysicalCores != null &&
    curr.cpuPhysicalCores != null &&
    prev.cpuPhysicalCores !== curr.cpuPhysicalCores
  ) {
    changes.push({
      component: 'cpu',
      field: 'physical_cores',
      oldValue: String(prev.cpuPhysicalCores),
      newValue: String(curr.cpuPhysicalCores),
    })
  }
  if (
    prev.cpuLogicalCores != null &&
    curr.cpuLogicalCores != null &&
    prev.cpuLogicalCores !== curr.cpuLogicalCores
  ) {
    changes.push({
      component: 'cpu',
      field: 'logical_cores',
      oldValue: String(prev.cpuLogicalCores),
      newValue: String(curr.cpuLogicalCores),
    })
  }

  // GPU
  if (prev.gpus != null && curr.gpus != null && prev.gpus !== curr.gpus) {
    changes.push({
      component: 'gpu',
      field: 'gpus',
      oldValue: prev.gpus,
      newValue: curr.gpus,
    })
  }

  // Disks
  if (prev.disks != null && curr.disks != null && prev.disks !== curr.disks) {
    changes.push({
      component: 'disk',
      field: 'disks',
      oldValue: prev.disks,
      newValue: curr.disks,
    })
  }

  // IPs
  if (prev.ips != null && curr.ips != null && prev.ips !== curr.ips) {
    changes.push({
      component: 'network',
      field: 'ips',
      oldValue: prev.ips,
      newValue: curr.ips,
    })
  }

  return changes
}

const THREE_HOURS_MS = 3 * 60 * 60 * 1000

// Throttle de atualização do rawJson (campo pesado)
const lastFullSave = new Map<string, number>()
const FULL_SAVE_INTERVAL_MS = 60_000 // 1 minuto

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const expectedToken = process.env.AGENT_TOKEN || 'default_token'
  if (authHeader !== `Bearer ${expectedToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const hostname: string = body.hostname
  const serialNumber: string = body.system?.serial_number

  if (!hostname || !serialNumber) {
    return NextResponse.json(
      { error: 'Hostname e Serial Number são obrigatórios' },
      { status: 400 },
    )
  }

  const now = Date.now()
  const shouldSaveFull =
    now - (lastFullSave.get(serialNumber) || 0) > FULL_SAVE_INTERVAL_MS

  // Baseline persistido: o rawJson salvo do último envio. Comparar contra ele
  // (em vez de um cache em memória) garante que a detecção sobreviva a restart
  // do servidor e ao intervalo de 8h entre telemetrias.
  const existing = await prisma.agent.findUnique({
    where: { serialNumber },
    select: { rawJson: true },
  })

  // Detectar mudanças de hardware vs. o baseline persistido
  let changes: ChangeEntry[] = []
  if (existing?.rawJson) {
    const previousHw = extractHardwareFingerprint(
      existing.rawJson as Record<string, unknown>,
    )
    const currentHw = extractHardwareFingerprint(body)
    changes = detectHardwareChanges(previousHw, currentHw)
  }

  // Preparar campos de atualização
  const updateData: any = {
    hostname,
    cpuUsagePercent: body.cpu_usage_percent || 0,
    memoryJson: body.memory ?? undefined,
    disksJson: body.disks ?? undefined,
    osJson: body.os ?? undefined,
    cpuTemp: body.cpu_temp ?? null,
    isOnline: true,
    lastUpdateAt: new Date(),
  }

  // Salva o rawJson pesado no intervalo normal OU sempre que houver mudança de
  // hardware — assim o novo estado vira o próximo baseline e a mudança não é
  // re-detectada/duplicada nos envios seguintes.
  if (shouldSaveFull || changes.length > 0) {
    updateData.rawJson = body
    lastFullSave.set(serialNumber, now)
  }

  // Upsert do agente no banco
  await prisma.agent.upsert({
    where: { serialNumber },
    update: updateData,
    create: {
      serialNumber,
      hostname,
      cpuUsagePercent: body.cpu_usage_percent || 0,
      memoryJson: body.memory ?? undefined,
      disksJson: body.disks ?? undefined,
      osJson: body.os ?? undefined,
      cpuTemp: body.cpu_temp ?? null,
      rawJson: body,
      isOnline: true,
    },
  })

  // Cadastro da instalação (Nome/Secretaria/Departamento): cria o AgentAlias
  // na 1ª vez. Nunca sobrescreve um alias existente (edição manual do admin
  // tem prioridade).
  const registration = body.registration as
    | { user_name?: string; secretaria?: string; departamento?: string }
    | undefined
  if (registration?.user_name && registration?.secretaria) {
    prisma.agentAlias
      .upsert({
        where: { serialNumber },
        update: {}, // não sobrescreve cadastro existente
        create: {
          serialNumber,
          customName: registration.user_name,
          grupo: registration.secretaria,
          subgrupo: registration.departamento || null,
        },
      })
      .catch((e: Error) => console.error('AgentAlias auto-cadastro error:', e))
  }

  // Alertas de threshold
  const alerts = checkThresholds(body)
  if (alerts.length > 0) {
    activeAlerts.set(serialNumber, { hostname, alerts, ts: Date.now() })
  } else {
    activeAlerts.delete(serialNumber)
  }

  // Registrar mudanças de hardware detectadas vs. o baseline persistido
  if (changes.length > 0) {
    prisma.hardwareChangeLog
      .createMany({
        data: changes.map((c) => ({
          serialNumber,
          component: c.component,
          field: c.field,
          oldValue: c.oldValue,
          newValue: c.newValue,
          details: body,
        })),
      })
      .catch((e: Error) => console.error('HardwareChangeLog error:', e))
  }

  // Snapshot a cada 3 horas por agente
  const last = lastSaved.get(serialNumber) || 0
  if (Date.now() - last > THREE_HOURS_MS) {
    lastSaved.set(serialNumber, Date.now())
    prisma.metricSnapshot
      .create({
        data: {
          serialNumber,
          cpuUsage: body.cpu_usage_percent || 0,
          memoryPct: body.memory?.percentage || 0,
          diskJson: JSON.stringify(body.disks || []),
        },
      })
      .catch((e: Error) => console.error('Snapshot error:', e))
  }

  return NextResponse.json({ message: 'Metrics received' })
}
