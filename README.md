# Inventory

> Monorepo de inventário e monitoramento de hardware Windows: agente em Go que roda como serviço no endpoint e dashboard Next.js com alertas de mudança de hardware, comandos remotos e exportação de relatórios.

| | |
|---|---|
| **Tipo** | Projeto próprio · monorepo (agente Go + dashboard web) |
| **Meu papel** | Design e desenvolvimento completos |

## Sobre o projeto

Parques de máquinas Windows em órgãos públicos e empresas precisam de um inventário confiável de hardware (CPU, memória, discos, GPUs, rede, BIOS) sem depender de varreduras manuais. O **Inventory** resolve isso com um agente Windows (serviço + MSI) que coleta o inventário completo, envia ao backend a cada 8 horas e recebe de volta comandos remotos (bloquear/reiniciar/desligar) e atualizações automáticas do próprio agente.

O público-alvo são equipes de TI e gestores de Secretarias/Departamentos: o dashboard agrupa máquinas por órgão, exibe estado, detalhes por equipamento e alertas quando o hardware muda (baseline persistente no banco).

O diferencial técnico é o modelo de **snapshot de inventário** (telemetria a cada 8h, não métricas em tempo real) com diff de hardware por fingerprint serial contra o `rawJson` persistido — sobrevive a restarts do servidor — e pipeline de auto-update do agente via MSI no S3, registrado na API com versionamento.

## Funcionalidades

- [x] Agente Windows (Go) como serviço ou console: coleta CPU, slots de RAM, discos, GPUs, rede, BIOS, placa-mãe, status do Windows Defender, ID do AnyDesk e dados de cadastro (registro no Registry `HKLM\SOFTWARE\NetWatch\Agent`).
- [x] Envio de telemetria via `POST /api/ingest` com Bearer token, retry com backoff (3 tentativas).
- [x] Dashboard web (pt-BR, tema escuro): tabela virtualizada paginada, modo lista/cards, modo TV, busca, filtros por Secretaria e status, KPIs.
- [x] Detalhe por máquina: sistema, CPU, RAM, GPU, BIOS, rede, armazenamento e histórico de mudanças de hardware.
- [x] Alertas de mudança de hardware (componente, campo, valor antigo/novo) com painel e sino.
- [x] Comandos remotos: bloquear, reiniciar e desligar máquinas (fila `PendingCommand` por hostname).
- [x] Auto-update do agente: checagem a cada 4h, download do MSI no S3 e instalação silenciosa via `msiexec /quiet`.
- [x] Gestão de apelidos por máquina (nome custom, Secretaria, Departamento) sem sobrescrever edições manuais.
- [x] Exportação de relatório CSV e PDF (React PDF no client).
- [x] Autenticação Better Auth (e-mail/senha) com gate de sessão em todas as rotas de painel.
- [ ] Detecção de máquina offline (hoje o servidor só marca `isOnline=true`; ficou fora de escopo do modelo de inventário).
- [ ] Página `/register` (linkada no login, mas rota ainda não existe — o endpoint de sign-up existe no servidor).
- [ ] Alertas por limiar de CPU/RAM/disco (painel renderiza os tipos, a API ainda só emite alertas de hardware).

> O projeto foi pivotado de um produto de monitoramento ("NetWatch") para inventário; restos do pivot (modelo `MetricSnapshot`, campos `cpuUsagePercent`/`cpuTemp`) permanecem no schema sem uso.

## Stack

- **Frontend:** Next.js 16.2.1 (App Router, React Compiler), React 19.2.4, Tailwind CSS 4, shadcn/ui + Radix, lucide-react, sonner, next-themes, @react-pdf/renderer, fontes DM Sans/IBM Plex Mono.
- **Backend:** API routes do próprio Next.js (front + back num deploy), Better Auth 1.6 (e-mail/senha), agente Go 1.26+ (gopsutil, WMI, go-ole, serviço Windows via `golang.org/x/sys`).
- **Banco de dados:** MariaDB/MySQL com Prisma ORM 7 (driver adapter `@prisma/adapter-mariadb`, cliente gerado em `apps/web/src/generated/prisma`).
- **Infraestrutura:** sem Docker/CI no repositório; MSI empacotado com WiX Toolset v3.14; releases do agente publicados manualmente em bucket S3 (`netwatch-agent`) e registrados via `POST /api/release`; produção referenciada em `netwatch.nullphr.com.br`.
- **Testes:** nenhum framework configurado.
- **Qualidade de código:** Biome 2.2 (lint/format), TypeScript 5, monorepo pnpm (workspace `apps/web`; o agente é um módulo Go separado).

