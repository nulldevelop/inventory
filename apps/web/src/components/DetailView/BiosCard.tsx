// @ts-nocheck
/** biome-ignore-all lint/suspicious/noExplicitAny:dev */
'use client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

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

export default function BiosCard({ data }: { data: any }) {
  const bios = data.bios || {}
  const mb = data.motherboard || {}

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
              <title>BIOS</title>
              <rect x="2" y="2" width="20" height="20" rx="2" />
              <rect x="6" y="6" width="4" height="4" rx="0.5" />
              <rect x="14" y="6" width="4" height="4" rx="0.5" />
              <rect x="6" y="14" width="4" height="4" rx="0.5" />
              <line x1="14" y1="14" x2="18" y2="14" />
              <line x1="14" y1="18" x2="18" y2="18" />
            </svg>
          </div>
          <h3 className="text-base uppercase tracking-[1.5px] text-secondary-foreground font-(--font-mono) ">
            BIOS / Placa-mae
          </h3>
        </div>
      </CardHeader>
      <CardContent>
        <div className="font-(--font-mono)  text-xs uppercase tracking-[1.5px] text-muted-foreground mb-2 flex items-center gap-2">
          BIOS
          <span className="flex-1 h-px bg-linear-to-r from-border to-transparent" />
        </div>
        <InfoRow label="Fabricante" value={bios.manufacturer || 'N/A'} />
        <InfoRow label="Versao" value={bios.version || 'N/A'} />
        <div className="flex justify-between items-center py-2.5 mb-3 hover:bg-muted/40 transition-colors duration-200 px-1 -mx-1 rounded">
          <span className="text-muted-foreground text-[0.9rem]">Data</span>
          <span className="text-secondary-foreground font-(--font-mono)  text-[0.9rem] text-right max-w-[65%] break-all">
            {bios.release_date || 'N/A'}
          </span>
        </div>

        <div className="pt-3 border-t border-border">
          <div className="font-(--font-mono)  text-xs uppercase tracking-[1.5px] text-muted-foreground mb-2 flex items-center gap-2">
            Placa-mae
            <span className="flex-1 h-px bg-linear-to-r from-border to-transparent" />
          </div>
          <InfoRow label="Fabricante" value={mb.manufacturer || 'N/A'} />
          <InfoRow label="Modelo" value={mb.model || 'N/A'} />
          <div className="flex justify-between items-center py-2.5 hover:bg-muted/40 transition-colors duration-200 px-1 -mx-1 rounded">
            <span className="text-muted-foreground text-[0.9rem]">Serial</span>
            <span className="text-secondary-foreground font-(--font-mono)  text-[0.9rem] text-right max-w-[65%] break-all">
              {mb.serial_number || 'N/A'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
