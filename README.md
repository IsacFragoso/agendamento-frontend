# Frontend de Agendamento

Aplicação web SPA para o sistema acadêmico de agendamento, com autenticação, gestão de serviços, agenda de prestadores e solicitações de agendamento. O frontend consome a API REST em um repositório separado.

## Tecnologias

- React 19 e React DOM
- Vite 8
- JavaScript/JSX (não TypeScript) e CSS
- React Router 7
- Cliente HTTP baseado em `fetch` e contexto de autenticação

## Pré-requisitos

- Node.js 20+
- npm 10+
- A API backend precisa estar em execução para usar as funcionalidades que dependem de dados.

## Primeiros passos

1. Clone este repositório:

	```text
	https://github.com/IsacFragoso/agendamento-frontend
	```

2. Instale as dependências na raiz do repositório:

	```bash
	npm install
	```

3. Opcionalmente, configure a URL da API em um arquivo `.env` na raiz:

	```env
	VITE_API_BASE_URL=http://localhost:8000/api
	```

	Se não for definida, a aplicação usa `http://localhost:8000/api`. Variáveis `VITE_` são incluídas no bundle do navegador; não coloque segredos nelas.

4. Inicie a API backend. Backend: <https://github.com/IsacFragoso/agendamento-backend>.
5. Inicie o servidor de desenvolvimento:

	```bash
	npm run dev
	```

	O Vite informa no terminal a URL local para abrir no navegador. A configuração não define uma porta específica.

## Scripts disponíveis

- `npm run dev` — inicia o servidor de desenvolvimento do Vite.
- `npm run build` — gera a versão de produção em `dist/`.
- `npm run lint` — verifica o projeto com ESLint.
- `npm test` — executa os testes automatizados com Vitest.
- `npm run preview` — serve localmente o build de produção.
- `npm run predeploy` — executa `npm run build` antes da publicação.
- `npm run deploy` — publica o conteúdo de `dist/` usando `gh-pages`.

## Testes

Os testes automatizados usam Vitest e jsdom. Execute `npm test` para rodar a suíte. Também rode `npm run lint` e `npm run build` para validar as alterações.

## Estrutura do projeto

```text
src/
├── assets/       # Imagens e recursos estáticos
├── core/
│   ├── http/     # Cliente HTTP, helper de requisições e erros
│   ├── router/   # Rotas públicas e protegidas
│   └── store/    # Contexto e estado de autenticação
├── modules/
│   ├── auth/         # Login e cadastro
│   ├── appointments/ # Solicitações e histórico de agendamentos
│   ├── dashboard/    # Painéis de cliente e prestador
│   ├── schedules/    # Agenda do prestador
│   └── services/     # Catálogo e serviços
└── shared/
	 ├── components/ # Componentes reutilizáveis
	 └── utils/      # Formatação e utilitários compartilhados
```

## Documentação

- [Arquitetura](ARCHITECTURE.md)
- [Orientações para agentes e colaboradores](AGENTS.md)

## Repositório relacionado

Backend: <https://github.com/IsacFragoso/agendamento-backend>. O frontend precisa da API backend em execução para autenticação e funcionalidades que acessam dados.

## Fluxo de trabalho da equipe

Para uma equipe de duas pessoas, mantenham `main` estável e usem branches de curta duração para cada tarefa (por exemplo, `feat/<tarefa>`, `fix/<tarefa>` ou `docs/<tarefa>`). Façam commits pequenos e focados; prefixos como `feat:`, `fix:` e `docs:` ajudam a indicar o propósito.

Abra um pull request para `main` para cada alteração e peça ao outro integrante da equipe para revisá-lo antes do merge. A revisão deve verificar o comportamento e os impactos na integração com a API. Antes do merge, execute `npm run lint` e `npm run build`. Mantenham o processo simples: não é necessário criar uma branch de release ou um processo formal de aprovação.

## Autoria e curso

- Autores: Isaac Santos Fragoso, Jean Komuro dos Santos.
- Curso: Tecnologia em Sistemas para Internet.

---

# Appointment Booking Frontend

This repository contains the single-page web app for the school appointment-booking system, including authentication, service management, provider schedules, and appointment requests. It consumes a REST API maintained in a separate repository.

## Tech Stack

- React 19 and React DOM
- Vite 8
- JavaScript/JSX (not TypeScript) and CSS
- React Router 7
- Fetch-based HTTP client and authentication context

## Prerequisites

- Node.js 20+
- npm 10+
- The backend API must be running to use features that depend on data.

## Getting Started

1. Clone this repository:

	```text
	https://github.com/IsacFragoso/agendamento-frontend
	```

2. Install dependencies from the repository root:

	```bash
	npm install
	```

3. Optionally, configure the API URL in a `.env` file at the repository root:

	```env
	VITE_API_BASE_URL=http://localhost:8000/api
	```

	If unset, the app uses `http://localhost:8000/api`. `VITE_` variables are included in the browser bundle; do not put secrets in them.

4. Start the backend API. Backend repository: <https://github.com/IsacFragoso/agendamento-backend>.
5. Start the development server:

	```bash
	npm run dev
	```

	Vite prints the local URL to open in a browser. The configuration does not set a specific port.

## Available Scripts

- `npm run dev` — start the Vite development server.
- `npm run build` — create the production build in `dist/`.
- `npm run lint` — lint the project with ESLint.
- `npm test` — run the automated Vitest suite.
- `npm run preview` — locally serve the production build.
- `npm run predeploy` — run `npm run build` before deployment.
- `npm run deploy` — publish the contents of `dist/` using `gh-pages`.

## Tests

Automated tests use Vitest and jsdom. Run `npm test` to execute the suite. Also run `npm run lint` and `npm run build` to validate changes.

## Project Structure

```text
src/
├── assets/       # Images and static assets
├── core/
│   ├── http/     # HTTP client, request helper, and errors
│   ├── router/   # Public and protected routes
│   └── store/    # Authentication context and state
├── modules/
│   ├── auth/         # Login and registration
│   ├── appointments/ # Appointment requests and history
│   ├── dashboard/    # Client and provider dashboards
│   ├── schedules/    # Provider schedule
│   └── services/     # Service catalog and services
└── shared/
	 ├── components/ # Reusable components
	 └── utils/      # Formatting and shared utilities
```

## Documentation

- [Architecture](ARCHITECTURE.md)
- [Agent and contributor guidance](AGENTS.md)

## Related Repository

Backend: <https://github.com/IsacFragoso/agendamento-backend>. The frontend needs the backend API running for authentication and features that access data.

## Team Workflow

For a two-person team, keep `main` stable and use short-lived branches for each task (for example, `feat/<task>`, `fix/<task>`, or `docs/<task>`). Make small, focused commits; prefixes such as `feat:`, `fix:`, and `docs:` help explain their purpose.

Open a pull request into `main` for each change and have the other teammate review it before merging. The review should check behavior and API integration impacts. Before merging, run `npm run lint` and `npm run build`. Keep the process lightweight: no release branch or formal approval process is needed.

## Authors and Course

- Authors: Isaac Santos Fragoso, Jean Komuro dos Santos.
- Course: Tecnologia em Sistemas para Internet.
