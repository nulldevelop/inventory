'use client'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import AlertsPanel from '@/components/AlertsPanel'
import EditModal from '@/components/EditModal'
import type { ViewMode } from '@/components/FilterBar'
import FilterBar from '@/components/FilterBar'
import ListView from '@/components/ListView'
import type { StatusFilter } from '@/components/StatsBar'
import StatsBar from '@/components/StatsBar'
import Toast from '@/components/Toast'
import TopBar from '@/components/TopBar'
import VirtualTable from '@/components/VirtualTable'
import { usePoll } from '@/hooks/usePoll'
import { useToast } from '@/hooks/useToast'
import type { AgentSummary, AlertEntry } from '@/lib/types'

export default function HomePage() {
  const router = useRouter()
  const [agents, setAgents] = useState<AgentSummary[]>([])
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    totalPages: 1,
  })
  const [alerts, setAlerts] = useState<AlertEntry[]>([])
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [secretariaFilter, setSecretariaFilter] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [tvMode, setTvMode] = useState(false)
  const listViewScrollRef = useRef<HTMLDivElement>(null)
  const [alertsOpen, setAlertsOpen] = useState(false)
  const [modal, setModal] = useState<{
    open: boolean
    agent: AgentSummary | null
  }>({ open: false, agent: null })
  const { toast, showToast } = useToast()

  const fetchAgents = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      })
      if (search) params.set('search', search)
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (secretariaFilter) params.set('grupo', secretariaFilter)

      const res = await fetch(`/api/metrics?${params}`)
      const json = await res.json()
      setAgents(json.data)
      setPagination((prev) => ({
        ...prev,
        total: json.meta.total,
        totalPages: json.meta.totalPages,
      }))
    } catch (err) {
      console.error('Erro ao buscar agentes:', err)
    }
  }, [
    search,
    pagination.page,
    pagination.limit,
    statusFilter,
    secretariaFilter,
  ])

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/alerts')
      setAlerts(await res.json())
    } catch (err) {
      console.error('Erro ao buscar alertas:', err)
    }
  }, [])

  usePoll(fetchAgents, 10_000)
  usePoll(fetchAlerts, 10_000)

  // Trigger fetch immediately when dependencies change
  useEffect(() => {
    fetchAgents()
  }, [fetchAgents])

  // Derived: filtered agents (now just agents from API, but kept for type compatibility)
  const filtered = useMemo(() => agents, [agents])

  // Alert serial set for "alert" filter if needed in future
  const _alertSerials = useMemo(
    () => new Set(alerts.map((a) => a.serial)),
    [alerts],
  )

  async function handleSave({
    customName,
    grupo,
    subgrupo,
  }: {
    customName: string
    grupo: string
    subgrupo: string
  }) {
    if (!modal.agent) return

    const res = await fetch('/api/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        serialNumber: modal.agent.id,
        customName,
        grupo,
        subgrupo,
      }),
    })

    if (res.ok) {
      setModal({ open: false, agent: null })
      fetchAgents()
    } else {
      showToast('Erro ao salvar.', 'err')
    }
  }

  const handleSelect = (id: string) =>
    router.push(`/agents/${encodeURIComponent(id)}`)
  const handleEdit = (agent: AgentSummary) => setModal({ open: true, agent })

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return
    setPagination((prev) => ({ ...prev, page: newPage }))
  }

  // Ao trocar um filtro, volta para a primeira página (evita cair numa
  // página vazia quando o conjunto de resultados encolhe).
  const handleStatusChange = (v: StatusFilter) => {
    setStatusFilter(v)
    setPagination((p) => ({ ...p, page: 1 }))
  }

  const handleSecretariaChange = (v: string) => {
    setSecretariaFilter(v)
    setPagination((p) => ({ ...p, page: 1 }))
  }

  return (
    <div className="flex flex-col relative z-10 overflow-x-auto">
      <TopBar
        agentCount={pagination.total}
        alertCount={alerts.length}
        onAlertsClick={() => setAlertsOpen((o) => !o)}
        tvMode={tvMode}
        onTvModeToggle={() => setTvMode((v) => !v)}
      />

      <main className="flex-1 flex flex-col px-5 py-4 overflow-hidden min-h-0">
        <StatsBar
          agents={agents}
          alerts={alerts}
          activeFilter={statusFilter}
          onFilterChange={handleStatusChange}
          onAlertsClick={() => setAlertsOpen((o) => !o)}
        />

        <FilterBar
          search={search}
          onSearchChange={(v) => {
            setSearch(v)
            setPagination((p) => ({ ...p, page: 1 }))
          }}
          secretariaFilter={secretariaFilter}
          onSecretariaChange={handleSecretariaChange}
          statusFilter={statusFilter}
          onStatusChange={handleStatusChange}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          totalCount={pagination.total}
          filteredCount={filtered.length}
        />

        <div className="flex-1 min-h-0">
          {viewMode === 'table' ? (
            <VirtualTable
              agents={filtered}
              onSelect={handleSelect}
              onEdit={handleEdit}
            />
          ) : (
            <div
              ref={listViewScrollRef}
              className="flex-1 overflow-y-auto rounded-xl border border-border bg-card/40 p-5"
              style={{
                height: 'calc(100vh - 240px)',
                maxHeight: 'calc(100vh - 240px)',
              }}
            >
              <ListView
                agents={filtered}
                search=""
                _onSearchChange={() => {}}
                onSelect={handleSelect}
                onEdit={handleEdit}
                tvMode={tvMode}
                scrollRef={listViewScrollRef}
              />
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {pagination.totalPages > 1 && (
          <div className="mt-4 flex items-center justify-between gap-4 border-t border-border px-1 py-2">
            <div className="font-(--font-mono) text-[11px] uppercase tracking-widest text-muted-foreground/70">
              Página <span className="text-primary">{pagination.page}</span> de{' '}
              {pagination.totalPages}
              <span className="mx-2">|</span>
              Total <span className="text-foreground">{pagination.total}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="rounded-md border border-border px-3 py-1.5 font-(--font-mono) text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
              >
                Anterior
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }).map(
                  (_, i) => {
                    let pageNum = pagination.page
                    if (pagination.page <= 3) pageNum = i + 1
                    else if (pagination.page >= pagination.totalPages - 2)
                      pageNum = pagination.totalPages - 4 + i
                    else pageNum = pagination.page - 2 + i

                    if (pageNum < 1 || pageNum > pagination.totalPages)
                      return null

                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => handlePageChange(pageNum)}
                        className={`flex h-8 w-8 items-center justify-center rounded-md font-(--font-mono) text-[11px] transition-colors ${
                          pagination.page === pageNum
                            ? 'border border-primary/40 bg-primary/15 text-primary'
                            : 'border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  },
                )}
              </div>

              <button
                type="button"
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
                className="rounded-md border border-border px-3 py-1.5 font-(--font-mono) text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </main>

      <EditModal
        open={modal.open}
        agent={modal.agent}
        onClose={() => setModal({ open: false, agent: null })}
        onSave={handleSave}
      />

      <Toast message={toast.message} type={toast.type} show={toast.show} />

      {alertsOpen && (
        <AlertsPanel alerts={alerts} onClose={() => setAlertsOpen(false)} />
      )}
    </div>
  )
}
