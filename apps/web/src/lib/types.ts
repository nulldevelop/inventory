export type AgentRawData = {
  hostname?: string
  os?: string
  platform?: string
  release?: string
  arch?: string
  agent_version?: string
  cpu_model?: string
  cpu_brand?: string
  cpu_physical_cores?: number
  cpu_logical_cores?: number
  cpu_cores?: number
  cpu?: {
    model?: string
    brand?: string
    count?: number
  }
  memory?: {
    total?: number
    total_bytes?: number
    total_gb?: number
    slots?: Array<{
      capacity_bytes?: number
      capacity?: number
    }>
    memories?: Array<unknown>
    banks?: Array<unknown>
  }
  gpus?: Array<{
    name?: string
    model?: string
    memory_total?: number
    vram_total_bytes?: number
  }>
  disks?: Array<{
    device?: string
    mountpoint?: string
    fstype?: string
    type?: string
    model?: string | number
    total_bytes?: number
    size_bytes?: number
    size?: number
    capacity?: number
    total?: number
  }>
  network?: Array<{
    interface?: string
    ips?: string[]
    ip?: string[] | string
    mac?: string
  }>
  system?: {
    manufacturer?: string
    model?: string
    serial_number?: string
    vendor?: string
    product?: string
  }
  system_info?: {
    manufacturer?: string
    model?: string
    serial_number?: string
    vendor?: string
    product?: string
  }
  bios?: {
    vendor?: string
    version?: string
    date?: string
  }
}

export type AgentSummary = {
  id: string // serialNumber
  hostname: string
  displayName: string
  grupo: string | null
  subgrupo: string | null
  os: unknown
  lastUpdate: string
  isOnline: boolean
  agent_version?: string
}

export type AlertEntry = {
  serial: string
  hostname: string
  displayName: string
  alerts: { type: string; msg: string }[]
  ts: number
}

export type PendingAction = 'shutdown' | 'restart' | 'lock' | null
