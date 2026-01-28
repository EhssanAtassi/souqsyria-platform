# ==========================================
# SouqSyria Development Makefile
# ==========================================
# Common development tasks and workflows
# ==========================================

.PHONY: help
.DEFAULT_GOAL := help

# Colors
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[1;33m
NC := \033[0m # No Color

##@ General

help: ## Display this help message
	@echo "$(BLUE)SouqSyria Development Commands$(NC)"
	@echo ""
	@awk 'BEGIN {FS = ":.*##"; printf "Usage:\n  make $(GREEN)<target>$(NC)\n\nTargets:\n"} /^[a-zA-Z_-]+:.*?##/ { printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2 } /^##@/ { printf "\n$(BLUE)%s$(NC)\n", substr($$0, 5) } ' $(MAKEFILE_LIST)

setup: ## Initial project setup for new developers
	@echo "$(BLUE)Running initial setup...$(NC)"
	@./dev-setup.sh

##@ Development

dev: ## Start development environment with Docker
	@echo "$(BLUE)Starting development environment...$(NC)"
	@docker-compose -f docker-compose.dev.yml up -d
	@echo "$(GREEN)Services started!$(NC)"
	@echo "Frontend: http://localhost:4200"
	@echo "Backend:  http://localhost:3001"
	@echo "Swagger:  http://localhost:3001/api/docs"

dev-logs: ## View development logs
	@docker-compose -f docker-compose.dev.yml logs -f

dev-stop: ## Stop development environment
	@echo "$(BLUE)Stopping development environment...$(NC)"
	@docker-compose -f docker-compose.dev.yml down
	@echo "$(GREEN)Services stopped!$(NC)"

dev-restart: dev-stop dev ## Restart development environment

dev-clean: ## Clean development environment (removes volumes)
	@echo "$(YELLOW)Cleaning development environment...$(NC)"
	@docker-compose -f docker-compose.dev.yml down -v
	@echo "$(GREEN)Environment cleaned!$(NC)"

##@ Local Development (without Docker)

start: ## Start frontend and backend locally
	@echo "$(BLUE)Starting frontend and backend...$(NC)"
	@npm run dev

frontend: ## Start only frontend
	@npm run frontend

backend: ## Start only backend
	@npm run backend

##@ Code Quality

lint: ## Run linters on all code
	@echo "$(BLUE)Running linters...$(NC)"
	@npm run lint --workspaces --if-present
	@echo "$(GREEN)Linting complete!$(NC)"

lint-fix: ## Run linters and auto-fix issues
	@echo "$(BLUE)Running linters with auto-fix...$(NC)"
	@npm run lint -- --fix --workspaces --if-present
	@echo "$(GREEN)Linting and fixes complete!$(NC)"

format: ## Format all code with Prettier
	@echo "$(BLUE)Formatting code...$(NC)"
	@npx prettier --write "**/*.{ts,tsx,js,jsx,json,md,yml,yaml,css,scss,html}"
	@echo "$(GREEN)Code formatted!$(NC)"

format-check: ## Check code formatting
	@echo "$(BLUE)Checking code formatting...$(NC)"
	@npx prettier --check "**/*.{ts,tsx,js,jsx,json,md,yml,yaml,css,scss,html}"

type-check: ## Run TypeScript type checking
	@echo "$(BLUE)Type checking TypeScript...$(NC)"
	@npx tsc --noEmit --project apps/backend/tsconfig.json
	@npx tsc --noEmit --project apps/frontend/tsconfig.json
	@echo "$(GREEN)Type checking complete!$(NC)"

quality: lint format-check type-check ## Run all code quality checks

##@ Testing

test: ## Run all tests
	@echo "$(BLUE)Running all tests...$(NC)"
	@npm run test
	@echo "$(GREEN)Tests complete!$(NC)"

test-frontend: ## Run frontend tests
	@npm run frontend:test

test-backend: ## Run backend tests
	@npm run backend:test

test-watch: ## Run tests in watch mode
	@npm run test:watch --workspace=apps/frontend

test-coverage: ## Run tests with coverage
	@echo "$(BLUE)Running tests with coverage...$(NC)"
	@npm run test:coverage --workspaces --if-present
	@echo "$(GREEN)Coverage reports generated!$(NC)"

test-e2e: ## Run end-to-end tests
	@echo "$(BLUE)Running E2E tests...$(NC)"
	@npm run e2e --workspace=apps/frontend --if-present

##@ Build

build: ## Build all applications
	@echo "$(BLUE)Building all applications...$(NC)"
	@npm run build
	@echo "$(GREEN)Build complete!$(NC)"

build-frontend: ## Build frontend only
	@npm run frontend:build

build-backend: ## Build backend only
	@npm run backend:build

clean-build: ## Clean build artifacts
	@echo "$(BLUE)Cleaning build artifacts...$(NC)"
	@rm -rf apps/frontend/dist apps/backend/dist
	@echo "$(GREEN)Build artifacts cleaned!$(NC)"

##@ Database

db-migrate: ## Run database migrations
	@echo "$(BLUE)Running database migrations...$(NC)"
	@npm run migration:run --workspace=apps/backend --if-present

db-seed: ## Seed database with test data
	@echo "$(BLUE)Seeding database...$(NC)"
	@npm run seed:basic --workspace=apps/backend

db-reset: ## Reset database (drop and recreate)
	@echo "$(YELLOW)Resetting database...$(NC)"
	@docker-compose -f docker-compose.dev.yml down -v
	@docker-compose -f docker-compose.dev.yml up -d mysql
	@sleep 10
	@$(MAKE) db-migrate
	@$(MAKE) db-seed

##@ Dependencies

install: ## Install all dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	@npm install
	@echo "$(GREEN)Dependencies installed!$(NC)"

update: ## Update dependencies interactively
	@echo "$(BLUE)Checking for updates...$(NC)"
	@npx npm-check-updates -i

outdated: ## Check for outdated dependencies
	@npm outdated

##@ Maintenance

clean: ## Clean all generated files and dependencies
	@echo "$(YELLOW)Cleaning project...$(NC)"
	@npm run clean
	@rm -rf coverage
	@echo "$(GREEN)Project cleaned!$(NC)"

reset: clean install ## Full reset (clean and reinstall)

docker-prune: ## Clean Docker resources
	@echo "$(YELLOW)Pruning Docker resources...$(NC)"
	@docker system prune -af --volumes

##@ Utilities

logs-backend: ## View backend logs
	@docker-compose -f docker-compose.dev.yml logs -f backend

logs-frontend: ## View frontend logs
	@docker-compose -f docker-compose.dev.yml logs -f frontend

logs-db: ## View database logs
	@docker-compose -f docker-compose.dev.yml logs -f mysql

shell-backend: ## Open shell in backend container
	@docker-compose -f docker-compose.dev.yml exec backend sh

shell-frontend: ## Open shell in frontend container
	@docker-compose -f docker-compose.dev.yml exec frontend sh

db-console: ## Open database console
	@docker-compose -f docker-compose.dev.yml exec mysql mysql -u souqsyria_dev -pdev_pass_123 souqsyria_dev

health-check: ## Check health of all services
	@echo "$(BLUE)Checking service health...$(NC)"
	@docker-compose -f docker-compose.dev.yml ps
	@curl -s http://localhost:3001/api/health | jq . || echo "Backend not responding"
	@curl -s http://localhost:4200 > /dev/null && echo "$(GREEN)Frontend: Healthy$(NC)" || echo "$(YELLOW)Frontend: Not responding$(NC)"

##@ Documentation

docs-serve: ## Serve API documentation
	@echo "$(BLUE)Opening API documentation...$(NC)"
	@open http://localhost:3001/api/docs || xdg-open http://localhost:3001/api/docs

docs-generate: ## Generate project documentation
	@echo "$(BLUE)Generating documentation...$(NC)"
	@npx compodoc -p apps/frontend/tsconfig.json -d docs/frontend --if-present
	@echo "$(GREEN)Documentation generated!$(NC)"
