// @ts-nocheck
/** biome-ignore-all lint/suspicious/noExplicitAny: dev*/
'use client'
import { fmtUp } from '@/utils/format'
import { Button } from '../ui/button'

export default function HostHeader({
  data,
  onEdit,
}: {
  data: any
  onEdit: any
}) {
  return (
    <div className="relative mb-6 flex flex-col flex-wrap items-start justify-between gap-4 overflow-hidden rounded-2xl border border-border border-l-[3px] border-l-primary bg-card p-4 sm:flex-row sm:items-center sm:p-6">
      <div className="relative z-10 flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/15 bg-primary/8 text-[22px] transition-colors hover:border-primary/30 hover:bg-primary/12">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-primary"
          >
            <title>Host</title>
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
        </div>
        <div>
          <div className="flex items-center gap-2.5 text-[1.4em] text-foreground">
            <span>{data.displayName || data.hostname}</span>
            <Button
              onClick={onEdit}
              title="Editar"
              className="rounded-md border-none bg-transparent p-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <title>Editar</title>
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </Button>
          </div>
          <div className="mt-0.5 font-(--font-mono) text-[0.82em] tracking-[0.5px] text-muted-foreground">
            {data.hostname}
          </div>
          <div className="mt-0.5 text-[0.9em] text-secondary-foreground">
            {data.os}
          </div>
        </div>
      </div>

      <div className="relative z-10 flex w-full flex-wrap gap-4 sm:w-auto sm:gap-8">
        <div className="flex-1 text-left sm:flex-none sm:text-right">
          <div className="mb-1 font-(--font-mono) text-[9px] uppercase tracking-[2px] text-muted-foreground sm:text-[10px]">
            Uptime
          </div>
          <div className="font-(--font-mono) text-sm text-foreground sm:text-base">
            {fmtUp(data.uptime_seconds || 0)}
          </div>
        </div>
        <div className="flex-1 text-left sm:flex-none sm:text-right">
          <div className="mb-1 font-(--font-mono) text-[9px] uppercase tracking-[2px] text-muted-foreground sm:text-[10px]">
            Versão
          </div>
          <div className="font-(--font-mono) text-sm text-primary sm:text-base">
            v{data.agent_version || '1.0.0'}
          </div>
        </div>
        <div className="flex-1 text-left sm:flex-none sm:text-right">
          <div className="mb-1 font-(--font-mono) text-[9px] uppercase tracking-[2px] text-muted-foreground sm:text-[10px]">
            Atualizado
          </div>
          <div className="font-(--font-mono) text-sm text-online sm:text-base">
            {new Date(data.lastUpdate).toLocaleTimeString('pt-BR')}
          </div>
        </div>
      </div>
    </div>
  )
}
