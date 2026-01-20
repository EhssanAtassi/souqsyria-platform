# SouqSyria Platform - Monorepo

Syrian E-commerce Platform built with Angular 18 and NestJS.

## 🏗️ Monorepo Structure

```
souqsyria-platform/
├── apps/
│   ├── frontend/          # Angular 18 storefront application
│   └── backend/           # NestJS API server
├── package.json           # Root workspace configuration
├── docker-compose.yml     # Docker orchestration
└── README.md             # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker & Docker Compose (for containerized setup)

### Installation

```bash
# Install all dependencies for all workspaces
npm install

# Or install dependencies for specific workspace
npm install --workspace=apps/frontend
npm install --workspace=apps/backend
```

### Development

```bash
# Run both frontend and backend concurrently
npm run dev

# Run frontend only
npm run frontend

# Run backend only
npm run backend
```

### Building

```bash
# Build all apps
npm run build

# Build specific app
npm run frontend:build
npm run backend:build
```

### Testing

```bash
# Run all tests
npm test

# Run frontend tests
npm run frontend:test

# Run backend tests
npm run backend:test
```

### Docker Deployment

```bash
# Start all services (MySQL, Backend, Frontend)
npm run docker:up

# View logs
npm run docker:logs

# Stop all services
npm run docker:down
```

## 📦 Workspaces

### Frontend (`apps/frontend`)
- **Framework**: Angular 18.2
- **Language**: TypeScript
- **Styling**: Tailwind CSS + Angular Material
- **State**: Akita
- **Port**: 4200 (dev), 4201 (docker)

### Backend (`apps/backend`)
- **Framework**: NestJS 10.x
- **Language**: TypeScript
- **Database**: MySQL 8.0
- **ORM**: TypeORM
- **Port**: 3001 (app), 3005 (docker)

## 🔧 Available Scripts

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm run dev` | Run frontend + backend in development |
| `npm run build` | Build all applications |
| `npm test` | Run all tests |
| `npm run docker:up` | Start Docker containers |
| `npm run docker:down` | Stop Docker containers |
| `npm run clean` | Remove all node_modules |

## 📚 Documentation

- Frontend docs: `apps/frontend/CLAUDE.md`
- Backend docs: `apps/backend/README.md`
- Docker guide: `DOCKER-SETUP.md`

## 🗂️ Git Structure

Each app maintains its own git history:
- Frontend: `apps/frontend/.git`
- Backend: `apps/backend/.git`

## 🔗 URLs

- Frontend: http://localhost:4200
- Backend API: http://localhost:3001/api
- Swagger Docs: http://localhost:3001/api/docs

## 📝 License

UNLICENSED - Private repository
