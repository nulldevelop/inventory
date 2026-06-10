# inventory

Monorepo do projeto de inventário/monitoramento de hardware. Reúne o agente e a
aplicação web num único repositório.

## Estrutura

```
inventory/
├── apps/
│   ├── agent/   # Agente Windows de hardware — Go (módulo windows-hw-agent)
│   └── web/     # Aplicação web — Next.js (front-end + back-end/API + Prisma)
├── docs/        # Documentação do monorepo
├── package.json # Scripts agregados do workspace
└── pnpm-workspace.yaml
```

> **Sobre front × back:** `apps/web` é um app Next.js, que por natureza junta
> front-end e back-end. As páginas/UI ficam em `apps/web/src/app/*` e o back-end
> (rotas de API + Prisma) em `apps/web/src/app/api/*` e `apps/web/prisma/`.

## apps/web (Next.js)

Requer **pnpm** e Node 20+.

```bash
pnpm install            # instala deps (roda prisma generate via postinstall)
pnpm web:dev            # ambiente de desenvolvimento
pnpm web:build          # build de produção
pnpm web:start          # serve o build
```

Configurar o arquivo `apps/web/.env` (banco MariaDB, auth, etc.) antes de subir.

## apps/agent (Go)

Requer **Go 1.26+**.

```bash
pnpm agent:run          # executa o agente
pnpm agent:build        # compila apps/agent/agent.exe
```

O instalador WiX/MSI fica em `apps/agent/wix`.
