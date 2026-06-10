// @ts-nocheck
/** biome-ignore-all lint/suspicious/noExplicitAny: dev */
'use client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function CpuCard({ data }: { data: any }) {
  const pcores = data.cpu_physical_cores || data.cpu_cores || 0
  const lcores = data.cpu_logical_cores || 0
  const freq = data.cpu_frequency_mhz || 0

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
              <title>CPU</title>
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <rect x="9" y="9" width="6" height="6" />
              <line x1="9" y1="1" x2="9" y2="4" />
              <line x1="15" y1="1" x2="15" y2="4" />
              <line x1="9" y1="20" x2="9" y2="23" />
              <line x1="15" y1="20" x2="15" y2="23" />
              <line x1="20" y1="9" x2="23" y2="9" />
              <line x1="20" y1="14" x2="23" y2="14" />
              <line x1="1" y1="9" x2="4" y2="9" />
              <line x1="1" y1="14" x2="4" y2="14" />
            </svg>
          </div>
          <h3 className="text-base uppercase tracking-[1.5px] text-secondary-foreground font-(--font-mono) ">
            Processador
          </h3>
        </div>
      </CardHeader>
      <CardContent>
        {/* Model name */}
        <div className="font-(--font-mono)  text-xl  text-foreground leading-tight mb-1">
          {data.cpu_model || 'N/A'}
        </div>

        {/* Vendor badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="font-(--font-mono)  text-[10px] uppercase tracking-[1px] text-primary  px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-md">
            {data.cpu_vendor || 'N/A'}
          </span>
        </div>

        {/* Specs grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center bg-primary/5 border border-primary/15 rounded-xl p-4">
            <div className="font-(--font-mono)  text-[10px] uppercase tracking-[1px] text-muted-foreground mb-1">
              Cores
            </div>
            <div className="font-(--font-mono)  text-[1.1rem]  text-foreground tabular-nums">
              {lcores > 0 ? `${pcores}C / ${lcores}T` : pcores}
            </div>
          </div>
          <div className="text-center bg-primary/5 border border-primary/15 rounded-xl p-4">
            <div className="font-(--font-mono)  text-[10px] uppercase tracking-[1px] text-muted-foreground mb-1">
              Frequencia
            </div>
            <div className="font-(--font-mono)  text-[1.1rem]  text-foreground tabular-nums">
              {freq >= 1000
                ? `${(freq / 1000).toFixed(2)} GHz`
                : freq > 0
                  ? `${freq.toFixed(0)} MHz`
                  : 'N/A'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
