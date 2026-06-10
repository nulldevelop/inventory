'use client'
import type { AlertEntry } from '@/lib/types'

const TYPE_ICON: Record<string, string> = {
  cpu: '⚙',
  ram: '▦',
  disk: '⬡',
  temp: '🌡',
  hardware: '🔧',
}
const TYPE_COLOR: Record<string, string> = {
  cpu: 'var(--status-offline)',
  ram: 'var(--status-offline)',
  disk: 'var(--primary)',
  temp: 'var(--status-offline)',
  hardware: 'var(--primary)',
}

export default function AlertsPanel({
  alerts,
  onClose,
}: {
  alerts: AlertEntry[]
  onClose: () => void
}) {
  if (!alerts.length) return null

  return (
    <button
      type="button"
      className="fixed inset-0 z-[300] block h-full w-full cursor-default border-none bg-transparent p-0"
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      aria-label="Fechar painel"
    >
      <div
        className="fixed right-5 top-15 max-h-[440px] w-[340px] cursor-default overflow-y-auto rounded-xl border border-destructive/20 bg-popover/95 shadow-2xl backdrop-blur-xl animate-[slide-down_0.2s_ease]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3 font-(--font-mono) text-[9px] uppercase tracking-[2px] text-destructive">
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-[breathe_2s_infinite]" />
            <span>Alertas Ativos</span>
          </div>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full border border-destructive/20 bg-destructive/10 px-1.5 text-[9px] font-bold text-destructive">
            {alerts.length}
          </span>
        </div>

        <div className="py-0.5">
          {alerts
            .filter((a) => a.alerts.some((t) => t.type !== 'hardware'))
            .map((a) => (
              <div
                key={`threshold-${a.serial}`}
                className="border-b border-border/60 px-4 py-2.5 transition-colors last:border-b-0 hover:bg-muted/50"
              >
                <div className="mb-1.5 text-[0.8em] font-medium text-foreground">
                  {a.displayName || a.hostname}
                </div>
                <div className="flex flex-wrap gap-1">
                  {a.alerts
                    .filter((t) => t.type !== 'hardware')
                    .map((t) => (
                      <span
                        key={`${a.serial}-${t.type}-${t.msg}`}
                        className="rounded border border-border bg-muted/60 px-2 py-0.5 font-(--font-mono) text-[0.68em]"
                        style={{
                          color:
                            TYPE_COLOR[t.type] || 'var(--muted-foreground)',
                        }}
                      >
                        {TYPE_ICON[t.type] || '!'} {t.msg}
                      </span>
                    ))}
                </div>
              </div>
            ))}

          {alerts.some((a) => a.alerts.some((t) => t.type !== 'hardware')) &&
            alerts.some((a) => a.alerts.some((t) => t.type === 'hardware')) && (
              <div className="flex items-center gap-2 border-b border-border/60 px-4 py-2">
                <div className="h-px flex-1 bg-border" />
                <span className="font-(--font-mono) text-[8px] uppercase tracking-[2px] text-primary/60">
                  Alterações de Hardware
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>
            )}

          {alerts
            .filter((a) => a.alerts.some((t) => t.type === 'hardware'))
            .map((a) => (
              <div
                key={`hw-${a.serial}`}
                className="border-b border-border/60 px-4 py-2.5 transition-colors last:border-b-0 hover:bg-muted/50"
              >
                <div className="mb-1.5 text-[0.8em] font-medium text-foreground">
                  {a.displayName || a.hostname}
                </div>
                <div className="flex flex-wrap gap-1">
                  {a.alerts
                    .filter((t) => t.type === 'hardware')
                    .map((t, j) => (
                      <span
                        key={`${a.serial}-hw-${j}`}
                        className="rounded border border-primary/15 bg-primary/5 px-2 py-0.5 font-(--font-mono) text-[0.68em]"
                        style={{ color: TYPE_COLOR[t.type] }}
                      >
                        {TYPE_ICON[t.type]} {t.msg}
                      </span>
                    ))}
                </div>
              </div>
            ))}
        </div>
      </div>
    </button>
  )
}
