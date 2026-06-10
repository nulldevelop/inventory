export const fmt = (bytes: number) => {
  if (!bytes || bytes === 0) return '0 B'
  const k = 1024,
    s = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / k ** i).toFixed(2))} ${s[i]}`
}

export const fmtSpd = (bps: number) => {
  if (!bps || bps === 0) return '0 B/s'
  const k = 1024,
    s = ['B/s', 'KB/s', 'MB/s', 'GB/s']
  const i = Math.floor(Math.log(bps) / Math.log(k))
  return `${parseFloat((bps / k ** i).toFixed(1))} ${s[i]}`
}

export const fmtUp = (secs: number) => {
  const d = Math.floor(secs / 86400)
  const h = Math.floor((secs % 86400) / 3600)
  const m = Math.floor((secs % 3600) / 60)
  return d > 0 ? `${d}d ${h}h ${m}m` : `${h}h ${m}m`
}

export const barClass = (p: number) =>
  p >= 85 ? 'danger' : p >= 70 ? 'warn' : ''
