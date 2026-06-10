// @ts-nocheck
'use client'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

// biome-ignore lint/suspicious/noExplicitAny: devc
export default function NetworkCard({ data }: { data: any }) {
  const interfaces = (data.network || []).filter(
    (n) => !n.interface.toLowerCase().includes('loopback') && n.mac,
  )

  const getIpv4 = (ips: string[]) =>
    ips?.find((ip: string) => ip.includes('.')) || null
  const getIpv6 = (ips: string[]) =>
    ips?.find((ip: string) => ip.includes(':')) || null

  return (
    <Card className="bg-card border-border transition-all duration-300 hover:border-primary/20 h-full w-full">
      <CardHeader className="pb-3 mb-0 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-primary/10 border border-primary/20 rounded-lg flex items-center justify-center text-blue">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <title>Rede</title>
              <path d="M5 12.55a11 11 0 0 1 14.08 0" />
              <path d="M1.42 9a16 16 0 0 1 21.16 0" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
          </div>
          <h3 className="text-base uppercase tracking-[1.5px] text-secondary-foreground font-(--font-mono) ">
            Rede
          </h3>
        </div>
      </CardHeader>
      <CardContent className="max-h-87.5 overflow-y-auto">
        {interfaces.map((n, i) => (
          <div
            key={i.toString()}
            className="bg-muted/40 border border-border rounded-xl p-4 mb-2.5 last:mb-0 transition-all duration-200 hover:border-border"
          >
            <div className="font-(--font-mono)   text-foreground mb-2.5 flex items-center gap-2">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-secondary-foreground"
              >
                <title>{n.interface}</title>
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                <line x1="6" y1="6" x2="6.01" y2="6" />
                <line x1="6" y1="18" x2="6.01" y2="18" />
              </svg>
              {n.interface}
            </div>
            <div className="flex gap-3 mb-3 flex-wrap">
              {getIpv4(n.ips) && (
                <div className="flex items-center gap-2 bg-online/5 border border-online/15 rounded-lg px-3 py-1.5">
                  <span className="font-(--font-mono)  text-[10px] uppercase tracking-[1px] text-green ">
                    IPv4
                  </span>
                  <span className="font-(--font-mono)  text-[0.9rem] text-foreground max-w-45 overflow-hidden text-ellipsis whitespace-nowrap tabular-nums">
                    {getIpv4(n.ips)}
                  </span>
                </div>
              )}
              {getIpv6(n.ips) && (
                <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-1.5">
                  <span className="font-(--font-mono)  text-[10px] uppercase tracking-[1px] text-blue ">
                    IPv6
                  </span>
                  <span className="font-(--font-mono)  text-[0.9rem] text-foreground max-w-45 overflow-hidden text-ellipsis whitespace-nowrap">
                    {getIpv6(n.ips)}
                  </span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-3 py-1.5">
                <span className="font-(--font-mono)  text-[9px] uppercase tracking-[1px] text-purple ">
                  MAC
                </span>
                <span className="font-(--font-mono)  text-sm text-foreground tabular-nums">
                  {n.mac}
                </span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
