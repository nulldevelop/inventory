'use client'
import { BellIcon, DownloadIcon, MonitorIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ReportModal } from './ReportModal'
import ThemeToggle from './ThemeToggle'

function LiveClock() {
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    function tick() {
      const now = new Date()
      setTime(
        now.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
      )
      setDate(
        now
          .toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
          })
          .toUpperCase(),
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="flex items-center gap-2.5 font-(--font-mono) tabular-nums">
      <span className="text-[11px] text-muted-foreground tracking-[1px]">
        {date}
      </span>
      <span className="text-[14px] text-foreground tracking-[1.5px]">
        {time}
      </span>
    </div>
  )
}

export default function TopBar({
  agentCount,
  alertCount = 0,
  onAlertsClick,
  tvMode = false,
  onTvModeToggle,
}: {
  agentCount: number
  alertCount: number
  onAlertsClick: () => void
  tvMode?: boolean
  onTvModeToggle?: () => void
}) {
  const [reportOpen, setReportOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-100 flex h-13 items-center justify-between border-b border-border bg-background/80 px-5 backdrop-blur-xl">
        {/* Esquerda: marca + contadores */}
        <div className="flex items-center gap-5">
          <Link
            href="/"
            className="group flex items-center gap-2.5 no-underline"
          >
            <span className="relative flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 ring-1 ring-primary/20">
              <Image
                src="/spider-eye-svgrepo-com.svg"
                alt="Inventory"
                width={16}
                height={16}
                className="h-4 w-4 opacity-80 transition-opacity group-hover:opacity-100"
              />
            </span>
            <span className="font-(--font-mono) text-[13px] font-semibold tracking-[2px] uppercase text-foreground">
              Inven<span className="text-primary">tory</span>
            </span>
          </Link>

          <div className="h-4 w-px bg-border" />

          <div className="flex items-center gap-1.5 font-(--font-mono) text-[11px] text-muted-foreground tracking-[1px] uppercase">
            <span className="text-[13px] font-semibold text-foreground tabular-nums">
              {agentCount}
            </span>
            <span>agente{agentCount !== 1 ? 's' : ''}</span>
          </div>

          <div className="hidden items-center gap-1.5 font-(--font-mono) text-[10px] text-online tracking-[1.5px] uppercase sm:flex">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-[pulse-green_2s_infinite] rounded-full bg-online" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-online" />
            </span>
            Live
          </div>
        </div>

        {/* Direita: ações + relógio */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onTvModeToggle}
            title="Modo TV"
            className={`flex h-8 items-center gap-1.5 rounded-md border px-2.5 font-(--font-mono) text-[10px] tracking-[1px] uppercase transition-colors ${
              tvMode
                ? 'border-primary/40 bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
            }`}
          >
            <MonitorIcon className="size-3.5" />
            <span className="hidden md:inline">TV {tvMode ? 'on' : 'off'}</span>
          </button>

          <button
            type="button"
            onClick={() => setReportOpen(true)}
            title="Exportar relatório"
            className="flex h-8 items-center gap-1.5 rounded-md border border-border px-2.5 font-(--font-mono) text-[10px] tracking-[1px] uppercase text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
          >
            <DownloadIcon className="size-3.5" />
            <span className="hidden md:inline">Relatório</span>
          </button>

          {alertCount > 0 && (
            <button
              type="button"
              onClick={onAlertsClick}
              title="Ver alertas"
              className="flex h-8 items-center gap-1.5 rounded-md border border-destructive/30 bg-destructive/10 px-2.5 text-destructive transition-colors hover:border-destructive/50 hover:bg-destructive/15"
            >
              <BellIcon className="size-3.5" />
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 font-(--font-mono) text-[11px] font-bold leading-none text-destructive-foreground tabular-nums animate-[breathe_2s_infinite]">
                {alertCount}
              </span>
            </button>
          )}

          <div className="mx-1 h-4 w-px bg-border" />

          <ThemeToggle />

          <div className="mx-1 hidden h-4 w-px bg-border sm:block" />

          <div className="hidden sm:block">
            <LiveClock />
          </div>
        </div>
      </header>

      <ReportModal open={reportOpen} onClose={() => setReportOpen(false)} />
    </>
  )
}