## Arquitetura

Monorepo com duas entregas:

```
apps/agent/   # módulo Go windows-hw-agent — coleta, envio, comandos, auto-update, MSI WiX
apps/web/     # Next.js 16 — páginas (/ , /login , /agents/[id]) + 14 rotas de API
```

Fluxo de dados:

1. Instalação do MSI abre diálogo de cadastro (Nome/Secretaria/Departamento → Registry) e grava env vars de máquina (`AGENT_API_URL`, `AGENT_API_TOKEN`, `AGENT_INTERVAL_SECONDS`).
2. Agente coleta inventário (gopsutil + PowerShell CIM + Registry) e envia `POST /api/ingest` com Bearer.
3. Backend valida o token, faz diff de hardware contra o `rawJson` persistido, upsert do `Agent`, cria `AgentAlias` (só se ausente) e registra mudanças em `HardwareChangeLog`.
4. Frontend faz poll de `/api/metrics` e `/api/alerts` a cada 10s (`usePoll`, rotas `force-dynamic`).
5. Comando remoto: UI `POST /api/command/[id]` → fila → agente consome em `GET /api/commands?hostname=` e executa `shutdown`/`LockWorkStation`.
6. Atualização: `POST /api/release` registra versão → agente compara com `GET /api/update?version=`, baixa o MSI do S3 e instala silenciosamente.

Decisões importantes:

- **Inventário, não monitoramento contínuo**: tickers independentes (telemetria 8h / comandos 60s / update 4h); métricas em tempo real ficaram fora de escopo.
- **Baseline de hardware = `rawJson` no banco** (não cache em memória), com throttle de escrita (1/60s por serial, exceto em mudança de hardware).
- **Aliases editados à mão nunca sobrescritos** pelo cadastro do instalador.
- **Rotas de agent autenticadas por Bearer** (`/api/ingest`, `/api/commands`, `/api/update`, `/api/release`); demais rotas exigem sessão (`src/proxy.ts`).
- **`rawJson` completo + colunas JSON** (`osJson`, `memoryJson`, `disksJson`) para consultas do dashboard sem perder o payload original do diff.

## Pré-requisitos

- Node.js 20+ e pnpm 9+ (workspace) — para `apps/web`
- Go 1.26+ — para `apps/agent`
- Windows + PowerShell (build do agente e scripts de release)
- WiX Toolset v3.14 (caminho esperado: `C:\Program Files (x86)\WiX Toolset v3.14\bin`) — para gerar o MSI
- Servidor MariaDB/MySQL acessível via `DATABASE_URL`
- AWS S3 (bucket de releases do agente) — apenas para publicar auto-update

## Como rodar

### 1. Clone o repositório

```bash
git clone https://github.com/nulldevelop/inventory.git
cd inventory
```

### 2. Instale as dependências

```bash
pnpm install
```

O `postinstall` já roda `prisma generate` em `apps/web`.

### 3. Configure as variáveis de ambiente

Crie `apps/web/.env` e preencha os valores necessários (não há `.env.example` no repositório).

```env
DATABASE_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
NEXT_PUBLIC_BETTER_AUTH_URL=
AGENT_TOKEN=
```

Inclua somente as variáveis que o projeto realmente utiliza. Nunca publique credenciais reais.

Observações:

