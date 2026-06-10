'use client'
import { ChevronRightIcon } from 'lucide-react'
import { useState } from 'react'
import type { AgentSummary, AlertEntry } from '@/lib/types'

type StatusFilter = 'all' | 'online' | 'offline' | 'alert'

interface StatsBarProps {
  agents: AgentSummary[]
  alerts: AlertEntry[]
  activeFilter: StatusFilter
  onFilterChange: (f: StatusFilter) => void
  onAlertsClick: () => void
}

type Tone = 'online' | 'offline' | 'warn' | 'neutral'

const toneText: Record<Tone, string> = {
  online: 'text-online',
  offline: 'text-offline',
  warn: 'text-warn',
  neutral: 'text-foreground',
}

function gaugeColor(value: number): string {
  if (value >= 85) return 'var(--status-offline)'
  if (value >= 70) return 'var(--status-warn)'
  return 'var(--status-online)'
}

function GaugeRing({ value, size = 50 }: { value: number; size?: number }) {
  const r = (size - 8) / 2
  const circumference = 2 * Math.PI * r
  const offset = circumference - (Math.min(value, 100) / 100) * circumference
  const color = gaugeColor(value)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg
        className="gauge-ring"
        width={size}
        height={size}
        role="img"
        aria-label={`Medidor de ${value.toFixed(0)}%`}
      >
        <title>{`${value.toFixed(0)}%`}</title>
        <circle className="gauge-track" cx={size / 2} cy={size / 2} r={r} />
        <circle
          className="gauge-fill"
          cx={size / 2}
          cy={size / 2}
          r={r}
          style={{
            stroke: color,
            strokeDasharray: circumference,
            strokeDashoffset: offset,
          }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-(--font-mono) text-[12px] font-bold tabular-nums text-foreground">
        {value.toFixed(0)}
        <span className="ml-0.5 text-[8px] text-muted-foreground">%</span>
      </span>
    </div>
  )
}

function StatCard({
  label,
  value,
  sub,
  tone,
  active,
  onClick,
}: {
  label: string
  value: string | number
  sub?: string
  tone: Tone
  active?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex flex-col items-start gap-1.5 rounded-xl border bg-card p-4 text-left transition-all ${
        active
          ? 'border-primary/40 ring-1 ring-primary/20'
          : 'border-border hover:border-primary/25'
      }`}
    >
      <span className="font-(--font-mono) text-[10px] font-medium tracking-[1.5px] uppercase text-muted-foreground">
        {label}
      </span>
      <span
        className={`font-(--font-mono) text-[2rem] font-bold leading-none tabular-nums ${toneText[tone]}`}
      >
        {value}
      </span>
      {sub && (
        <span className="font-(--font-mono) text-[11px] tabular-nums text-muted-foreground">
          {sub}
        </span>
      )}
    </button>
  )
}

function AvgGaugeCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-card p-4">
      <GaugeRing value={value} />
      <div className="flex flex-col gap-1">
        <span className="font-(--font-mono) text-[10px] font-medium tracking-[1.5px] uppercase text-muted-foreground">
          {label}
        </span>
        <span
          className="font-(--font-mono) text-[1.4rem] font-bold leading-none tabular-nums"
          style={{ color: gaugeColor(value) }}
        >
          {value.toFixed(0)}%
        </span>
      </div>
    </div>
  )
}

function SecretariaBreakdown({ agents }: { agents: AgentSummary[] }) {
  const [open, setOpen] = useState(false)

  const byCategory: Record<string, { online: number; offline: number }> = {}
  for (const a of agents) {
    const cat = a.grupo || 'Sem secretaria'
    if (!byCategory[cat]) byCategory[cat] = { online: 0, offline: 0 }
    if (a.isOnline) byCategory[cat].online++
    else byCategory[cat].offline++
  }

  const entries = Object.entries(byCategory).sort(
    (a, b) => b[1].online + b[1].offline - (a[1].online + a[1].offline),
  )

  return (
    <div className="mt-3">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 font-(--font-mono) text-[10px] tracking-[1px] uppercase text-muted-foreground transition-colors hover:text-primary"
      >
        <ChevronRightIcon
          className={`size-3 transition-transform ${open ? 'rotate-90' : ''}`}
        />
        Breakdown por secretaria
      </button>

      {open && (
        <div className="mt-3 grid max-h-[200px] gap-1.5 overflow-y-auto pr-2 animate-[fade-in_0.2s_ease-out]">
          {entries.map(([name, { online, offline }]) => {
            const total = online + offline
            const pct = total > 0 ? (online / total) * 100 : 0
            return (
              <div key={name} className="flex items-center gap-3 py-1">
                <span
                  className="w-[200px] truncate font-(--font-mono) text-[10px] text-muted-foreground"
                  title={name}
                >
                  {name}
                </span>
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-online transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-[55px] text-right font-(--font-mono) text-[10px] tabular-nums text-muted-foreground">
                  <span className="text-online">{online}</span>
                  {' / '}
                  {total}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function StatsBar({
  agents,
  alerts,
  activeFilter,
  onFilterChange,
  onAlertsClick,
}: StatsBarProps) {
  const online = agents.filter((a) => a.isOnline).length
  const offline = agents.length - online
  const onlinePct =
    agents.length > 0 ? ((online / agents.length) * 100).toFixed(1) : '0'
  const offlinePct =
    agents.length > 0 ? ((offline / agents.length) * 100).toFixed(1) : '0'

  const onlineAgents = agents.filter((a) => a.isOnline)
  const avgCpu =
    onlineAgents.length > 0
      ? onlineAgents.reduce((s, a) => s + (a.cpu_usage_percent || 0), 0) /
        onlineAgents.length
      : 0
  const avgRam =
    onlineAgents.length > 0
      ? onlineAgents.reduce((s, a) => s + (a.memory?.percentage || 0), 0) /
        onlineAgents.length
      : 0

  const alertCount = alerts.reduce((s, a) => s + a.alerts.length, 0)

  return (
    <div className="mb-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <StatCard
          label="Online"
          value={online}
          sub={`${onlinePct}%`}
          tone="online"
          active={activeFilter === 'online'}
          onClick={() =>
            onFilterChange(activeFilter === 'online' ? 'all' : 'online')
          }
        />
        <StatCard
          label="Offline"
          value={offline}
          sub={`${offlinePct}%`}
          tone="offline"
          active={activeFilter === 'offline'}
          onClick={() =>
            onFilterChange(activeFilter === 'offline' ? 'all' : 'offline')
          }
        />
        <StatCard
          label="Alertas"
          value={alertCount}
          sub={alertCount > 0 ? 'ativos' : ''}
          tone="warn"
          active={activeFilter === 'alert'}
          onClick={() => {
            if (alertCount > 0) onAlertsClick()
          }}
        />
        <AvgGaugeCard label="CPU Média" value={avgCpu} />
        <AvgGaugeCard label="RAM Média" value={avgRam} />
      </div>

      <SecretariaBreakdown agents={agents} />
    </div>
  )
}

export type { StatusFilter }
