.PHONY: help build up down logs clean deploy test

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build the Docker image
	docker-compose build

up: ## Start services in foreground
	docker-compose up

up-d: ## Start services in background
	docker-compose up -d

down: ## Stop and remove services
	docker-compose down

logs: ## View logs from all services
	docker-compose logs -f

logs-postgrest: ## View PostgREST logs only
	docker-compose logs -f postgrest

logs-db: ## View PostgreSQL logs only
	docker-compose logs -f postgres

clean: ## Stop services and remove volumes
	docker-compose down -v

restart: ## Restart all services
	docker-compose restart

restart-postgrest: ## Restart PostgREST only
	docker-compose restart postgrest

psql: ## Connect to PostgreSQL with psql
	docker exec -it postgrest-db psql -U postgres

test: ## Run API tests
	@echo "Testing API endpoints..."
	@curl -s http://127.0.0.1:3000/ > /dev/null && echo "✓ Root endpoint OK" || echo "✗ Root endpoint failed"
	@curl -s http://127.0.0.1:3000/todos > /dev/null && echo "✓ Todos endpoint OK" || echo "✗ Todos endpoint failed"
	@curl -s http://127.0.0.1:3000/todos_stats > /dev/null && echo "✓ Stats endpoint OK" || echo "✗ Stats endpoint failed"

deploy: ## Deploy to DigitalOcean App Platform
	doctl apps create --spec .do/app.yaml

status: ## Check deployment status
	@doctl apps list

init-db: ## Reinitialize database
	docker exec -it postgrest-db psql -U postgres -f /docker-entrypoint-initdb.d/init.sql
