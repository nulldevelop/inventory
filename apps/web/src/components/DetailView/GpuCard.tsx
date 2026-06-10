// @ts-nocheck
'use client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { fmt } from '@/utils/format'

// biome-ignore lint/suspicious/noExplicitAny: dev
export default function GpuCard({ data }: { data: any }) {
  const gpus = data.gpus || []

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
              <title>GPU</title>
              <rect x="2" y="7" width="20" height="10" rx="2" />
              <rect x="6" y="10" width="4" height="4" rx="0.5" />
              <rect x="14" y="10" width="4" height="4" rx="0.5" />
            </svg>
          </div>
          <h3 className="text-base uppercase tracking-[1.5px] text-secondary-foreground font-(--font-mono) ">
            GPU
          </h3>
        </div>
      </CardHeader>
      <CardContent>
        {gpus.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <svg
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-muted-foreground/30 mb-3"
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
          gpus.map((g, i) => (
            <div
              key={i.toString()}
              className="mb-4 pb-4 border-b border-border last:mb-0 last:pb-0 last:border-b-0"
            >
              {/* Model name */}
              <div className="font-(--font-mono) text-xl text-foreground mb-2">
                {g.model || g.name || 'Unknown GPU'}
              </div>

              {/* Specs */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-(--font-mono) text-[10px] uppercase tracking-[1px] text-primary px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-md">
                  Driver
                </span>
                <span className="font-(--font-mono) text-[0.9rem] text-secondary-foreground tabular-nums">
                  {g.driver_version || 'N/A'}
                </span>
                {(g.vram_total_bytes || g.memory_total) > 0 && (
                  <>
                    <span className="font-(--font-mono) text-[10px] uppercase tracking-[1px] text-primary px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-md ml-auto">
                      VRAM
                    </span>
                    <span className="font-(--font-mono) text-[0.9rem] text-secondary-foreground tabular-nums">
                      {fmt(g.vram_total_bytes || g.memory_total)}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
