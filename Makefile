# A Makefile to `make` life easier
# Run `make` or `make help` to see all options
#
# Remember that all commands must be indented with and actual `tab` character,
# in VS Code you can add the following to your settings
#   "[makefile]": {
#       "editor.useTabStops": true,
#       "editor.insertSpaces": false,
#       "editor.tabSize": 4
#   },

SHELL := /bin/bash

.PHONY: help
help: ## Show this help
	@egrep -h '\s##\s' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

db: ## Connect to the database - it must already be running ie with `make start`
	psql postgresql://postgres:password@localhost:5433/federalist

build-client: ## Build client app - typically only done to test production artifacts
	docker compose run -rm app yarn build

install: ## Install npm deps
	docker compose run --rm app yarn
	docker compose run --rm admin-client yarn

lint-server: ## Format lint code
	docker compose run --rm app yarn format:lint

lint-client: ## Lint admin client code
	docker compose run --rm admin-client yarn lint

lint: lint-server lint-client ## Lint project

lint-fix: ## lint and fix
	docker compose --env-file ./services/local/docker.env run --rm app yarn format:lint

format:
	docker compose --env-file ./services/local/docker.env run --rm app yarn format

format-check:
	docker compose --env-file ./services/local/docker.env run --rm app yarn format:check

migrate: ## Run database migrations
	docker compose --env-file ./services/local/docker.env run  --rm app yarn migrate:up

rebuild: ## Rebuild docker images and database volumes
	docker volume rm pages-core_db-data
	docker compose -f ./docker-compose.yml -f ./docker-compose.uaa.yml --env-file ./services/local/docker.env build

seed: ## (Re)Create seed data
	docker compose --env-file ./services/local/docker.env run --rm app yarn create-dev-data

set-pipeline: ## Set Concourse `web` pipeline
	fly -t pages-staging sp -p web -c ci/pipeline.yml

start: ## Start
	docker compose -f ./docker-compose.yml -f ./docker-compose.uaa.yml --env-file ./services/local/docker.env up

start-workers: ## Start with workers
	docker compose -f ./docker-compose.yml -f ./docker-compose.uaa.yml --env-file ./services/local/docker.env up

test-client: ## Run client tests
	docker compose --env-file ./services/local/docker.env  run --rm app yarn test:rtl

test-server: ## Run server tests
	docker compose --env-file ./services/local/docker.env  run --rm app yarn test:server

test-all: ## Run all tests
	docker compose --env-file ./services/local/docker.env run --rm app yarn test

test-watch:
	docker compose --env-file ./services/local/docker.env run --rm app yarn test:rtl --watch --runInBand --silent=false

everything: # When you switch to a new branch and need to rebuild everything
	docker compose -f ./docker-compose.yml -f ./docker-compose.uaa.yml --env-file ./services/local/docker.env down
	make rebuild
	make install
	make migrate
	make seed
	make start
