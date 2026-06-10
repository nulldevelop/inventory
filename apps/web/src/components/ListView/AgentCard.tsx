'use client'
import { PencilIcon } from 'lucide-react'
import type { AgentSummary } from '@/lib/types'
import { barClass } from '@/utils/format'

function barColorVar(value: number): string {
  const cls = barClass(value)
  if (cls === 'danger') return 'var(--status-offline)'
  if (cls === 'warn') return 'var(--status-warn)'
  return 'var(--status-online)'
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className="font-(--font-mono) text-[9px] uppercase tracking-[1px] text-muted-foreground">
          {label}
        </span>
        <span className="font-(--font-mono) text-[10px] tabular-nums text-foreground">
          {value > 0 ? `${Math.round(value)}%` : '—'}
        </span>
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, background: barColorVar(value) }}
        />
      </div>
    </div>
  )
}

export default function AgentCard({
  agent,
  onSelect,
  onEdit,
  tvMode,
}: {
  agent: AgentSummary
  onSelect: (id: string) => void
  onEdit: (agent: AgentSummary) => void
  tvMode?: boolean
}) {
  const cpu = agent.cpu_usage_percent || 0
  const ram = agent.memory?.percentage || 0
  const gpu = agent.gpu_usage_percent || 0

  return (
    // biome-ignore lint/a11y/useSemanticElements: card é alvo de clique com botões internos
    <div
      onClick={() => onSelect(agent.id)}
      onKeyDown={(e) => e.key === 'Enter' && onSelect(agent.id)}
      role="button"
      tabIndex={0}
      className="group relative cursor-pointer overflow-hidden rounded-xl border border-border bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg"
    >
      {/* Faixa de status no topo */}
      <span
        className={`absolute inset-x-0 top-0 h-[2px] ${agent.isOnline ? 'bg-online/60' : 'bg-offline/50'}`}
      />

      {/* Header */}
      <div className="mb-3 flex items-start justify-between">
        <div className="mr-3 min-w-0 flex-1">
          <h3 className="truncate text-[0.85rem] font-medium text-foreground">
            {agent.displayName}
          </h3>
          <p className="mt-0.5 truncate font-(--font-mono) text-[9px] tracking-[0.5px] text-muted-foreground">
            {agent.hostname} · {agent.id.slice(0, 8)}
          </p>
        </div>

        <div
          className={`flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-[10px] font-medium uppercase tracking-[1px] ${
            agent.isOnline
              ? 'border-online/25 bg-online/10 text-online'
              : 'border-offline/25 bg-offline/10 text-offline'
          }`}
        >
          <span className="relative flex h-2 w-2">
            {agent.isOnline && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-online opacity-60" />
            )}
            <span
              className={`relative inline-flex h-2 w-2 rounded-full ${agent.isOnline ? 'bg-online' : 'bg-offline'}`}
            />
          </span>
          {agent.isOnline ? 'On' : 'Off'}
        </div>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-3 gap-2.5">
        <Metric label="CPU" value={cpu} />
        <Metric label="RAM" value={ram} />
        <Metric label="GPU" value={gpu} />
      </div>

      {/* Editar */}
      {!tvMode && (
        <button
          type="button"
          title="Editar"
          onClick={(e) => {
            e.stopPropagation()
            onEdit(agent)
          }}
          className="absolute bottom-3 right-3 flex h-6 w-6 items-center justify-center rounded-md border border-transparent text-muted-foreground opacity-0 transition-all hover:border-primary/20 hover:bg-primary/10 hover:text-primary group-hover:opacity-100"
        >
          <PencilIcon className="size-3" />
        </button>
      )}
    </div>
  )
}
