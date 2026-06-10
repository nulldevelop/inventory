'use client'
import { useEffect, useRef, useState } from 'react'
import { ALL_GROUPS } from '@/utils/groups'

const fieldClass =
  'w-full rounded-lg border border-input bg-background px-3.5 py-2.5 font-(--font-mono) text-[12px] text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/60'

const labelClass =
  'mb-2 block font-(--font-mono) text-[10px] uppercase tracking-[1.5px] text-muted-foreground'

export default function EditModal({
  open,
  agent,
  onClose,
  onSave,
}: {
  open: boolean
  agent: {
    id: string
    displayName: string
    grupo: string | null
    subgrupo: string | null
  } | null
  onClose: () => void
  onSave: (data: {
    customName: string
    grupo: string
    subgrupo: string
  }) => Promise<void>
}) {
  const [name, setName] = useState('')
  const [grupo, setGrupo] = useState('')
  const [subgrupo, setSubgrupo] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)
  const openedAtRef = useRef<number>(0)

  useEffect(() => {
    if (open && agent) {
      const now = Date.now()
      if (openedAtRef.current === 0) {
        openedAtRef.current = now
        setName(agent.displayName || '')
        setGrupo(agent.grupo || '')
        setSubgrupo(agent.subgrupo || '')
        setTimeout(() => nameRef.current?.focus(), 50)
      } else {
        const elapsed = now - openedAtRef.current
        if (elapsed > 10000) {
          setName(agent.displayName || '')
          setGrupo(agent.grupo || '')
          setSubgrupo(agent.subgrupo || '')
        }
      }
    } else if (!open) {
      openedAtRef.current = 0
    }
  }, [open, agent])

  async function handleSave() {
    const trimmed = name.trim()
    if (!trimmed) {
      nameRef.current?.focus()
      return
    }
    await onSave({ customName: trimmed, grupo, subgrupo })
  }

  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement, MouseEvent>) {
    if (e.target === e.currentTarget) onClose()
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') onClose()
  }

  return (
    // biome-ignore lint/a11y/useSemanticElements: overlay clicável para fechar o modal
    <div
      role="button"
      tabIndex={0}
      className={`fixed inset-0 z-200 flex h-full w-full cursor-default items-center justify-center border-none bg-black/60 p-0 backdrop-blur-sm transition-all duration-300 ${open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}
      onClick={handleOverlayClick}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      aria-label="Fechar modal"
    >
      <div
        className={`relative w-110 max-w-[calc(100vw-40px)] cursor-default rounded-2xl border border-border bg-popover p-7 text-popover-foreground shadow-2xl transition-all duration-300 ${open ? 'translate-y-0 scale-100' : 'translate-y-4 scale-[0.97]'}`}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
      >
        <div className="mb-6 flex items-center gap-2.5 font-(--font-mono) text-[11px] uppercase tracking-[2.5px] text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary animate-[breathe_2s_infinite]" />
          Editar Agente
        </div>

        <div className="mb-5">
          <label className={labelClass} htmlFor="modal-name">
            Nome
          </label>
          <input
            ref={nameRef}
            id="modal-name"
            className={fieldClass}
            type="text"
            placeholder="Nome exibido no dashboard"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="mb-5">
          <label className={labelClass} htmlFor="modal-grupo">
            Secretaria / Órgão
          </label>
          <select
            id="modal-grupo"
            className={`${fieldClass} [&_option]:bg-popover`}
            value={grupo}
            onChange={(e) => setGrupo(e.target.value)}
          >
            <option value="">-- Sem grupo --</option>
            {ALL_GROUPS.map((g) => (
              <optgroup key={g.label} label={g.label}>
                {g.options.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor="modal-subgrupo">
            Subgrupo{' '}
            <span className="text-[9px] normal-case tracking-normal text-muted-foreground/60">
              (opcional, ex: Bloco A, UBS Norte...)
            </span>
          </label>
          <input
            id="modal-subgrupo"
            className={fieldClass}
            type="text"
            placeholder="Subgrupo genérico"
            value={subgrupo}
            onChange={(e) => setSubgrupo(e.target.value)}
          />
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            className="rounded-lg border border-border bg-transparent px-5 py-2.5 font-(--font-mono) text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            type="button"
            className="rounded-lg border border-primary/40 bg-primary px-5 py-2.5 font-(--font-mono) text-[11px] font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            onClick={handleSave}
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  )
}
