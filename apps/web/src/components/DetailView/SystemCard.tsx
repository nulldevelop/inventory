// @ts-nocheck
/** biome-ignore-all lint/suspicious/noExplicitAny: dev */
'use client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { barClass } from '@/utils/format'

function InfoRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-[rgba(255,255,255,0.04)] last:border-b-0 hover:bg-[rgba(255,255,255,0.01)] transition-colors duration-200 px-1 -mx-1 rounded">
      <span className="text-text-muted text-[0.9rem]">{label}</span>
      {children}
    </div>
  )
}

export default function SystemCard({ data }: { data: any }) {
  const sys = data.system || {}
  const defender = data.defender_enabled
  const battery = data.battery

  const getProgressColor = (value: number) => {
    const cls = barClass(value)
    if (cls === 'danger') return 'bg-linear-to-r from-[#7f1d1d] to-[#ef4444]'
    if (cls === 'warn') return 'bg-linear-to-r from-[#004636] to-[#00674f]'
    return 'bg-linear-to-r from-[#065f46] to-[#10b981]'
  }

  return (
    <Card className="bg-[rgba(0, 18, 13,0.7)] border-[rgba(255,255,255,0.04)] transition-all duration-300 hover:border-[rgba(0, 103, 79,0.15)] col-span-1 md:col-span-2 h-full w-full">
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
              <title>Sistema</title>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            </svg>
          </div>
          <h3 className="text-base uppercase tracking-[1.5px] text-text-dim font-(--font-mono) ">
            Sistema
          </h3>
        </div>
      </CardHeader>
      <CardContent>
        <InfoRow label="Fabricante">
          <span className="text-text-dim font-(--font-mono)  text-[0.9rem] text-right max-w-[65%] break-all">
            {sys.manufacturer || 'N/A'}
          </span>
        </InfoRow>
        <InfoRow label="Modelo">
          <span className="text-text-dim font-(--font-mono)  text-[0.9rem] text-right max-w-[65%] break-all">
            {sys.model || 'N/A'}
          </span>
        </InfoRow>
        <InfoRow label="Serial">
          <span className="text-text-dim font-(--font-mono)  text-[0.9rem] text-right max-w-[65%] break-all">
            {sys.serial_number || 'N/A'}
          </span>
        </InfoRow>
        <InfoRow label="Plataforma">
          <span className="text-text-dim font-(--font-mono)  text-[0.9rem] text-right max-w-[65%] break-all">
            {data.platform || 'N/A'}
          </span>
        </InfoRow>
        <InfoRow label="Defender">
          {defender === true && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[0.72em] font-(--font-mono)   bg-[rgba(16,185,129,0.08)] text-green border border-[rgba(16,185,129,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-green" />
              Ativo
            </span>
          )}
          {defender === false && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[0.72em] font-(--font-mono)   bg-[rgba(239,68,68,0.08)] text-red border border-[rgba(239,68,68,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-red" />
              Inativo
            </span>
          )}
          {defender == null && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[0.72em] font-(--font-mono)  bg-[rgba(100,116,139,0.08)] text-text-muted border border-[rgba(100,116,139,0.15)]">
              N/A
            </span>
          )}
        </InfoRow>
        {battery && (
          <div className="mt-3 bg-[rgba(16,185,129,0.04)] border border-[rgba(16,185,129,0.12)] rounded-xl p-3.5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-[rgba(16,185,129,0.08)] border border-[rgba(16,185,129,0.15)] rounded-md flex items-center justify-center">
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-green"
                  >
                    <title>Battery</title>
                    <rect x="2" y="7" width="18" height="10" rx="2" />
                    <line x1="22" y1="11" x2="22" y2="13" />
                    <line x1="6" y1="11" x2="10" y2="11" />
                    <line x1="8" y1="9" x2="8" y2="13" />
                  </svg>
                </div>
                <span className="font-(--font-mono)  text-xs uppercase tracking-[1.5px] text-text-muted">
                  Bateria
                </span>
              </div>
              <span
                className={`font-(--font-mono)  text-xl  tabular-nums ${battery.charge_percent < 20 ? 'text-red' : battery.charge_percent < 40 ? 'text-amber-400' : 'text-green'}`}
              >
                {battery.charge_percent?.toFixed(0) || 0}%
              </span>
            </div>
            <div className="h-1.5 bg-[rgba(255,255,255,0.04)] rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${getProgressColor(battery.charge_percent || 0)}`}
                style={{ width: `${battery.charge_percent || 0}%` }}
              />
            </div>
            <div className="text-right font-(--font-mono)  text-[0.8rem] text-text-muted mt-1.5">
              {battery.status || 'Unknown'}
            </div>
          </div>
        )}
        {/* AnyDesk em destaque */}
        <div className="mt-3 bg-[rgba(0, 103, 79,0.04)] border border-[rgba(0, 103, 79,0.12)] rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-[rgba(0, 103, 79,0.08)] border border-[rgba(0, 103, 79,0.15)] rounded-md flex items-center justify-center">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-accent"
              >
                <title>AnyDesk</title>
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <span className="font-(--font-mono)  text-xs uppercase tracking-[1.5px] text-text-muted">
              AnyDesk ID
            </span>
          </div>
          {data.anydesk_id && data.anydesk_id !== '--' ? (
            <button
              type="button"
              onClick={() =>
                window.open(`anydesk://${data.anydesk_id}`, '_blank')
              }
              className="font-(--font-mono)  text-xl  text-accent tabular-nums tracking-wider bg-transparent border-none cursor-pointer hover:text-accent/80 transition-colors"
            >
              {data.anydesk_id}
            </button>
          ) : (
            <span className="font-(--font-mono)  text-xl  text-accent tabular-nums tracking-wider">
              --
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
