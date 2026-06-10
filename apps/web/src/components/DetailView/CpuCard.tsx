// @ts-nocheck
/** biome-ignore-all lint/suspicious/noExplicitAny: dev */
'use client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { barClass } from '@/utils/format'

function getProgressColor(value: number): string {
  const cls = barClass(value)
  if (cls === 'danger') return 'bg-linear-to-r from-[#7f1d1d] to-[#ef4444]'
  if (cls === 'warn') return 'bg-linear-to-r from-[#004636] to-[#00674f]'
  return 'bg-linear-to-r from-[#004636] to-[#00674f]'
}

function getPctColor(value: number): string {
  const cls = barClass(value)
  if (cls === 'danger') return 'text-red'
  if (cls === 'warn') return 'text-amber-400'
  return 'text-accent'
}

export default function CpuCard({ data }: { data: any }) {
  const pct = data.cpu_usage_percent || 0
  const pcores = data.cpu_physical_cores || data.cpu_cores || 0
  const lcores = data.cpu_logical_cores || 0
  const temp = data.cpu_temp || 0
  const freq = data.cpu_frequency_mhz || 0
  const tempColor =
    temp > 75 ? 'text-red' : temp > 60 ? 'text-amber-400' : 'text-green'

  return (
    <Card className="bg-[rgba(0, 18, 13,0.7)] border-[rgba(255,255,255,0.04)] transition-all duration-300 hover:border-[rgba(0, 103, 79,0.15)] col-span-1 lg:col-span-4 h-full w-full">
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
          <h3 className="text-base uppercase tracking-[1.5px] text-text-dim font-(--font-mono) ">
            Processador
          </h3>
        </div>
      </CardHeader>
      <CardContent>
        {/* Model name */}
        <div className="font-(--font-mono)  text-xl  text-text leading-tight mb-1">
          {data.cpu_model || 'N/A'}
        </div>

        {/* Vendor badge */}
        <div className="flex items-center gap-2 mb-4">
          <span className="font-(--font-mono)  text-[10px] uppercase tracking-[1px] text-accent  px-2 py-0.5 bg-[rgba(0, 103, 79,0.06)] border border-[rgba(0, 103, 79,0.12)] rounded-md">
            {data.cpu_vendor || 'N/A'}
          </span>
        </div>

        {/* Usage highlight card */}
        <div className="bg-[rgba(0, 103, 79,0.04)] border border-[rgba(0, 103, 79,0.1)] rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-(--font-mono)  text-xs uppercase tracking-[1.5px] text-text-muted ">
              Uso da CPU
            </span>
            <span
              className={`font-(--font-mono)  text-2xl  tabular-nums ${getPctColor(pct)}`}
            >
              {pct.toFixed(1)}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-2.5 bg-[rgba(255,255,255,0.04)] rounded-full overflow-hidden mb-3">
            <div
              className={`h-full rounded-full transition-all duration-700 ${getProgressColor(pct)}`}
              style={{ width: `${pct}%`, animation: 'bar-fill 1s ease-out' }}
            />
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="font-(--font-mono)  text-[10px] uppercase tracking-[1px] text-text-muted mb-1">
                Cores
              </div>
              <div className="font-(--font-mono)  text-[0.9rem]  text-text tabular-nums">
                {lcores > 0 ? `${pcores}C / ${lcores}T` : pcores}
              </div>
            </div>
            <div className="text-center border-x border-[rgba(255,255,255,0.04)]">
              <div className="font-(--font-mono)  text-[10px] uppercase tracking-[1px] text-text-muted mb-1">
                Frequencia
              </div>
              <div className="font-(--font-mono)  text-[0.9rem]  text-text tabular-nums">
                {freq >= 1000
                  ? `${(freq / 1000).toFixed(2)} GHz`
                  : `${freq.toFixed(0)} MHz`}
              </div>
            </div>
            <div className="text-center">
              <div className="font-(--font-mono)  text-[10px] uppercase tracking-[1px] text-text-muted mb-1">
                Temp
              </div>
              <div
                className={`font-(--font-mono)  text-[0.9rem]  tabular-nums ${temp > 0 ? tempColor : 'text-text-muted'}`}
              >
                {temp > 0 ? `${temp.toFixed(0)} \u00B0C` : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Per-core usage */}
        {data.cpu_usage_per_core?.length > 0 && (
          <>
            <div className="font-(--font-mono)  text-xs uppercase tracking-[1.5px] text-text-muted mb-3 flex items-center gap-2">
              Uso por Core
              <span className="flex-1 h-px bg-linear-to-r from-border to-transparent" />
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(52px,1fr))] gap-2">
              {data.cpu_usage_per_core.map((v, i) => {
                const coreColor =
                  v >= 85
                    ? 'text-red'
                    : v >= 60
                      ? 'text-amber-400'
                      : 'text-accent'
                return (
                  <div
                    key={i.toString()}
                    className="flex flex-col items-center gap-1 bg-[rgba(255,255,255,0.02)] rounded-lg p-1.5 transition-colors duration-200 hover:bg-[rgba(255,255,255,0.04)]"
                  >
                    <div className="w-full h-8 bg-[rgba(255,255,255,0.03)] rounded overflow-hidden flex items-end">
                      <div
                        className={`w-full rounded-sm min-h-0.5 transition-all duration-500 ${v >= 85 ? 'bg-linear-to-t from-[#7f1d1d] to-red' : 'bg-linear-to-t from-accent-dim to-accent'}`}
                        style={{ height: `${Math.max(3, v)}%` }}
                      />
                    </div>
                    <div className="font-(--font-mono)  text-[9px] text-text-muted ">
                      C{i}
                    </div>
                    <div
                      className={`font-(--font-mono)  text-[10px]  tabular-nums ${coreColor}`}
                    >
                      {(v || 0).toFixed(0)}%
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
