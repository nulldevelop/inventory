# Design — Intervalos de coleta + Cadastro na instalação

**Data:** 2026-06-03
**Repositórios afetados:** `agent` (Go + WiX) e `netwath-front` (Next.js + Prisma)

## Objetivo

1. Alterar os intervalos do agente: telemetria de 10s → **8h**, auto-update de ~5min → **4h**.
2. Adicionar uma **tela de cadastro na instalação** (MSI) capturando **Nome**, **Secretaria** e **Departamento**, persistir esses dados e enviá-los junto da telemetria para que o agente já apareça cadastrado/agrupado no front.

## Contexto descoberto

- O front (`netwath-front`) já modela o conceito de Secretaria via `AgentAlias`:
  - `customName` = nome exibido no dashboard
  - `grupo` = **Secretaria** (já existe filtro "Todas secretarias" e agrupamento em `utils/groups.ts`)
  - `subgrupo` = subgrupo livre (= **Departamento**)
- Hoje esses campos são preenchidos **manualmente** pelo admin no modal "Editar Agente" (`EditModal.tsx` → `POST /api/rename`).
- `utils/groups.ts > SECRETARIAS` contém exatamente as 13 secretarias da lista do usuário; "Procuradoria" só existe como "Procuradoria Geral" em `OUTROS_ORGAOS`.
- O servidor **só seta `isOnline=true`** no ingest; **não há varredura que marque offline** (sem `vercel.json`/cron). Logo, o intervalo de 8h não quebra nada hoje, mas é um ponto de atenção futuro.
- O agente é compilado **amd64** (64-bit) → leitura de registro deve usar a visão nativa 64-bit.

## Decisões (acordadas com o usuário)

| Tema | Decisão |
|---|---|
| Telemetria | 8h (default); env `AGENT_INTERVAL_SECONDS` continua sobrepondo |
| Auto-update | 4h, em ticker próprio |
| Comandos remotos | ~60s, em ticker próprio (desacoplado da telemetria) |
| Persistência do cadastro | Registro do Windows `HKLM` (sobrevive a updates) |
| Campos obrigatórios | Nome, Secretaria e Departamento — todos obrigatórios |
| Nome (usuário) | Vira o `customName` (displayName) |
| Integração com cadastro manual | Agente popula `AgentAlias` **só na 1ª vez** (se não existir); edições manuais do admin têm prioridade e não são sobrescritas |
| Procuradoria | Adicionar "Procuradoria" ao set `SECRETARIAS` do front e à lista do instalador |

## Escopo detalhado

### A. Agente Go — intervalos (`agent`)

**`internal/config/config.go`**
- Default de `Interval`: `10` → `28800` segundos (8h). `AGENT_INTERVAL_SECONDS` mantém override.
- Novo campo `UpdateInterval time.Duration` (default 4h), opcionalmente sobreposto por `AGENT_UPDATE_INTERVAL_SECONDS`.
- Novo campo `CommandInterval time.Duration` (default 60s), opcionalmente sobreposto por `AGENT_COMMAND_INTERVAL_SECONDS`.

**`internal/service/service.go`**
- Remover a lógica de `tickCount`/`updateEvery`.
- Usar **3 tickers independentes** no `select`:
  - telemetria (`m.config.Interval`, 8h) → `collectAndSend()`
  - comandos (`m.config.CommandInterval`, 60s) → `fetchAndExecute()`
  - update (`m.config.UpdateInterval`, 4h) → `checkForUpdate()`
- Manter a coleta/checagem inicial no start.

### B. Agente Go — leitura do cadastro

**`internal/metrics/collector.go`** (ou novo arquivo `registration.go` no mesmo pacote)
- `getRegistration()` lê `HKLM\SOFTWARE\NetWatch\Agent` (visão 64-bit) via `golang.org/x/sys/windows/registry`:
  - `UserName`, `Secretaria`, `Departamento` (REG_SZ). Valores ausentes → string vazia.
- Novo tipo e campo no `Payload`:
  ```go
  type Registration struct {
      UserName    string `json:"user_name"`
      Secretaria  string `json:"secretaria"`
      Departamento string `json:"departamento"`
  }
  // Payload:
  Registration Registration `json:"registration"`
  ```
- Preenchido a cada `Collect()` (leitura de registro é barata).

### C. Instalador WiX (`agent/wix/agent.wxs` + `scripts/build.ps1`)

