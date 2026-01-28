# SouqSyria Platform - Monorepo

Syrian E-commerce Platform built with Angular 18 and NestJS.

> **New Developer?** Start with [DEVELOPER_ONBOARDING.md](./DEVELOPER_ONBOARDING.md) for a comprehensive setup guide.
>
> **Quick Start:** Run `./dev-setup.sh` for automated environment setup!

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

### Automated Setup (Recommended)

```bash
# One-command setup for new developers
./dev-setup.sh

# Start development environment
make dev
```

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker & Docker Compose (recommended)
- Git

### Manual Setup

```bash
# Install all dependencies
npm install

# Copy environment configuration
cp .env.development .env

# Set up Git hooks
npx husky install

# Start development (with Docker)
make dev

# OR start locally without Docker
npm run dev
```

### Development Commands

```bash
# Docker-based development (recommended)
make dev              # Start all services
make dev-stop         # Stop services
make dev-logs         # View logs

# Local development
npm run dev           # Run frontend + backend
npm run frontend      # Frontend only
npm run backend       # Backend only

# Code quality
make lint             # Run linters
make format           # Format code
make quality          # All quality checks

# Testing
make test             # Run all tests
make test-coverage    # With coverage
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

### Essential Guides
- **[Developer Onboarding](./DEVELOPER_ONBOARDING.md)** - Complete setup and workflow guide
- **[Quick Reference](./QUICK_REFERENCE.md)** - Command cheat sheet
- **[DX Optimization Summary](./DX_OPTIMIZATION_SUMMARY.md)** - Development experience improvements

### Technical Documentation
- **[Testing Guide](./TEST_AUTOMATION_SUMMARY.md)** - Test automation and strategies
- **[BI Components](./BI_COMPONENTS_IMPLEMENTATION.md)** - Business intelligence features
- **Frontend**: `apps/frontend/CLAUDE.md`
- **Backend**: `apps/backend/README.md`

## 🗂️ Git Structure

Each app maintains its own git history:
- Frontend: `apps/frontend/.git`
- Backend: `apps/backend/.git`

## 🔗 Development URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:4200 | Angular application |
| Backend API | http://localhost:3001 | NestJS API |
| Swagger Docs | http://localhost:3001/api/docs | API documentation |
| phpMyAdmin | http://localhost:8080 | Database management |
| Redis Commander | http://localhost:8081 | Cache management |
| Mailhog | http://localhost:8025 | Email testing |

## 🛠️ Developer Experience Features

- **One-command setup** - Automated environment configuration
- **Hot reload** - Frontend and backend auto-reload on changes
- **Pre-commit hooks** - Automated code quality checks
- **TypeScript strict mode** - Enhanced type safety
- **Integrated debugging** - VS Code debug configurations
- **Docker development** - Consistent environments across team
- **Automated testing** - CI/CD with GitHub Actions
- **Code formatting** - Prettier auto-format on save

See [DX_OPTIMIZATION_SUMMARY.md](./DX_OPTIMIZATION_SUMMARY.md) for details.

## 📝 License

UNLICENSED - Private repository
