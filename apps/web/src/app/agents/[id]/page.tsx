'use client'
import { useParams, useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import DetailView from '@/components/DetailView'
import EditModal from '@/components/EditModal'
import Toast from '@/components/Toast'
import TopBar from '@/components/TopBar'
import { usePoll } from '@/hooks/usePoll'
import { useToast } from '@/hooks/useToast'
import type { AgentSummary } from '@/lib/types'

export default function AgentPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<AgentSummary | null>(null)
  const [modal, setModal] = useState(false)
  const { toast, showToast } = useToast()

  const fetchDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/metrics/${encodeURIComponent(id)}`)
      if (res.status === 404) {
        router.push('/')
        return
      }
      setData(await res.json())
    } catch {}
  }, [id, router])

  usePoll(fetchDetail, 10_000)

  async function sendCommand(action: string) {
    const name = data?.displayName || data?.hostname || '?'
    const labels: Record<string, string> = {
      shutdown: 'DESLIGAR',
      restart: 'REINICIAR',
      lock: 'BLOQUEAR',
    }
    const msgs: Record<string, string> = {
      shutdown: `Tem certeza que deseja DESLIGAR "${name}"?\n\nO computador sera desligado em 10 segundos.`,
      restart: `Tem certeza que deseja REINICIAR "${name}"?\n\nO computador sera reiniciado em 10 segundos.`,
      lock: `Tem certeza que deseja BLOQUEAR a tela de "${name}"?`,
    }
    if (
      !window.confirm(
        msgs[action] || `Executar ${labels[action]} em "${name}"?`,
      )
    )
      return

    try {
      const res = await fetch(`/api/command/${encodeURIComponent(id)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const json = await res.json()
      if (res.ok)
        showToast(
          `Comando ${labels[action]} enviado. Aguardando o agente...`,
          'ok',
        )
      else showToast(json.error || 'Erro ao enviar comando.', 'err')
    } catch {
      showToast('Erro de conexao.', 'err')
    }
  }

  async function handleSave({
    customName,
    grupo,
    subgrupo,
  }: {
    customName: string
    grupo: string
    subgrupo: string
  }) {
    const res = await fetch('/api/rename', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ serialNumber: id, customName, grupo, subgrupo }),
    })
    if (res.ok) {
      setModal(false)
      fetchDetail()
    } else showToast('Erro ao salvar.', 'err')
  }

  return (
    <div className="overflow-auto">
      <TopBar agentCount={0} alertCount={0} onAlertsClick={() => {}} />

      <main className="max-w-350 mx-auto px-4 sm:px-6 py-6 sm:py-8 ">
        {!data ? (
          <div className="flex flex-col items-center justify-center h-[60vh] text-text-muted">
            <div className="relative mb-6">
              <div className="w-5 h-5 rounded-full bg-accent/20 animate-ping absolute inset-0" />
              <div className="w-5 h-5 rounded-full bg-accent relative" />
            </div>
            <p className="font-(--font-mono)  text-[13px] tracking-[2.5px] uppercase">
              Conectando ao agente...
            </p>
          </div>
        ) : (
          <DetailView
            data={data}
            onBack={() => router.push('/')}
            onCommand={sendCommand}
            onEdit={() => setModal(true)}
          />
        )}
      </main>

      <EditModal
        open={modal}
        agent={
          data
            ? {
                id,
                displayName: data.displayName,
                grupo: data.grupo,
                subgrupo: data.subgrupo,
              }
            : null
        }
        onClose={() => setModal(false)}
        onSave={handleSave}
      />
      <Toast message={toast.message} type={toast.type} show={toast.show} />
    </div>
  )
}
