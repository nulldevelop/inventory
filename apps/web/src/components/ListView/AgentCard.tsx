'use client'
import { PencilIcon } from 'lucide-react'
import type { AgentSummary } from '@/lib/types'

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

      {/* Secretaria / Grupo */}
      <div className="flex flex-wrap items-center gap-1.5">
        {agent.grupo ? (
          <span className="inline-flex items-center rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 font-(--font-mono) text-[10px] font-medium text-primary">
            {agent.grupo}
          </span>
        ) : (
          <span className="font-(--font-mono) text-[10px] text-muted-foreground/50">
            Sem secretaria
          </span>
        )}
        {agent.subgrupo && (
          <span className="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 font-(--font-mono) text-[10px] font-medium text-muted-foreground">
            {agent.subgrupo}
          </span>
        )}
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
