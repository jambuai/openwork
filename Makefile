.PHONY: setup install build start dev doctor smoke check clean

ENV_FILE := .env

# Load .env if it exists
ifneq (,$(wildcard $(ENV_FILE)))
  include $(ENV_FILE)
  export $(shell sed 's/=.*//' $(ENV_FILE))
endif

# ── Setup ──────────────────────────────────────────────────────────────────────

setup: install build
	@echo "Setup complete. Run 'make start' to launch."

install:
	bun install

build:
	bun run build

# ── Run ────────────────────────────────────────────────────────────────────────

start: build
	node dist/cli.mjs

dev:
	bun run dev:profile

# ── Diagnostics ────────────────────────────────────────────────────────────────

doctor:
	bun run doctor:runtime

smoke:
	bun run smoke

check:
	bun run hardening:check

check-strict:
	bun run hardening:strict

# ── Profiles ───────────────────────────────────────────────────────────────────

profile-ollama:
	bun run profile:init -- --provider ollama --model llama3.1:8b

profile-fast:
	bun run profile:fast

profile-code:
	bun run profile:code

# ── Misc ───────────────────────────────────────────────────────────────────────

clean:
	rm -rf dist reports

help:
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@echo "  setup           Install deps and build (first-time setup)"
	@echo "  install         Install bun dependencies"
	@echo "  build           Compile TypeScript -> dist/"
	@echo "  start           Build and launch the CLI (env from .env)"
	@echo "  dev             Launch via dev:profile (uses .openwork-profile.json)"
	@echo ""
	@echo "  doctor          Run runtime health checks"
	@echo "  smoke           Quick smoke test (build + version check)"
	@echo "  check           Smoke + runtime doctor"
	@echo "  check-strict    Typecheck + smoke + doctor"
	@echo ""
	@echo "  profile-ollama  Init Ollama profile (llama3.1:8b)"
	@echo "  profile-fast    Init fast profile (llama3.2:3b)"
	@echo "  profile-code    Init coding profile (qwen2.5-coder:7b)"
	@echo ""
	@echo "  clean           Remove dist/ and reports/"
	@echo ""
