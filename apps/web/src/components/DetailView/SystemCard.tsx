// @ts-nocheck
/** biome-ignore-all lint/suspicious/noExplicitAny: dev */
'use client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

function InfoRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-border last:border-b-0 hover:bg-muted/40 transition-colors duration-200 px-1 -mx-1 rounded">
      <span className="text-muted-foreground text-[0.9rem]">{label}</span>
      {children}
    </div>
  )
}

export default function SystemCard({ data }: { data: any }) {
  const sys = data.system || {}
  const defender = data.defender_enabled

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
              <title>Sistema</title>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
            </svg>
          </div>
          <h3 className="text-base uppercase tracking-[1.5px] text-secondary-foreground font-(--font-mono) ">
            Sistema
          </h3>
        </div>
      </CardHeader>
      <CardContent>
        <InfoRow label="Fabricante">
          <span className="text-secondary-foreground font-(--font-mono)  text-[0.9rem] text-right max-w-[65%] break-all">
            {sys.manufacturer || 'N/A'}
          </span>
        </InfoRow>
        <InfoRow label="Modelo">
          <span className="text-secondary-foreground font-(--font-mono)  text-[0.9rem] text-right max-w-[65%] break-all">
            {sys.model || 'N/A'}
          </span>
        </InfoRow>
        <InfoRow label="Serial">
          <span className="text-secondary-foreground font-(--font-mono)  text-[0.9rem] text-right max-w-[65%] break-all">
            {sys.serial_number || 'N/A'}
          </span>
        </InfoRow>
        <InfoRow label="Plataforma">
          <span className="text-secondary-foreground font-(--font-mono)  text-[0.9rem] text-right max-w-[65%] break-all">
            {data.platform || 'N/A'}
          </span>
        </InfoRow>
        <InfoRow label="Defender">
          {defender === true && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[0.72em] font-(--font-mono)   bg-online/10 text-green border border-online/20">
              <span className="w-1.5 h-1.5 rounded-full bg-green" />
              Ativo
            </span>
          )}
          {defender === false && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[0.72em] font-(--font-mono)   bg-offline/10 text-red border border-offline/20">
              <span className="w-1.5 h-1.5 rounded-full bg-red" />
              Inativo
            </span>
          )}
          {defender == null && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[0.72em] font-(--font-mono)  bg-muted text-muted-foreground border border-border">
              N/A
            </span>
          )}
        </InfoRow>
        {/* AnyDesk em destaque */}
        <div className="mt-3 bg-primary/5 border border-primary/20 rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-primary/10 border border-primary/20 rounded-md flex items-center justify-center">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-primary"
              >
                <title>AnyDesk</title>
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <span className="font-(--font-mono)  text-xs uppercase tracking-[1.5px] text-muted-foreground">
              AnyDesk ID
            </span>
          </div>
          {data.anydesk_id && data.anydesk_id !== '--' ? (
            <button
              type="button"
              onClick={() =>
                window.open(`anydesk://${data.anydesk_id}`, '_blank')
              }
              className="font-(--font-mono)  text-xl  text-primary tabular-nums tracking-wider bg-transparent border-none cursor-pointer hover:text-primary/80 transition-colors"
            >
              {data.anydesk_id}
            </button>
          ) : (
            <span className="font-(--font-mono)  text-xl  text-primary tabular-nums tracking-wider">
              --
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
