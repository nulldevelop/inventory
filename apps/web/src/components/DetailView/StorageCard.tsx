// @ts-nocheck
/** biome-ignore-all lint/suspicious/noExplicitAny: dev */
'use client'
import {
  ActivityIcon,
  ArrowDownIcon,
  ArrowUpIcon,
  HardDriveIcon,
} from 'lucide-react'
import { barClass, fmt, fmtSpd } from '@/utils/format'

function severityColor(pct: number): string {
  const cls = barClass(pct)
  if (cls === 'danger') return 'var(--status-offline)'
  if (cls === 'warn') return 'var(--status-warn)'
  return 'var(--primary)'
}

function ioWidth(value: number) {
  // base: 1 MB/s ≈ 10%
  return Math.min(100, Math.max(3, ((value || 0) / 1048576) * 10))
}

/* ── Donut de uso de um disco ── */
function UsageDonut({ pct, size = 96 }: { pct: number; size?: number }) {
  const stroke = 9
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (Math.min(pct, 100) / 100) * c
  const color = severityColor(pct)

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="-rotate-90"
        role="img"
        aria-label={`${pct.toFixed(0)}% usado`}
      >
        <title>{`${pct.toFixed(0)}% usado`}</title>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--muted)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{
            transition: 'stroke-dashoffset 1s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-(--font-mono) text-xl font-bold tabular-nums leading-none"
          style={{ color }}
        >
          {pct.toFixed(0)}
          <span className="text-[10px]">%</span>
        </span>
      </div>
    </div>
  )
}

/* ── Card de um disco (Armazenamento) ── */
function DiskCard({ disk }: { disk: any }) {
  const pct = disk.percentage || 0
  const free = (disk.total_bytes || 0) - (disk.used_bytes || 0)

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-background/40 p-4 transition-colors hover:border-primary/30">
      <UsageDonut pct={pct} />

      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="truncate font-(--font-mono) text-base font-medium text-foreground">
            {disk.mountpoint}
          </span>
          <span className="shrink-0 rounded-md border border-primary/20 bg-primary/10 px-2 py-0.5 font-(--font-mono) text-[10px] uppercase tracking-[1px] text-primary">
            {disk.fstype}
          </span>
        </div>

        <div className="mb-3 truncate font-(--font-mono) text-xs tracking-[0.3px] text-muted-foreground">
          {disk.manufacturer || 'Generic'} · {disk.model || 'Drive'}
        </div>

        <div className="grid grid-cols-3 gap-2 border-t border-border pt-3 font-(--font-mono) text-xs tabular-nums">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-[1px] text-muted-foreground">
              Usado
            </span>
            <span className="text-foreground">{fmt(disk.used_bytes)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-[1px] text-muted-foreground">
              Livre
            </span>
            <span className="text-online">{fmt(free)}</span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] uppercase tracking-[1px] text-muted-foreground">
              Total
            </span>
            <span className="text-foreground">{fmt(disk.total_bytes)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* ── Linha de leitura/escrita ── */
function IoRail({
  label,
  value,
  tone,
  icon,
}: {
  label: string
  value: number
  tone: 'read' | 'write'
  icon: React.ReactNode
}) {
  const color = tone === 'read' ? 'var(--status-online)' : 'var(--primary)'
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="flex items-center gap-1.5 font-(--font-mono) text-[11px] uppercase tracking-[1px] text-muted-foreground">
          <span style={{ color }}>{icon}</span>
          {label}
        </span>
        <span
          className="font-(--font-mono) text-sm tabular-nums"
          style={{ color }}
        >
          {fmtSpd(value)}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${ioWidth(value)}%`, background: color }}
        />
      </div>
    </div>
  )
}

/* ── Card de atividade de um dispositivo ── */
function IoCard({ io }: { io: any }) {
  return (
    <div className="rounded-xl border border-border bg-background/40 p-4 transition-colors hover:border-primary/30">
      <div className="mb-3 truncate font-(--font-mono) text-sm font-medium text-foreground">
        {io.device}
      </div>
      <div className="flex flex-col gap-3">
        <IoRail
          label="Leitura"
          value={io.read_bytes_per_sec}
          tone="read"
          icon={<ArrowDownIcon className="size-3.5" />}
        />
        <IoRail
          label="Escrita"
          value={io.write_bytes_per_sec}
          tone="write"
          icon={<ArrowUpIcon className="size-3.5" />}
        />
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
  const diskIo = data.disk_io || []

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

      {/* Atividade de Disco */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <SectionHeader
          title="Atividade de Disco"
          icon={<ActivityIcon className="size-4" />}
          count={diskIo.length}
        />
        {diskIo.length === 0 ? (
          <div className="py-8 text-center font-(--font-mono) text-sm text-muted-foreground">
            Sem atividade registrada
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {diskIo.map((io, i) => (
              <IoCard key={i.toString()} io={io} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
