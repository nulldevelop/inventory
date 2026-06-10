// @ts-nocheck
/** biome-ignore-all lint/suspicious/noExplicitAny: dev */
'use client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { barClass } from '@/utils/format'

function getProgressColor(value: number): string {
  const cls = barClass(value)
  if (cls === 'danger') return 'bg-linear-to-r from-[#7f1d1d] to-[#ef4444]'
  if (cls === 'warn') return 'bg-linear-to-r from-[#004636] to-[#00674f]'
  return 'bg-linear-to-r from-[#065f46] to-[#10b981]'
}

export default function BatteryCard({ battery }: { battery: any }) {
  if (!battery) return null
  const pct = battery.charge_percent || 0

  return (
    <Card className="bg-[rgba(0, 18, 13,0.7)] border-[rgba(255,255,255,0.04)] transition-all duration-300 hover:border-[rgba(0, 103, 79,0.15)] h-full w-full">
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
              <title>Battery</title>
              <rect x="2" y="7" width="18" height="10" rx="2" />
              <line x1="22" y1="11" x2="22" y2="13" />
              <line x1="6" y1="11" x2="10" y2="11" />
              <line x1="8" y1="9" x2="8" y2="13" />
            </svg>
          </div>
          <h3 className="text-base uppercase tracking-[1.5px] text-text-dim font-(--font-mono) ">
            Bateria
          </h3>
        </div>
      </CardHeader>
      <CardContent>
        <div className="font-(--font-mono)  text-4xl  text-text leading-none mt-2 mb-1.5 tabular-nums">
          {pct.toFixed(0)}%
        </div>
        <div className="font-(--font-mono)  text-[0.9rem] text-text-muted mb-3">
          {battery.status || 'Unknown'}
        </div>
        <div className="h-1.5 bg-[rgba(255,255,255,0.04)] rounded-full overflow-hidden mt-3">
          <div
            className={`h-full rounded-full transition-all duration-700 ${getProgressColor(pct)}`}
            style={{ width: `${pct}%`, animation: 'bar-fill 1s ease-out' }}
          />
        </div>
        <div className="text-right font-(--font-mono)  text-[0.9rem] text-text-muted mt-1.5 tabular-nums">
          {pct.toFixed(0)}% de carga
        </div>
      </CardContent>
    </Card>
  )
}
