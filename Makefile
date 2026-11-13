SHELL := /bin/bash
.SHELLFLAGS := -euo pipefail -c

PNPM := corepack pnpm

.PHONY: help build up down test smoke load

help:
	@echo 'make build   build the catalog-api, order-worker and web images'
	@echo 'make up      start the whole stack and wait until it is healthy'
	@echo 'make down    stop the stack (data in the named volumes is kept)'
	@echo 'make test    run the unit tests of every package and service'
	@echo 'make smoke   place an order end to end and wait for COMPLETED'
	@echo 'make load    steady k6 load; BASE_URL required, RATE and DURATION optional'

build:
	docker compose build

up:
	docker compose up -d --build --wait

down:
	docker compose down

test:
	$(PNPM) install --frozen-lockfile
	$(PNPM) -r run build
	$(PNPM) -r run test

smoke:
	scripts/smoke-test.sh

load:
	k6 run scripts/load-test.js
