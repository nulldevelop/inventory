/** biome-ignore-all lint/a11y/useKeyWithClickEvents: dev */
/** biome-ignore-all lint/a11y/noStaticElementInteractions: dev */
'use client'
import { ChevronUpIcon, PencilIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useVirtualScroll } from '@/hooks/useVirtualScroll'
import type { AgentSummary } from '@/lib/types'

type SortKey =
  | 'status'
  | 'displayName'
  | 'hostname'
  | 'grupo'
  | 'subgrupo'
  | 'lastUpdate'
  | 'version'
type SortDir = 'asc' | 'desc'

const ROW_HEIGHT = 48

function relativeTime(dateStr: string): { text: string; diffMs: number } {
  const diff = Date.now() - new Date(dateStr).getTime()
  const secs = Math.floor(diff / 1000)
  if (secs < 60) return { text: `${secs}s`, diffMs: diff }
  const mins = Math.floor(secs / 60)
  if (mins < 60) return { text: `${mins}m`, diffMs: diff }
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return { text: `${hrs}h`, diffMs: diff }
  const days = Math.floor(hrs / 24)
  return { text: `${days}d`, diffMs: diff }
}

function seenPill(diffMs: number): { dot: string; cls: string } {
  const secs = diffMs / 1000
  if (secs <= 30)
    return {
      dot: 'bg-online',
      cls: 'border-online/25 bg-online/10 text-online',
    }
  if (secs <= 300)
    return {
      dot: 'bg-warn',
      cls: 'border-warn/25 bg-warn/10 text-warn',
    }
  return {
    dot: 'bg-offline',
    cls: 'border-offline/25 bg-offline/10 text-offline',
  }
}

const COLUMNS: { key: SortKey; label: string; width: string }[] = [
  { key: 'status', label: 'Status', width: 'w-[72px] shrink-0' },
  { key: 'displayName', label: 'Nome', width: 'w-[160px] shrink-0' },
  { key: 'hostname', label: 'Hostname', width: 'w-[150px] shrink-0' },
  { key: 'grupo', label: 'Secretaria', width: 'flex-1 min-w-[150px]' },
  { key: 'subgrupo', label: 'Grupo', width: 'flex-1 min-w-[150px]' },
  { key: 'version', label: 'Versão', width: 'w-[80px] shrink-0' },
  { key: 'lastUpdate', label: 'Visto', width: 'w-[90px] shrink-0' },
]

function getSortValue(
  agent: AgentSummary,
  key: SortKey,
): string | number | boolean {
  switch (key) {
    case 'status':
      return agent.isOnline ? 0 : 1
    case 'displayName':
      return agent.displayName.toLowerCase()
    case 'hostname':
      return agent.hostname.toLowerCase()
    case 'grupo':
      return (agent.grupo || '').toLowerCase()
    case 'subgrupo':
      return (agent.subgrupo || '').toLowerCase()
    case 'lastUpdate':
      return new Date(agent.lastUpdate).getTime()
    case 'version':
      return agent.agent_version || '0.0.0'
  }
}

const filterInputClass =
  'w-full rounded border border-border bg-background px-2 py-1 font-(--font-mono) text-[11px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-primary/50'