- `Property INTERVAL` default `30` → `28800`.
- Propriedades públicas (uppercase) para o cadastro: `REG_USERNAME`, `REG_SECRETARIA`, `REG_DEPARTAMENTO`.
- **RegistrySearch / AppSearch**: cada propriedade lê o valor existente em `HKLM\SOFTWARE\NetWatch\Agent` no início da sessão (para que o `MajorUpgrade` silencioso regrave os mesmos valores).
- **Componente de registro** (`Win64="yes"`) grava os 3 valores em `HKLM\SOFTWARE\NetWatch\Agent` a partir das propriedades.
- **UI custom**: diálogo `CadastroDlg` exibido **antes** da instalação, apenas em instalação interativa (full UI). Updates silenciosos (`msiexec /quiet`) não exibem UI; os valores vêm do AppSearch.
  - Controles: `Edit` (Nome → `REG_USERNAME`), `ComboBox` (Secretaria → `REG_SECRETARIA`, 14 itens), `Edit` (Departamento → `REG_DEPARTAMENTO`).
  - Botão de avanço desabilitado enquanto qualquer um dos 3 estiver vazio (condições `Control`/`Publish`).
- Sequência de UI mínima própria (CadastroDlg → ProgressDlg → ExitDlg) ou baseada em `WixUI_Minimal` com `CadastroDlg` inserido. O build já linka `-ext WixUIExtension`.

**Lista de secretarias (ComboBox, valores exatos):**
Administração, Cultura, Desenvolvimento Econômico, Desenvolvimento Social, Desenvolvimento Sustentável, Educação, Governo e Assuntos Jurídicos, Infraestrutura, Mulher e Igualdade Racial, Ordem Pública e Segurança, Saúde, Tecnologia da Informação, Urbanismo, Procuradoria.

### D. Backend (`netwath-front`)

**`src/app/api/ingest/route.ts`**
- Ler `body.registration` (`user_name`, `secretaria`, `departamento`).
- Após o upsert do `Agent`, se houver `registration` com pelo menos `user_name` e `secretaria` **e não existir `AgentAlias`** para o `serialNumber`:
  - `prisma.agentAlias.create({ serialNumber, customName: user_name, grupo: secretaria, subgrupo: departamento || null })`.
  - Usar `create` protegido (ex.: checar existência antes, ou `upsert` com `update: {}` vazio) para **nunca sobrescrever** alias existente.
- Não bloquear o fluxo de ingest em caso de erro (best-effort, `.catch`).

**`src/utils/groups.ts`**
- Adicionar `'Procuradoria'` ao set `SECRETARIAS`.

**Front (UI):** sem mudanças — `customName`/`grupo`/`subgrupo` já são exibidos (ListView/VirtualTable/DetailView) e filtráveis (FilterBar).

**Prisma:** sem mudança de schema.

## Fluxo de dados

```
[Instalação manual] → CadastroDlg grava HKLM\SOFTWARE\NetWatch\Agent
        │
        ▼
[Agente] getRegistration() lê registro → payload.registration → POST /api/ingest
        │
        ▼
[Backend] upsert Agent; se não há AgentAlias → cria (customName/grupo/subgrupo)
        │
        ▼
[Front] exibe displayName + filtra por Secretaria (sem alterações de UI)

[Auto-update /quiet] → AppSearch lê valores atuais do registro → componente regrava → dados preservados
```

## Tratamento de erros / edge cases

- Registro ausente (instalação antiga sem cadastro): `registration` vai com strings vazias; backend não cria alias (faltam campos obrigatórios) — comportamento atual preservado.
- Alias já existente (criado por admin ou por cadastro anterior): nunca sobrescrito.
- Upgrade silencioso sem AppSearch capturando valores: mitigado pelo `RegistrySearch`.
- Erro ao criar alias no ingest: logado, não interrompe o recebimento de métricas.

## Fora de escopo

- Varredura/marcação de agentes offline no servidor.
- Edição/sincronização bidirecional entre cadastro do agente e edição manual além da regra "cria se não existe".
- Localização/i18n da tela do instalador.

## Verificação

- `go build` do agente (Windows/amd64) sem erros.
- Build do MSI (`scripts/build.ps1`) gera instalador com a tela.
- Instalação manual exibe a tela, exige os 3 campos e grava o registro.
- `msiexec /quiet` (simulando auto-update) preserva os valores do registro.
- Payload de telemetria contém o bloco `registration`.
- `/api/ingest` cria `AgentAlias` na 1ª vez e não sobrescreve nas seguintes.
- Front lista o agente com displayName e filtra pela secretaria.
