// @ts-nocheck
'use client'
import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { fmt } from '@/utils/format'

type ChangeLog = {
  id: number
  timestamp: string
  component: string
  field: string
  oldValue: string
  newValue: string
}

const componentLabels: Record<string, string> = {
  ram: 'Memoria RAM',
  cpu: 'Processador',
  gpu: 'Placa de Video',
  disk: 'Armazenamento',
  network: 'Rede / IP',
}

const componentColors: Record<
  string,
  { bg: string; border: string; text: string }
> = {
  ram: {
    bg: 'rgba(16,185,129,0.06)',
    border: 'rgba(16,185,129,0.2)',
    text: 'text-green',
  },
  cpu: {
    bg: 'rgba(0, 103, 79,0.06)',
    border: 'rgba(0, 103, 79,0.2)',
    text: 'text-accent',
  },
  gpu: {
    bg: 'rgba(0, 103, 79,0.06)',
    border: 'rgba(0, 103, 79,0.2)',
    text: 'text-purple',
  },
  disk: {
    bg: 'rgba(0, 103, 79,0.06)',
    border: 'rgba(0, 103, 79,0.2)',
    text: 'text-blue',
  },
  network: {
    bg: 'rgba(0, 103, 79,0.06)',
    border: 'rgba(0, 103, 79,0.2)',
    text: 'text-pink',
  },
}

const fieldLabels: Record<string, string> = {
  total_bytes: 'Total',
  slots_count: 'Slots',
  slots_detail: 'Detalhe dos Slots',
  model: 'Modelo',
  brand: 'Marca',
  physical_cores: 'Cores Fisicos',
  logical_cores: 'Cores Logicos',
  gpus: 'GPUs',
  disks: 'Discos',
  ips: 'Enderecos IP',
}

