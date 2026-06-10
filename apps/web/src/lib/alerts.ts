import type { AgentRawData } from './types'

const THRESHOLDS = { cpu: 90, ram: 90, disk: 90, temp: 80 }

export function checkThresholds(
  data: AgentRawData & { cpu_usage_percent?: number; cpu_temp?: number },
): { type: string; msg: string }[] {
  const alerts: { type: string; msg: string }[] = []

  const cpuUsage = data.cpu_usage_percent ?? data.cpu?.usage_percent ?? 0
  if (cpuUsage > THRESHOLDS.cpu)
    alerts.push({
      type: 'cpu',
      msg: `CPU ${cpuUsage.toFixed(0)}%`,
    })

  if ((data.memory?.percentage || 0) > THRESHOLDS.ram)
    alerts.push({
      type: 'ram',
      msg: `RAM ${(data.memory?.percentage ?? 0).toFixed(0)}%`,
    })

  ;(data.disks || []).forEach((d) => {
    const pct = d.percentage ?? d.usage_percent ?? 0
    if (pct > THRESHOLDS.disk)
      alerts.push({
        type: 'disk',
        msg: `Disco ${d.mountpoint} ${pct.toFixed(0)}%`,
      })
  })

  if ((data.cpu_temp || 0) > THRESHOLDS.temp)
    alerts.push({
      type: 'temp',
      msg: `Temp CPU ${(data.cpu_temp as number).toFixed(0)}°C`,
    })

  return alerts
}
