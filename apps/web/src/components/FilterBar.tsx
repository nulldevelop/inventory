'use client'
import { LayoutGridIcon, ListIcon, SearchIcon } from 'lucide-react'
import { ALL_GROUPS } from '@/utils/groups'
import type { StatusFilter } from './StatsBar'

type ViewMode = 'table' | 'cards'

interface FilterBarProps {
  search: string
  onSearchChange: (val: string) => void
  secretariaFilter: string
  onSecretariaChange: (val: string) => void
  statusFilter: StatusFilter
  onStatusChange: (val: StatusFilter) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  totalCount: number
  filteredCount: number
}

const selectClass =
  'h-9 cursor-pointer appearance-none rounded-md border border-border bg-card py-2 pl-3 pr-8 font-(--font-mono) text-[12px] text-foreground outline-none transition-colors hover:border-primary/30 focus:border-primary/50'

const selectChevron = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
}

export default function FilterBar({
  search,
  onSearchChange,
  secretariaFilter,
  onSecretariaChange,
  statusFilter,
  onStatusChange,
  viewMode,
  onViewModeChange,
  totalCount,
  filteredCount,
}: FilterBarProps) {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2.5">
      {/* Busca */}
      <div className="relative min-w-40 max-w-80 flex-1">
        <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground/60" />
        <input
          className="h-9 w-full rounded-md border border-border bg-card py-2 pl-9 pr-3.5 font-(--font-mono) text-[12px] tracking-[0.3px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/50"
          type="text"
          placeholder="buscar hostname, nome ou id..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Selects */}
      <select
        value={secretariaFilter}
        onChange={(e) => onSecretariaChange(e.target.value)}
        className={`${selectClass} min-w-36`}
        style={selectChevron}
      >
        <option value="">Todas secretarias</option>
        {ALL_GROUPS.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.options.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </optgroup>
        ))}
      </select>

      <select
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
        className={`${selectClass} min-w-28`}
        style={selectChevron}
      >
        <option value="all">Todos status</option>
        <option value="online">Online</option>
        <option value="offline">Offline</option>
      </select>

      <div className="flex-1" />

      {/* Contagem */}
      <span className="font-(--font-mono) text-[11px] tabular-nums tracking-[0.5px] text-muted-foreground">
        <span className="font-semibold text-foreground">{filteredCount}</span>
        {filteredCount !== totalCount && (
          <span className="text-muted-foreground/60"> / {totalCount}</span>
        )}
      </span>

      {/* Toggle de visualização */}
      <div className="flex items-center gap-0.5 rounded-md border border-border bg-card p-0.5">
        <button
          type="button"
          onClick={() => onViewModeChange('table')}
          title="Visão tabela"
          className={`flex size-7 items-center justify-center rounded transition-colors ${
            viewMode === 'table'
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <ListIcon className="size-4" />
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange('cards')}
          title="Visão cards"
          className={`flex size-7 items-center justify-center rounded transition-colors ${
            viewMode === 'cards'
              ? 'bg-primary/15 text-primary'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <LayoutGridIcon className="size-4" />
        </button>
      </div>
    </div>
  )
}

export type { ViewMode }
