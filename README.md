# Agendamento Frontend

Frontend em React + Vite para autenticação, gestão de serviços, agenda do prestador e solicitações de agendamento.

## Arquitetura

O projeto foi reorganizado para seguir a base descrita em [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md):

```text
src/
├── core/
│   ├── http/                # cliente HTTP, request helper e tratamento de erros
│   ├── router/              # rotas públicas, protegidas e guards
│   └── store/               # estado global de sessão/autenticação
├── modules/
│   ├── auth/                # login e cadastro
│   ├── appointments/        # solicitações e histórico de agendamentos
│   ├── dashboard/           # páginas por perfil
│   ├── schedules/           # agenda do prestador
│   └── services/            # catálogo e portfólio de serviços
└── shared/
	├── components/          # layout e componentes de UI reutilizáveis
	└── utils/               # formatação e helpers sem domínio
```

## Requisitos

- Node.js 20+
- npm 10+

## Variáveis de ambiente

O cliente HTTP usa `VITE_API_BASE_URL`. Quando a variável não é informada, o projeto usa `http://localhost:8000/api`.

Exemplo de `.env`:

```bash
VITE_API_BASE_URL=http://localhost:8000/api
```

## Comandos

```bash
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

## Fluxo atual

- `login` e `cadastro` ficam em rotas públicas;
- `prestador` acessa o painel em `/app/prestador/:section`;
- `cliente` acessa o painel em `/app/cliente/:section`;
- chamadas HTTP são centralizadas em `core/http`;
- sessão é persistida em `localStorage` por `core/store/auth-context.jsx`.

## Próximos passos recomendados

- migrar módulos para TypeScript;
- adicionar testes de interface e hooks;
- incluir aliases de import e `jsconfig.json`/`tsconfig.json` para ergonomia;
- evoluir feedbacks de erro para notificações globais.