- `AGENT_TOKEN` é o Bearer usado pelo agente nas rotas de ingestão/comandos/update (atenção: o código tem fallback `'default_token'` se não definido — troque em qualquer ambiente real).
- As variáveis `AGENT_API_URL`, `AGENT_API_TOKEN`, `AGENT_INTERVAL_SECONDS`, `AGENT_COMMAND_INTERVAL_SECONDS` e `AGENT_UPDATE_INTERVAL_SECONDS` pertencem ao lado do agente (env do serviço/instalação), não ao `.env` do web.
- O agente lê também `AGENT_COMMANDS_URL` e `AGENT_UPDATE_URL` (derivadas por padrão).

### 4. Prepare o banco de dados

```bash
pnpm --filter inventory-web exec prisma migrate dev
```

> Não existe seed. Em produção use `prisma migrate deploy`.

### 5. Inicie a aplicação

```bash
pnpm web:dev
```

O dashboard sobe em `http://localhost:3000`. Cadastre um usuário (endpoint `POST /api/sign-up/email`; a página `/register` ainda não existe) e faça login em `/login`.

Para o agente em modo console durante desenvolvimento:

```bash
pnpm agent:run
```

> Comandos úteis: `pnpm web:build`, `pnpm web:start`, `pnpm web:lint`, `pnpm --filter inventory-web format`, `pnpm agent:build` (gera `inventory-agent.exe` e `AgentInstall/InventoryAgent.msi`), `powershell -File apps/agent/scripts/release.ps1 -Version 1.2.3` (release S3 + API).

## Testes

Ainda não há testes automatizados no projeto (nenhum framework instalado, nenhum script de teste em Go ou TypeScript). As áreas que mais se beneficiariam primeiro são: diff de hardware no `/api/ingest`, fila de comandos, client HTTP do agente (retry/backoff) e filtros/paginação do `/api/metrics`.

## Decisões técnicas

- **Modelo de snapshot a cada 8h**: reduz custo de API e reflete a natureza de inventário; comandos remotos ficam num loop próprio de 60s para latência aceitável mesmo com telemetria lenta.
- **Diff por fingerprint serial contra baseline persistida**: permite detectar troca de disco/RAM/GPU mesmo após restart do backend, gerando trilha auditável em `HardwareChangeLog`.
- **Auto-update via MSI + S3**: o agente se atualiza com `msiexec /quiet` usando MajorUpgrade do WiX, evitando ferramenta de deploy dedicada.
- **Virtual table custom** (sem lib de virtualização): a lista de máquinas renderiza grandes volumes com paginação server-side (100/página).
- **Auth de split**: agentes usam Bearer compartilhado; humanos usam Better Auth com sessão — sem misturar superfícies de ataque.
- **Monorepo parcial**: pnpm workspace só para o web; o agente permanece um módulo Go autônomo com `go.mod` próprio.

## Limitações conhecidas

- Sem detecção de offline: filtro "Offline" efetivamente nunca retorna resultados (fora de escopo deliberado no spec).
- Rota `/register` referenciada no login não existe (404); criação de usuário só via API.
- Token Bearer com fallback `'default_token'` no código e valores hardcoded em `agent.wxs`/`release.ps1` — precisa de saneamento antes de exposição em produção.
- `app.http` contém credencial de exemplo em texto plano no repositório — recomenda-se remover/sanear.
- Modelo `MetricSnapshot` e campos de uso de CPU/temperatura no schema são resíduos do pivot, sem uso.
- Sem testes, sem CI e sem Docker; empacotamento do agente depende de caminho local do WiX.
- `agent_version` no `/api/metrics` é stub (retorna valor fixo).
- Dois lockfiles pnpm (raiz + `apps/web`) — limpeza pendente.

## Contribuição

Projeto interno da Null Development; contribuições externas não são aceitas no momento. Fluxo interno: Conventional Commits, lint/format com Biome (`pnpm web:lint`, `pnpm --filter inventory-web format`). Para estender o agente, seguir o spec em `apps/agent/docs/superpowers/specs/`.

## Licença

Sem licença definida. Todos os direitos reservados.

## Autor

**Pedro Andrade** — Desenvolvedor Full Stack · [null.dev](https://nulldev.com.br) · [LinkedIn](https://linkedin.com/in/pedrodevfull) · [GitHub](https://github.com/nulldevelop)
