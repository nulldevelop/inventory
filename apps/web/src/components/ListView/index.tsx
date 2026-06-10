'use client'
import { ChevronRightIcon, SearchIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { AgentSummary } from '@/lib/types'
import { CATEGORY_ORDER, groupAgents } from '@/utils/groups'
import AgentCard from './AgentCard'

function CollapsibleGroup({
  label,
  count,
  onlineCount,
  children,
}: {
  label: string | null
  count: number
  onlineCount: number
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(true)
  const offlineCount = count - onlineCount

  return (
    <div className="mb-3">
      <button
        type="button"
        className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5 text-left font-sans text-[0.85em] font-medium tracking-[0.2px] text-foreground transition-colors hover:border-primary/25"
        onClick={() => setOpen((o) => !o)}
      >
        <ChevronRightIcon
          className={`size-3 shrink-0 text-primary/60 transition-transform ${open ? 'rotate-90' : ''}`}
        />

        <span className="flex-1 truncate">
          <span className="inline-flex items-center rounded-lg border border-primary/25 bg-primary/10 px-3 py-1.5 text-[13px] font-semibold text-primary">
            {label}
          </span>
        </span>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-online/25 bg-online/10 px-2.5 py-1 font-(--font-mono) text-[10px] font-medium tabular-nums text-online">
            <span className="h-1.5 w-1.5 rounded-full bg-online" />
            {onlineCount}
          </span>
          {offlineCount > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-offline/25 bg-offline/10 px-2.5 py-1 font-(--font-mono) text-[10px] font-medium tabular-nums text-offline">
              <span className="h-1.5 w-1.5 rounded-full bg-offline" />
              {offlineCount}
            </span>
          )}
        </div>

        <span className="flex h-6 min-w-6 items-center justify-center rounded-md border border-primary/30 bg-primary/15 px-2 font-(--font-mono) text-[11px] font-medium text-primary">
          {count}
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ${open ? 'pt-3 opacity-100' : 'max-h-0 pt-0 opacity-0'}`}
      >
        {children}
      </div>
    </div>
  )
}

function SubgroupBlock({
  label,
  agents,
  onSelect,
  onEdit,
  tvMode,
}: {
  label: string | null
  agents: AgentSummary[]
  onSelect: (id: string) => void
  onEdit: (agent: AgentSummary) => void
  tvMode?: boolean
}) {
  return (
    <div className="mb-4">
      {label && (
        <div className="mb-3 flex items-center gap-2.5 pl-1">
          <span className="inline-flex items-center rounded-lg border border-border bg-muted px-3 py-1.5 text-[12px] font-semibold text-muted-foreground">
            {label}
          </span>
          <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
          <span className="text-[10px] tabular-nums text-muted-foreground">
            {agents.length} agente{agents.length !== 1 ? 's' : ''}
          </span>
        </div>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(260px,1fr))]">
        {agents.map((a) => (
          <AgentCard
            key={a.id}
            agent={a}
            onSelect={onSelect}
            onEdit={onEdit}
            tvMode={tvMode}
          />
        ))}
      </div>
    </div>
  )
}

function GroupSection({
  category,
  gruposMap,
  onSelect,
  onEdit,
  tvMode,
}: {
  category: string
  gruposMap: Record<string, Record<string, AgentSummary[]>>
  onSelect: (id: string) => void
  onEdit: (agent: AgentSummary) => void
  tvMode?: boolean
}) {
  const entries = Object.entries(gruposMap)

  if (category === '__none__') {
    const allAgents = entries.flatMap(([, s]) => Object.values(s).flat())
    const total = allAgents.length
    const onlineCount = allAgents.filter((a) => a.isOnline).length
    return (
      <div className="mb-6">
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
          <span className="inline-flex items-center rounded-lg border border-warn/30 bg-warn/10 px-3 py-1.5 text-[12px] font-semibold text-warn">
            Sem Secretaria / Órgão
          </span>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 font-(--font-mono) text-[9px] tabular-nums text-online">
              <span className="h-1 w-1 rounded-full bg-online" />
              {onlineCount}
            </span>
            <span className="text-[9px] text-muted-foreground/40">/</span>
            <span className="font-(--font-mono) text-[9px] tabular-nums text-muted-foreground">
              {total}
            </span>
          </div>
        </div>
        {entries.map(([grp, subsMap]) => {
          const grupoLabel = grp === '__sem_grupo__' ? null : grp
          const subBlocks = Object.entries(subsMap).map(([sub, list]) => (
            <SubgroupBlock
              key={sub}
              label={sub === '__sem_sub__' ? null : sub}
              agents={list}
              onSelect={onSelect}
              onEdit={onEdit}
              tvMode={tvMode}
            />
          ))
          if (grupoLabel) {
            return (
              <div key={grp} className="mb-4 pl-2">
                <div className="mb-3 flex items-center gap-2.5">
                  <span className="inline-flex items-center rounded-lg border border-primary/25 bg-primary/10 px-3 py-1.5 text-[12px] font-semibold text-primary">
                    {grupoLabel}
                  </span>
                  <span className="h-px flex-1 bg-gradient-to-r from-border to-transparent" />
                </div>
                {subBlocks}
              </div>
            )
          }
          return <div key={grp}>{subBlocks}</div>
        })}
      </div>
    )
  }

  return (
    <div className="mb-6">
      <div className="mb-2 pl-1 font-(--font-mono) text-[9px] uppercase tracking-[3px] text-primary/40">
        {category}
      </div>
      {entries.map(([grp, subsMap]) => {
        const grupoLabel = grp === '__sem_grupo__' ? category : grp
        const allInGroup = Object.values(subsMap).flat()
        const count = allInGroup.length
        const onlineCount = allInGroup.filter((a) => a.isOnline).length
        const subBlocks = Object.entries(subsMap).map(([sub, list]) => (
          <SubgroupBlock
            key={sub}
            label={sub === '__sem_sub__' ? null : sub}
            agents={list}
            onSelect={onSelect}
            onEdit={onEdit}
            tvMode={tvMode}
          />
        ))
        return (
          <CollapsibleGroup
            key={grp}
            label={grupoLabel}
            count={count}
            onlineCount={onlineCount}
          >
            {subBlocks}
          </CollapsibleGroup>
        )
      })}
    </div>
  )
}

export default function ListView({
  agents,
  search,
  _onSearchChange,
  onSelect,
  onEdit,
  tvMode,
  scrollRef,
}: {
  agents: AgentSummary[]
  search: string
  _onSearchChange: (val: string) => void
  onSelect: (id: string) => void
  onEdit: (agent: AgentSummary) => void
  tvMode?: boolean
  scrollRef?: React.RefObject<HTMLDivElement | null>
}) {
  const term = search.toLowerCase()
  const filtered = term
    ? agents.filter((a) =>
        (a.displayName + a.hostname + a.id).toLowerCase().includes(term),
      )
    : agents

  const grouped = groupAgents(filtered)

  useEffect(() => {
    if (!tvMode) return

    const container = scrollRef?.current
    if (!container) return

    const timer = setInterval(() => {
      const maxScroll = container.scrollHeight - container.clientHeight
      if (maxScroll <= 0) return
      container.scrollTop += 1
      if (container.scrollTop >= maxScroll) {
        container.scrollTop = 0
      }
    }, 0)

    return () => clearInterval(timer)
  }, [tvMode, scrollRef])

  const sortedCats = Object.keys(grouped).sort((a, b) => {
    const ia = CATEGORY_ORDER.indexOf(a)
    const ib = CATEGORY_ORDER.indexOf(b)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })

  return (
    <div>
      {/* Faixa de resumo */}
      <div className="mb-4 flex items-center justify-between px-1">
        <span className="flex items-center gap-2.5 font-(--font-mono) text-[10px] uppercase tracking-[1.5px] text-muted-foreground">
          <span className="text-[12px] font-semibold text-foreground">
            {agents.length}
          </span>
          agente{agents.length !== 1 ? 's' : ''}
          <span className="mx-1 text-muted-foreground/30">|</span>
          <span className="text-online">
            {agents.filter((a) => a.isOnline).length}
          </span>
          <span className="text-muted-foreground/60">on</span>
          <span className="text-offline">
            {agents.filter((a) => !a.isOnline).length}
          </span>
          <span className="text-muted-foreground/60">off</span>
        </span>
      </div>

      {filtered.length === 0 ? (
        <div className="px-5 py-16 text-center text-muted-foreground">
          <SearchIcon className="mx-auto mb-4 size-10 text-primary/20" />
          <p className="font-(--font-mono) text-[0.8em] tracking-[0.5px]">
            {agents.length === 0
              ? 'Aguardando agentes na rede...'
              : 'Nenhum agente encontrado.'}
          </p>
        </div>
      ) : (
        sortedCats.map((cat) => (
          <GroupSection
            key={cat}
            category={cat}
            gruposMap={grouped[cat]}
            onSelect={onSelect}
            onEdit={onEdit}
            tvMode={tvMode}
          />
        ))
      )}
    </div>
  )
}
