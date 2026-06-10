// @ts-nocheck
/** biome-ignore-all lint/suspicious/noExplicitAny: dev */
'use client'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '../ui/button'
import BiosCard from './BiosCard'
import CpuCard from './CpuCard'
import GpuCard from './GpuCard'
import HardwareHistoryCard from './HardwareHistoryCard'
import HostHeader from './HostHeader'
import NetworkCard from './NetworkCard'
import RamCard from './RamCard'
import StorageCard from './StorageCard'
import SystemCard from './SystemCard'

function CommandButton({
  label,
  icon,
  colorClass,
  hostName,
  command,
  onCommand,
}: {
  label: string
  icon: React.ReactNode
  colorClass: string
  hostName: string
  command: string
  onCommand: (cmd: string) => void
}) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-(--font-mono)  text-[11px] tracking-[0.5px] cursor-pointer border transition-all duration-300 ${colorClass}`}
        >
          {icon}
          {label}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{label} Sistema</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja {label.toUpperCase()} o sistema de &quot;
            {hostName}&quot;?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={() => onCommand(command)}>
            Confirmar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default function DetailView({
  data,
  onBack,
  onCommand,
  onEdit,
}: {
  data: any
  onBack: any
  onCommand: any
  onEdit: any
}) {
  if (!data) return null

  const hostName = data.hostname || 'Host'

  return (
    <div className="animate-[fade-in_0.3s_ease]">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <Button
          className="flex items-center gap-2.5 rounded-xl border border-border bg-card px-3 py-2 font-(--font-mono) text-[10px] tracking-[0.5px] text-muted-foreground transition-colors hover:border-primary/30 hover:bg-primary/5 hover:text-primary sm:px-4 sm:py-2.5 sm:text-[11px]"
          onClick={onBack}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <title>Voltar</title>
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span className="hidden xs:inline">Voltar</span>
        </Button>

        <div className="flex gap-2 sm:gap-2.5">
          <CommandButton
            label="Bloquear"
            command="lock"
            onCommand={onCommand}
            hostName={hostName}
            colorClass="border-primary/25 bg-primary/8 text-primary hover:bg-primary/15 hover:border-primary/50 px-2.5 sm:px-4"
            icon={
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <title>Bloquear Tela</title>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            }
          />
          <CommandButton
            label="Reiniciar"
            command="restart"
            onCommand={onCommand}
            hostName={hostName}
            colorClass="border-primary/25 bg-primary/8 text-primary hover:bg-primary/15 hover:border-primary/50 px-2.5 sm:px-4"
            icon={
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <title>Reiniciar</title>
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
            }
          />
          <CommandButton
            label="Desligar"
            command="shutdown"
            onCommand={onCommand}
            hostName={hostName}
            colorClass="border-destructive/25 bg-destructive/8 text-destructive hover:bg-destructive/15 hover:border-destructive/50 px-2.5 sm:px-4"
            icon={
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <title>Desligar</title>
                <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                <line x1="12" y1="2" x2="12" y2="12" />
              </svg>
            }
          />
        </div>
      </div>

      <HostHeader data={data} onEdit={onEdit} />

      <div className="flex flex-col gap-4 w-full">
        {/* Identidade + Processador */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start w-full">
          <SystemCard data={data} />
          <CpuCard data={data} />
        </div>

        {/* Memória + GPU */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start w-full">
          <RamCard data={data} />
          <GpuCard data={data} />
        </div>

        {/* Firmware + Rede */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start w-full">
          <BiosCard data={data} />
          <NetworkCard data={data} />
        </div>

        {/* Armazenamento (largura total) */}
        <StorageCard data={data} />

        {/* Histórico de hardware (largura total) */}
        <HardwareHistoryCard serialNumber={data.id} />
      </div>
    </div>
  )
}
