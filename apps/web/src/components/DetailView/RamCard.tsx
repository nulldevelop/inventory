// @ts-nocheck
/** biome-ignore-all lint/suspicious/noExplicitAny: dev */
'use client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { barClass, fmt } from '@/utils/format'

function getProgressColor(value: number): string {
  const cls = barClass(value)
  if (cls === 'danger') return 'bg-linear-to-r from-[#7f1d1d] to-[#ef4444]'
  if (cls === 'warn') return 'bg-linear-to-r from-[#004636] to-[#00674f]'
  return 'bg-linear-to-r from-[#004636] to-[#00674f]'
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-[rgba(255,255,255,0.04)] last:border-b-0 hover:bg-[rgba(255,255,255,0.01)] transition-colors duration-200 px-1 -mx-1 rounded">
      <span className="text-text-muted text-[0.9rem]">{label}</span>
      <span className="text-text-dim font-(--font-mono)  text-[0.9rem] text-right max-w-[65%] break-all">
        {value}
      </span>
    </div>
  )
}

export default function RamCard({ data }: { data: any }) {
  const mem = data.memory || {}
  const pct = mem.percentage || 0

  return (
    <Card className="bg-[rgba(0, 18, 13,0.7)] border-[rgba(255,255,255,0.04)] transition-all duration-300 hover:border-[rgba(0, 103, 79,0.15)] col-span-1 lg:col-span-2 h-full w-full">
      <CardHeader className="pb-3 mb-0 border-b border-[rgba(255,255,255,0.04)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[rgba(0, 103, 79,0.06)] border border-[rgba(0, 103, 79,0.12)] rounded-lg flex items-center justify-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-accent"
            >
              <title>RAM</title>
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <line x1="6" y1="10" x2="6" y2="14" />
              <line x1="10" y1="10" x2="10" y2="14" />
              <line x1="14" y1="10" x2="14" y2="14" />
              <line x1="18" y1="10" x2="18" y2="14" />
            </svg>
          </div>
          <h3 className="text-base uppercase tracking-[1.5px] text-text-dim font-(--font-mono) ">
            Memoria RAM
          </h3>
        </div>
      </CardHeader>
      <CardContent>
        <div className="font-(--font-mono)  text-4xl text-text leading-none mt-2 mb-3 tabular-nums">
          {pct.toFixed(1)}%
        </div>
        <InfoRow label="Total" value={fmt(mem.total_bytes)} />
        <InfoRow label="Em Uso" value={fmt(mem.used_bytes)} />
        <div className="flex justify-between items-center py-2.5 hover:bg-[rgba(255,255,255,0.01)] transition-colors duration-200 px-1 -mx-1 rounded">
          <span className="text-text-muted text-[0.9rem]">Livre</span>
          <span className="text-text-dim font-(--font-mono)  text-[0.9rem] text-right max-w-[65%] break-all">
            {fmt(mem.free_bytes)}
          </span>
        </div>
        <div className="h-1.5 bg-[rgba(255,255,255,0.04)] rounded-full overflow-hidden mt-3">
          <div
            className={`h-full rounded-full transition-all duration-700 ${getProgressColor(pct)}`}
            style={{ width: `${pct}%`, animation: 'bar-fill 1s ease-out' }}
          />
        </div>

        {mem.slots?.length > 0 && (
          <>
            <div className="font-(--font-mono)  text-xs uppercase tracking-[1.5px] text-text-muted mt-4 mb-2.5 flex items-center gap-2">
              Modulos Instalados
              <span className="flex-1 h-px bg-linear-to-r from-border to-transparent" />
            </div>
            {mem.slots.map((s, i) => (
              <div
                key={i.toString()}
                className="bg-[rgba(0, 34, 25,0.6)] border border-[rgba(255,255,255,0.04)] rounded-lg py-2.5 px-3.5 mb-2 last:mb-0 text-sm transition-all duration-200 hover:border-[rgba(255,255,255,0.08)]"
              >
                <div className="flex justify-between mb-0.5">
                  <span className="text-text-dim font-(--font-mono) ">
                    {s.slot || `Slot ${i}`}
                  </span>
                  <span className="text-accent font-(--font-mono)  tabular-nums">
                    {fmt(s.capacity_bytes)}
                  </span>
                </div>
                <div className="text-text-muted font-(--font-mono)  text-sm">
                  {s.manufacturer && s.manufacturer !== 'Unknown'
                    ? s.manufacturer
                    : '--'}{' '}
                  · {s.speed_mhz ? `${s.speed_mhz} MHz` : 'N/A'}
                </div>
              </div>
            ))}
          </>
        )}
      </CardContent>
    </Card>
  )
}