function formatValue(field: string, value: string): string {
  if (field === 'total_bytes') {
    const n = Number(value)
    return Number.isNaN(n) ? value : fmt(n)
  }
  if (field === 'ips') {
    try {
      const arr = JSON.parse(value)
      return Array.isArray(arr) ? arr.join(', ') : value
    } catch {
      return value
    }
  }
  if (field === 'gpus' || field === 'disks' || field === 'slots_detail') {
    try {
      const arr = JSON.parse(value)
      if (!Array.isArray(arr)) return value
      if (field === 'gpus') {
        return arr
          .map(
            (g) =>
              `${g.name || '?'} (${g.vram_total_bytes ? fmt(g.vram_total_bytes) : '?'})`,
          )
          .join(', ')
      }
      if (field === 'disks') {
        return arr
          .map(
            (d) =>
              `${d.model || d.device || '?'} (${d.total_bytes ? fmt(d.total_bytes) : '?'})`,
          )
          .join(', ')
      }
      if (field === 'slots_detail') {
        return arr
          .map((s, i) => `Slot ${i + 1}: ${s.capacity ? fmt(s.capacity) : '?'}`)
          .join(', ')
      }
    } catch {
      return value
    }
  }
  return value
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min atras`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h atras`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d atras`
  return new Date(dateStr).toLocaleDateString('pt-BR')
}

export default function HardwareHistoryCard({
  serialNumber,
}: {
  serialNumber: string
}) {
  const [logs, setLogs] = useState<ChangeLog[]>([])
  const [loading, setLoading] = useState(true)

  const fetchLogs = useCallback(async () => {
    try {
      const res = await fetch(
        `/api/hardware-history?serialNumber=${encodeURIComponent(serialNumber)}&limit=50`,
      )
      if (res.ok) setLogs(await res.json())
    } catch {
    } finally {
      setLoading(false)
    }
  }, [serialNumber])

  useEffect(() => {
    fetchLogs()
    const interval = setInterval(fetchLogs, 60_000)
    return () => clearInterval(interval)
  }, [fetchLogs])

  return (
    <Card className="bg-[rgba(0, 18, 13,0.7)] border-[rgba(255,255,255,0.04)] transition-all duration-300 hover:border-[rgba(0, 103, 79,0.15)] w-full">
      <CardHeader className="pb-3 mb-0 border-b border-[rgba(255,255,255,0.04)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[rgba(0, 103, 79,0.06)] border border-[rgba(0, 103, 79,0.12)] rounded-lg flex items-center justify-center text-accent">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <title>Historico</title>
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <h3 className="text-base uppercase tracking-[1.5px] text-text-dim font-(--font-mono)">
            Historico de Alteracoes
          </h3>
          {logs.length > 0 && (
            <span className="ml-auto font-(--font-mono) text-[11px] text-text-muted bg-[rgba(255,255,255,0.04)] px-2.5 py-1 rounded-lg">
              {logs.length} {logs.length === 1 ? 'alteracao' : 'alteracoes'}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="max-h-[500px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-text-muted">
            <div className="relative">
              <div className="w-4 h-4 rounded-full bg-accent/20 animate-ping absolute inset-0" />
              <div className="w-4 h-4 rounded-full bg-accent relative" />
            </div>
            <span className="ml-3 font-(--font-mono) text-[12px] tracking-[1px]">
              Carregando...
            </span>
          </div>
        ) : logs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-text-muted">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mb-3 opacity-30"
            >
              <title>Sem alteracoes</title>
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              <path d="M9 12l2 2 4-4" />
            </svg>
            <span className="font-(--font-mono) text-[12px] tracking-[1px]">
              Nenhuma alteracao de hardware detectada
            </span>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-[15px] top-2 bottom-2 w-px bg-[rgba(255,255,255,0.06)]" />

            {logs.map((log) => {
              const colors =
                componentColors[log.component] || componentColors.cpu
              return (
                <div key={log.id} className="relative pl-10 pb-4 last:pb-0">
                  {/* Timeline dot */}
                  <div
                    className="absolute left-[11px] top-1.5 w-[9px] h-[9px] rounded-full border-2"
                    style={{
                      borderColor: colors.border,
                      backgroundColor: colors.bg,
                    }}
                  />

                  <div className="bg-[rgba(0, 34, 25,0.6)] border border-[rgba(255,255,255,0.04)] rounded-xl p-3.5 transition-all duration-200 hover:border-[rgba(255,255,255,0.08)]">
                    <div className="flex items-center gap-2 mb-2.5 flex-wrap">
                      <span
                        className={`font-(--font-mono) text-[10px] uppercase tracking-[1px] px-2 py-0.5 rounded-md ${colors.text}`}
                        style={{
                          backgroundColor: colors.bg,
                          border: `1px solid ${colors.border}`,
                        }}
                      >
                        {componentLabels[log.component] || log.component}
                      </span>
                      <span className="font-(--font-mono) text-[10px] text-text-muted tracking-[0.5px]">
                        {fieldLabels[log.field] || log.field}
                      </span>
                      <span
                        className="ml-auto font-(--font-mono) text-[10px] text-text-muted tabular-nums"
                        title={new Date(log.timestamp).toLocaleString('pt-BR')}
                      >
                        {timeAgo(log.timestamp)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 bg-[rgba(239,68,68,0.04)] border border-[rgba(239,68,68,0.12)] rounded-lg px-2.5 py-1.5 min-w-0 flex-1">
                        <span className="font-(--font-mono) text-[9px] uppercase tracking-[1px] text-red shrink-0">
                          Antes
                        </span>
                        <span
                          className="font-(--font-mono) text-[12px] text-text truncate"
                          title={formatValue(log.field, log.oldValue)}
                        >
                          {formatValue(log.field, log.oldValue)}
                        </span>
                      </div>

                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className="text-text-muted shrink-0"
                      >
                        <title>Para</title>
                        <path d="M5 12h14" />
                        <path d="m12 5 7 7-7 7" />
                      </svg>

                      <div className="flex items-center gap-1.5 bg-[rgba(16,185,129,0.04)] border border-[rgba(16,185,129,0.12)] rounded-lg px-2.5 py-1.5 min-w-0 flex-1">
                        <span className="font-(--font-mono) text-[9px] uppercase tracking-[1px] text-green shrink-0">
                          Depois
                        </span>
                        <span
                          className="font-(--font-mono) text-[12px] text-text truncate"
                          title={formatValue(log.field, log.newValue)}
                        >
                          {formatValue(log.field, log.newValue)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
