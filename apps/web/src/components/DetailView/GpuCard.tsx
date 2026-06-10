// @ts-nocheck
'use client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { fmt } from '@/utils/format'

// biome-ignore lint/suspicious/noExplicitAny: dev
export default function GpuCard({ data }: { data: any }) {
  const gpus = data.gpus || []

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
              className="text-purple"
            >
              <title>GPU</title>
              <rect x="2" y="7" width="20" height="10" rx="2" />
              <rect x="6" y="10" width="4" height="4" rx="0.5" />
              <rect x="14" y="10" width="4" height="4" rx="0.5" />
            </svg>
          </div>
          <h3 className="text-base uppercase tracking-[1.5px] text-text-dim font-(--font-mono) ">
            GPU
          </h3>
        </div>
      </CardHeader>
      <CardContent>
        {gpus.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-text-muted">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-text-muted/30 mb-3"
            >
              <title>GPU</title>
              <rect x="2" y="7" width="20" height="10" rx="2" />
              <rect x="6" y="10" width="4" height="4" rx="0.5" />
              <rect x="14" y="10" width="4" height="4" rx="0.5" />
            </svg>
            <span className="font-(--font-mono)  text-[0.9rem]">
              Nenhuma GPU detectada
            </span>
          </div>
        ) : (
          gpus.map((g, i) => {
            const vramPct =
              g.vram_total_bytes > 0
                ? ((g.vram_used_bytes / g.vram_total_bytes) * 100).toFixed(0)
                : 0
            const vramFree =
              (g.vram_total_bytes || 0) - (g.vram_used_bytes || 0)

            return (
              <div
                key={i.toString()}
                className="mb-4 pb-4 border-b border-[rgba(255,255,255,0.04)] last:mb-0 last:pb-0 last:border-b-0"
              >
                {/* Model name */}
                <div className="font-(--font-mono)  text-xl  text-text mb-1">
                  {g.model || 'Unknown GPU'}
                </div>

                {/* Driver badge */}
                <div className="flex items-center gap-2 mb-4">
                  <span className="font-(--font-mono)  text-[10px] uppercase tracking-[1px] text-purple  px-2 py-0.5 bg-[rgba(0, 103, 79,0.06)] border border-[rgba(0, 103, 79,0.12)] rounded-md">
                    Driver
                  </span>
                  <span className="font-(--font-mono)  text-[0.9rem] text-text-dim">
                    {g.driver_version || 'N/A'}
                  </span>
                </div>

                {/* VRAM usage highlight */}
                {g.vram_total_bytes > 0 && (
                  <div className="bg-[rgba(0, 103, 79,0.04)] border border-[rgba(0, 103, 79,0.1)] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-(--font-mono)  text-xs uppercase tracking-[1.5px] text-text-muted ">
                        VRAM
                      </span>
                      <span className="font-(--font-mono)  text-2xl  text-purple tabular-nums">
                        {vramPct}%
                      </span>
                    </div>

                    {/* Progress bar */}
                    <div className="h-2.5 bg-[rgba(255,255,255,0.04)] rounded-full overflow-hidden mb-3">
                      <div
                        className="h-full rounded-full transition-all duration-700 bg-linear-to-r from-[#004636] via-[#00674f] to-purple"
                        style={{
                          width: `${vramPct}%`,
                          animation: 'bar-fill 1s ease-out',
                        }}
                      />
                    </div>

                    {/* Stats grid */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center">
                        <div className="font-(--font-mono)  text-[10px] uppercase tracking-[1px] text-text-muted mb-1">
                          Total
                        </div>
                        <div className="font-(--font-mono)  text-[0.9rem]  text-text tabular-nums">
                          {fmt(g.vram_total_bytes)}
                        </div>
                      </div>
                      <div className="text-center border-x border-[rgba(255,255,255,0.04)]">
                        <div className="font-(--font-mono)  text-[10px] uppercase tracking-[1px] text-text-muted mb-1">
                          Em Uso
                        </div>
                        <div className="font-(--font-mono)  text-[0.9rem]  text-purple tabular-nums">
                          {fmt(g.vram_used_bytes)}
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="font-(--font-mono)  text-[10px] uppercase tracking-[1px] text-text-muted mb-1">
                          Livre
                        </div>
                        <div className="font-(--font-mono)  text-[0.9rem]  text-text-dim tabular-nums">
                          {fmt(vramFree)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* No VRAM data */}
                {!g.vram_total_bytes && (
                  <div className="flex justify-between items-center py-2.5 hover:bg-[rgba(255,255,255,0.01)] transition-colors duration-200 px-1 -mx-1 rounded">
                    <span className="text-text-muted text-[0.9rem]">VRAM</span>
                    <span className="text-text-dim font-(--font-mono)  text-[0.9rem]">
                      N/A
                    </span>
                  </div>
                )}

                {/* GPU Usage if available */}
                {g.usage_percent != null && g.usage_percent > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-(--font-mono)  text-xs uppercase tracking-[1.5px] text-text-muted ">
                        Uso da GPU
                      </span>
                      <span className="font-(--font-mono)  text-lg  text-purple tabular-nums">
                        {g.usage_percent.toFixed(0)}%
                      </span>
                    </div>
                    <div className="h-1.5 bg-[rgba(255,255,255,0.04)] rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700 bg-linear-to-r from-[#004636] via-[#00674f] to-purple"
                        style={{
                          width: `${g.usage_percent}%`,
                          animation: 'bar-fill 1s ease-out',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* GPU Temp if available */}
                {g.temperature > 0 && (
                  <div className="flex justify-between items-center mt-3 py-2.5 hover:bg-[rgba(255,255,255,0.01)] transition-colors duration-200 px-1 -mx-1 rounded">
                    <span className="text-text-muted text-[0.9rem]">
                      Temperatura
                    </span>
                    <span
                      className={`font-(--font-mono)  text-[0.9rem]  tabular-nums ${g.temperature > 80 ? 'text-red' : g.temperature > 65 ? 'text-amber-400' : 'text-green'}`}
                    >
                      {g.temperature.toFixed(0)} °C
                    </span>
                  </div>
                )}
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}