export default function VirtualTable({
  agents,
  onSelect,
  onEdit,
}: {
  agents: AgentSummary[]
  onSelect: (id: string) => void
  onEdit: (agent: AgentSummary) => void
}) {
  const [sortKey, setSortKey] = useState<SortKey>('status')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [columnFilters, setColumnFilters] = useState({
    displayName: '',
    hostname: '',
    grupo: '',
    subgrupo: '',
  })

  const filteredAndSorted = useMemo(() => {
    let arr = [...agents]

    if (columnFilters.displayName) {
      const term = columnFilters.displayName.toLowerCase()
      arr = arr.filter((a) => a.displayName.toLowerCase().includes(term))
    }
    if (columnFilters.hostname) {
      const term = columnFilters.hostname.toLowerCase()
      arr = arr.filter((a) => a.hostname.toLowerCase().includes(term))
    }
    if (columnFilters.grupo) {
      const term = columnFilters.grupo.toLowerCase()
      arr = arr.filter((a) => (a.grupo || '').toLowerCase().includes(term))
    }
    if (columnFilters.subgrupo) {
      const term = columnFilters.subgrupo.toLowerCase()
      arr = arr.filter((a) => (a.subgrupo || '').toLowerCase().includes(term))
    }

    arr.sort((a, b) => {
      const va = getSortValue(a, sortKey)
      const vb = getSortValue(b, sortKey)
      let cmp = 0
      if (typeof va === 'string' && typeof vb === 'string')
        cmp = va.localeCompare(vb)
      else if (typeof va === 'number' && typeof vb === 'number') cmp = va - vb
      else cmp = va < vb ? -1 : va > vb ? 1 : 0
      return sortDir === 'asc' ? cmp : -cmp
    })
    return arr
  }, [agents, sortKey, sortDir, columnFilters])

  const { containerRef, onScroll, totalHeight, visibleItems } =
    useVirtualScroll({
      itemCount: filteredAndSorted.length,
      itemHeight: ROW_HEIGHT,
    })

  function handleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const updateFilter = (key: keyof typeof columnFilters, val: string) => {
    setColumnFilters((prev) => ({ ...prev, [key]: val }))
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card/40 backdrop-blur-sm">
      <div className="overflow-x-auto">
        <div className="min-w-full lg:min-w-300">
          {/* Cabeçalho */}
          <div className="flex select-none flex-col border-b border-border bg-muted/40">
            {/* Linha de ordenação */}
            <div className="flex items-center px-4">
              {COLUMNS.map((col) => (
                <button
                  type="button"
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className={`${col.width} flex items-center gap-1 px-2 py-3 text-left font-(--font-mono) text-[10px] uppercase tracking-[1.5px] transition-colors ${
                    sortKey === col.key
                      ? 'text-primary'
                      : 'text-muted-foreground/70 hover:text-foreground'
                  }`}
                >
                  {col.label}
                  {sortKey === col.key && (
                    <ChevronUpIcon
                      className={`size-3 transition-transform ${sortDir === 'desc' ? 'rotate-180' : ''}`}
                    />
                  )}
                </button>
              ))}
              <div className="w-9 shrink-0" />
            </div>

            {/* Linha de filtros por coluna */}
            <div className="flex items-center px-4 pb-2">
              <div className="w-[72px] shrink-0" />
              <div className="w-[160px] shrink-0 px-2">
                <input
                  type="text"
                  placeholder="Filtrar..."
                  className={filterInputClass}
                  value={columnFilters.displayName}
                  onChange={(e) => updateFilter('displayName', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="w-[150px] shrink-0 px-2">
                <input
                  type="text"
                  placeholder="Filtrar..."
                  className={filterInputClass}
                  value={columnFilters.hostname}
                  onChange={(e) => updateFilter('hostname', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="min-w-[150px] flex-1 px-2">
                <input
                  type="text"
                  placeholder="Filtrar..."
                  className={filterInputClass}
                  value={columnFilters.grupo}
                  onChange={(e) => updateFilter('grupo', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="min-w-[150px] flex-1 px-2">
                <input
                  type="text"
                  placeholder="Filtrar..."
                  className={filterInputClass}
                  value={columnFilters.subgrupo}
                  onChange={(e) => updateFilter('subgrupo', e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="w-[80px] shrink-0" />
              <div className="w-[90px] shrink-0" />
              <div className="w-9 shrink-0" />
            </div>
          </div>

          {/* Corpo com virtual scroll */}
          <div
            ref={containerRef}
            onScroll={onScroll}
            className="overflow-y-auto overflow-x-hidden"
            style={{
              height: `min(${filteredAndSorted.length * ROW_HEIGHT}px, calc(100vh - 280px))`,
            }}
          >
            <div style={{ height: totalHeight, position: 'relative' }}>
              {visibleItems.map(({ index, offsetTop }) => {
                const agent = filteredAndSorted[index]
                if (!agent) return null

                return (
                  <div
                    key={agent.id}
                    onClick={() => onSelect(agent.id)}
                    className={`group/row absolute left-0 right-0 flex cursor-pointer items-center border-l-2 border-l-transparent px-4 font-(--font-mono) text-[13px] transition-colors hover:border-l-primary hover:bg-primary/5 ${
                      index % 2 === 0
                        ? 'bg-transparent'
                        : 'bg-foreground/[0.015]'
                    }`}
                    style={{
                      height: ROW_HEIGHT,
                      transform: `translateY(${offsetTop}px)`,
                    }}
                  >
                    {/* Status */}
                    <div className="flex w-18 shrink-0 items-center gap-1.5 px-2">
                      <span className="relative flex h-2 w-2">
                        {agent.isOnline && (
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-online opacity-60" />
                        )}
                        <span
                          className={`relative inline-flex h-2 w-2 rounded-full ${agent.isOnline ? 'bg-online' : 'bg-offline'}`}
                        />
                      </span>
                      <span
                        className={`text-[10px] uppercase tracking-[1px] ${agent.isOnline ? 'text-online' : 'text-offline/80'}`}
                      >
                        {agent.isOnline ? 'On' : 'Off'}
                      </span>
                    </div>

                    {/* Nome */}
                    <div className="w-40 shrink-0 truncate px-2 text-[13px] font-medium text-foreground">
                      {agent.displayName}
                    </div>

                    {/* Hostname */}
                    <div className="w-37.5 shrink-0 truncate px-2 text-center text-[12px] text-muted-foreground">
                      {agent.hostname}
                    </div>

                    {/* Secretaria */}
                    <div className="min-w-37.5 flex-1 px-2 text-center">
                      {agent.grupo ? (
                        <span className="inline-flex items-center rounded-md border border-primary/25 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          {agent.grupo}
                        </span>
                      ) : (
                        <span className="text-[12px] text-muted-foreground/40">
                          —
                        </span>
                      )}
                    </div>

                    {/* Grupo */}
                    <div className="min-w-37.5 flex-1 px-2 text-center">
                      {agent.subgrupo ? (
                        <span className="inline-flex items-center rounded-md border border-border bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                          {agent.subgrupo}
                        </span>
                      ) : (
                        <span className="text-[12px] text-muted-foreground/40">
                          —
                        </span>
                      )}
                    </div>

                    {/* Versão */}
                    <div className="w-20 shrink-0 px-2">
                      <span className="inline-flex items-center rounded-sm border border-primary/20 bg-primary/10 px-1.5 py-0.5 font-(--font-mono) text-[10px] text-primary">
                        v{agent.agent_version || '0.0.0'}
                      </span>
                    </div>

                    {/* Visto */}
                    <div className="w-22.5 shrink-0 px-2">
                      {(() => {
                        const { text, diffMs } = relativeTime(agent.lastUpdate)
                        const pill = seenPill(diffMs)
                        return (
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-(--font-mono) text-[10px] tabular-nums ${pill.cls}`}
                          >
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${pill.dot}`}
                            />
                            {text}
                          </span>
                        )
                      })()}
                    </div>

                    {/* Editar */}
                    <div className="flex w-9 shrink-0 items-center justify-center">
                      <button
                        type="button"
                        title="Editar"
                        onClick={(e) => {
                          e.stopPropagation()
                          onEdit(agent)
                        }}
                        className="flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-muted-foreground opacity-0 transition-all hover:border-primary/20 hover:bg-primary/10 hover:text-primary group-hover/row:opacity-100"
                      >
                        <PencilIcon className="size-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
