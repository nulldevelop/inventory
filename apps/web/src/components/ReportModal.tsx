'use client'

import { pdf } from '@react-pdf/renderer'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ReportPDF } from './ReportPDF'
import { Button } from './ui/button'

type ReportFilters = {
  grupo: string
  subgrupo: string
  minRam: string
  maxRam: string
  cpuFilter: string
  diskType: string
}

const emptyFilters: ReportFilters = {
  grupo: '',
  subgrupo: '',
  minRam: '',
  maxRam: '',
  cpuFilter: '',
  diskType: '',
}

interface ReportModalProps {
  open: boolean
  onClose: () => void
}

export function ReportModal({ open, onClose }: ReportModalProps) {
  const [filters, setFilters] = useState<ReportFilters>(emptyFilters)
  const [grupos, setGrupos] = useState<string[]>([])
  const [subgrupos, setSubgrupos] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)

  const fetchOptions = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/metrics?page=1&limit=10000')
      const json = await res.json()
      // /api/metrics retorna { data, meta } — não um array.
      const agents = Array.isArray(json) ? json : (json?.data ?? [])
      const grupoSet = new Set<string>()
      const subgrupoSet = new Set<string>()
      for (const a of agents) {
        if (a.grupo) grupoSet.add(a.grupo)
        if (a.subgrupo) subgrupoSet.add(a.subgrupo)
      }
      setGrupos(Array.from(grupoSet).sort())
      setSubgrupos(Array.from(subgrupoSet).sort())
    } catch {
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (open) {
      dialogRef.current?.showModal()
      fetchOptions()
    } else {
      dialogRef.current?.close()
    }
  }, [open, fetchOptions])

  const handleExport = async () => {
    setExporting(true)
    const params = new URLSearchParams()
    if (filters.grupo) params.set('grupo', filters.grupo)
    if (filters.subgrupo) params.set('subgrupo', filters.subgrupo)
    if (filters.minRam) params.set('minRam', filters.minRam)
    if (filters.maxRam) params.set('maxRam', filters.maxRam)
    if (filters.cpuFilter) params.set('cpuFilter', filters.cpuFilter)
    if (filters.diskType) params.set('diskType', filters.diskType)

    window.open(`/api/report?${params.toString()}`, '_blank')
    setExporting(false)
    onClose()
  }

  const handleExportPDF = async () => {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      if (filters.grupo) params.set('grupo', filters.grupo)
      if (filters.subgrupo) params.set('subgrupo', filters.subgrupo)
      if (filters.minRam) params.set('minRam', filters.minRam)
      if (filters.maxRam) params.set('maxRam', filters.maxRam)
      if (filters.cpuFilter) params.set('cpuFilter', filters.cpuFilter)
      if (filters.diskType) params.set('diskType', filters.diskType)

      const res = await fetch(`/api/report-pdf?${params.toString()}`)
      const data = await res.json()

      const blob = await pdf(<ReportPDF data={data} />).toBlob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `relatorio_inventario_${new Date().toISOString().split('T')[0]}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Erro ao gerar PDF:', err)
    } finally {
      setExporting(false)
      onClose()
    }
  }

  const handleClear = () => setFilters(emptyFilters)

  if (!open) return null

  return (
    <dialog
      ref={dialogRef}
      className="backdrop:bg-black/60 bg-transparent p-0 m-auto"
      onClose={onClose}
    >
      <div className="bg-surface border border-border rounded-2xl p-6 w-120 max-w-[90vw] shadow-2xl">
        <h2 className="text-lg  text-text mb-4">Exportar Relatório</h2>

        {loading ? (
          <div className="text-text-muted text-center py-8">Carregando...</div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  htmlFor="report-secretaria"
                  className="text-sm text-text-dim"
                >
                  Secretaria
                </label>
                <select
                  id="report-secretaria"
                  className="w-full h-9 bg-bg border border-border rounded-lg px-3 text-text text-sm"
                  value={filters.grupo}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      grupo: e.target.value,
                      subgrupo: '',
                    })
                  }
                >
                  <option value="">Todas</option>
                  {grupos.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="report-setor" className="text-sm text-text-dim">
                  Setor/Departamento
                </label>
                <select
                  id="report-setor"
                  className="w-full h-9 bg-bg border border-border rounded-lg px-3 text-text text-sm"
                  value={filters.subgrupo}
                  onChange={(e) =>
                    setFilters({ ...filters, subgrupo: e.target.value })
                  }
                >
                  <option value="">Todos</option>
                  {subgrupos.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  htmlFor="report-min-ram"
                  className="text-sm text-text-dim"
                >
                  RAM Mínima (GB)
                </label>
                <input
                  id="report-min-ram"
                  type="number"
                  placeholder="Ex: 4"
                  className="w-full h-9 bg-bg border border-border rounded-lg px-3 text-text text-sm"
                  value={filters.minRam}
                  onChange={(e) =>
                    setFilters({ ...filters, minRam: e.target.value })
                  }
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="report-max-ram"
                  className="text-sm text-text-dim"
                >
                  RAM Máxima (GB)
                </label>
                <input
                  id="report-max-ram"
                  type="number"
                  placeholder="Ex: 16"
                  className="w-full h-9 bg-bg border border-border rounded-lg px-3 text-text text-sm"
                  value={filters.maxRam}
                  onChange={(e) =>
                    setFilters({ ...filters, maxRam: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="report-cpu" className="text-sm text-text-dim">
                Tipo de Processador
              </label>
              <select
                id="report-cpu"
                className="w-full h-9 bg-bg border border-border rounded-lg px-3 text-text text-sm"
                value={filters.cpuFilter}
                onChange={(e) =>
                  setFilters({ ...filters, cpuFilter: e.target.value })
                }
              >
                <option value="">Todos</option>
                <option value="i3-i5">i3 ou i5 (baixo desempenho)</option>
                <option value="i7-baixo">
                  i7 até 5ª geração (baixo desempenho)
                </option>
                <option value="i7-alto">i7 6ª geração+ (bom desempenho)</option>
                <option value="i9">i9</option>
                <option value="outros">Outros/AMD</option>
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="report-disk" className="text-sm text-text-dim">
                Tipo de Disco
              </label>
              <select
                id="report-disk"
                className="w-full h-9 bg-bg border border-border rounded-lg px-3 text-text text-sm"
                value={filters.diskType}
                onChange={(e) =>
                  setFilters({ ...filters, diskType: e.target.value })
                }
              >
                <option value="">Todos</option>
                <option value="ssd">SSD/NVMe</option>
                <option value="hdd">HDD (mecânico)</option>
              </select>
            </div>
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <Button
            type="button"
            onClick={handleClear}
            className="rounded-lg px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Limpar
          </Button>
          <Button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border bg-muted px-4 py-2 text-sm text-foreground hover:bg-secondary"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleExportPDF}
            disabled={exporting || loading}
            className="rounded-lg border border-destructive/30 bg-destructive/15 px-4 py-2 text-sm font-medium text-destructive hover:bg-destructive/25 disabled:opacity-50"
          >
            {exporting ? 'Gerando...' : 'Exportar PDF'}
          </Button>
          <Button
            type="button"
            onClick={handleExport}
            disabled={exporting || loading}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {exporting ? 'Exportando...' : 'Exportar CSV'}
          </Button>
        </div>
      </div>
    </dialog>
  )
}
