// @ts-nocheck
/** biome-ignore-all lint/suspicious/noExplicitAny: dev */
'use client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { fmt } from '@/utils/format'

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-border last:border-b-0 hover:bg-muted/40 transition-colors duration-200 px-1 -mx-1 rounded">
      <span className="text-muted-foreground text-[0.9rem]">{label}</span>
      <span className="text-secondary-foreground font-(--font-mono)  text-[0.9rem] text-right max-w-[65%] break-all">
        {value}
      </span>
    </div>
  )
}

export default function RamCard({ data }: { data: any }) {
  const mem = data.memory || {}

  return (
    <Card className="bg-card border-border transition-all duration-300 hover:border-primary/20 h-full w-full">
      <CardHeader className="pb-3 mb-0 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-primary"
            >
              <title>RAM</title>
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <line x1="6" y1="10" x2="6" y2="14" />
              <line x1="10" y1="10" x2="10" y2="14" />
              <line x1="14" y1="10" x2="14" y2="14" />
              <line x1="18" y1="10" x2="18" y2="14" />
            </svg>
          </div>
          <h3 className="text-base uppercase tracking-[1.5px] text-secondary-foreground font-(--font-mono) ">
            Memoria RAM
          </h3>
        </div>
      </CardHeader>
      <CardContent>
        <div className="font-(--font-mono) text-4xl text-foreground leading-none mt-2 mb-3 tabular-nums">
          {fmt(mem.total_bytes)}
        </div>
        <InfoRow label="Total Instalado" value={fmt(mem.total_bytes)} />

        {mem.slots?.length > 0 && (
          <>
            <div className="font-(--font-mono)  text-xs uppercase tracking-[1.5px] text-muted-foreground mt-4 mb-2.5 flex items-center gap-2">
              Modulos Instalados
              <span className="flex-1 h-px bg-linear-to-r from-border to-transparent" />
            </div>
            {mem.slots.map((s, i) => (
              <div
                key={i.toString()}
                className="bg-muted/40 border border-border rounded-lg py-2.5 px-3.5 mb-2 last:mb-0 text-sm transition-all duration-200 hover:border-border"
              >
                <div className="flex justify-between mb-0.5">
                  <span className="text-secondary-foreground font-(--font-mono) ">
                    {s.slot || `Slot ${i}`}
                  </span>
                  <span className="text-primary font-(--font-mono)  tabular-nums">
                    {fmt(s.capacity_bytes)}
                  </span>
                </div>
                <div className="text-muted-foreground font-(--font-mono)  text-sm">
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
