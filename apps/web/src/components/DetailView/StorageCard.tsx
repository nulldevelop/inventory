// @ts-nocheck
/** biome-ignore-all lint/suspicious/noExplicitAny: dev */
'use client'
import { HardDriveIcon } from 'lucide-react'
import { fmt } from '@/utils/format'

/* ── Card de um disco (inventário) ── */
function DiskCard({ disk }: { disk: any }) {
  const tipo = disk.type || disk.media_type

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-background/40 p-4 transition-colors hover:border-primary/30">
      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-primary/15 bg-primary/10 text-primary">
        <HardDriveIcon className="size-6" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="truncate font-(--font-mono) text-base font-medium text-foreground">
            {disk.mountpoint || disk.device}
          </span>
          {disk.fstype && (
            <span className="shrink-0 rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 font-(--font-mono) text-[10px] uppercase tracking-[1px] text-primary">
              {disk.fstype}
            </span>
          )}
        </div>

        <div className="mb-3 truncate font-(--font-mono) text-xs tracking-[0.3px] text-muted-foreground">
          {disk.manufacturer || 'Generic'} · {disk.model || 'Drive'}
        </div>

        <div className="grid grid-cols-2 gap-2 border-t border-border pt-3 font-(--font-mono) text-xs tabular-nums">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-[1px] text-muted-foreground">
              Capacidade
            </span>
            <span className="text-foreground">
              {fmt(disk.total_bytes || disk.size_bytes || disk.size)}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-[1px] text-muted-foreground">
              Tipo
            </span>
            <span className="text-foreground">{tipo || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Cabeçalho de seção ── */
function SectionHeader({
  title,
  icon,
  count,
}: {
  title: string
  icon: React.ReactNode
  count?: number
}) {
  return (
    <div className="mb-4 flex items-center gap-2.5">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-primary/15 bg-primary/10 text-primary">
        {icon}
      </span>
      <h3 className="font-(--font-mono) text-base uppercase tracking-[1.5px] text-foreground">
        {title}
      </h3>
      {typeof count === 'number' && (
        <span className="ml-auto rounded-md border border-border bg-muted px-2 py-0.5 font-(--font-mono) text-[11px] tabular-nums text-muted-foreground">
          {count}
        </span>
      )}
    </div>
  )
}

export default function StorageCard({ data }: { data: any }) {
  const disks = data.disks || []

  return (
    <div className="flex w-full flex-col gap-4">
      {/* Armazenamento */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <SectionHeader
          title="Armazenamento"
          icon={<HardDriveIcon className="size-4" />}
          count={disks.length}
        />
        {disks.length === 0 ? (
          <div className="py-8 text-center font-(--font-mono) text-sm text-muted-foreground">
            Sem discos detectados
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {disks.map((disk, i) => (
              <DiskCard key={i.toString()} disk={disk} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
