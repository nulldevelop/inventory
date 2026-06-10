'use client'

import { fmtSpd } from '@/utils/format'
import { Card, CardContent, CardHeader } from '../ui/card'

type DiskIo = {
  device: string
  read_bytes_per_sec: number
  write_bytes_per_sec: number
}

export default function DiskIoCard({ data }: { data: DiskIo[] }) {
  const diskIo = data || []

  function calcWidth(value: number) {
    // base: 1MB/s = 10% (ajustável)
    return Math.min(100, Math.max(5, (value / 1048576) * 10))
  }

  return (
    <Card className="bg-[rgba(0, 18, 13,0.7)] border-[rgba(255,255,255,0.04)] transition-all duration-300 hover:border-[rgba(16,185,129,0.15)] h-full">
      <CardHeader className="pb-3 mb-0 border-b border-[rgba(255,255,255,0.04)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[rgba(16,185,129,0.06)] border border-[rgba(16,185,129,0.12)] rounded-lg flex items-center justify-center text-green">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
            >
              <title>Disco</title>
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <h3 className="text-base uppercase tracking-[1.5px] text-text-dim font-(--font-mono)">
            Atividade de Disco
          </h3>
        </div>
      </CardHeader>

      <CardContent>
        {!diskIo.length ? (
          <div className="text-text-muted font-(--font-mono) text-sm py-4 text-center">
            Sem dados
          </div>
        ) : (
          diskIo.map((io, i) => (
            <div
              key={i.toString()}
              className="bg-[rgba(0, 34, 25,0.6)] border border-[rgba(255,255,255,0.04)] rounded-xl p-4 mb-2.5 last:mb-0"
            >
              <div className="font-(--font-mono) text-text mb-4 flex items-center gap-2">
                <span>{io.device}</span>
              </div>

              {/* Leitura */}
              <div className="mb-3">
                <div className="flex justify-between mb-2">
                  <span className="text-xs text-text-muted">Leitura</span>
                  <span className="text-green">
                    {fmtSpd(io.read_bytes_per_sec)}
                  </span>
                </div>

                <div className="h-1.5 bg-[rgba(255,255,255,0.04)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green transition-all duration-700"
                    style={{ width: `${calcWidth(io.read_bytes_per_sec)}%` }}
                  />
                </div>
              </div>

              {/* Escrita */}
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-xs text-text-muted">Escrita</span>
                  <span className="text-blue">
                    {fmtSpd(io.write_bytes_per_sec)}
                  </span>
                </div>

                <div className="h-1.5 bg-[rgba(255,255,255,0.04)] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue transition-all duration-700"
                    style={{ width: `${calcWidth(io.write_bytes_per_sec)}%` }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
