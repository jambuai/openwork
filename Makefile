.PHONY: setup install build start dev doctor smoke check clean \
	openwork-install openwork-install-remote openwork-uninstall openwork-purge \
	claude claude-revert

ENV_FILE := .env

# OpenWork CLI distribution (same behavior as the curl one-liner; override OPENWORK_* as in README)
OPENWORK_NPM_PACKAGE ?= @jgabriellima/openwork
OPENWORK_REPO ?= jambuai/openwork
INSTALL_SCRIPT_URL ?= https://raw.githubusercontent.com/$(OPENWORK_REPO)/main/scripts/install-openwork.sh
OPENWORK_LOCAL_BIN ?= $(HOME)/.local/bin
OPENWORK_SOURCE_DIR ?= $(HOME)/.openwork-source

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

# Same installer as: curl -fsSL …/install-openwork.sh | bash (uses this repo’s copy of the script).
openwork-install:
	bash scripts/install-openwork.sh

# One-liner from GitHub default branch (use OPENWORK_REPO / fork branch via URL override).
openwork-install-remote:
	curl -fsSL $(INSTALL_SCRIPT_URL) | bash

# npm global; removes legacy ~/.local/bin launcher if present (older installers). PATH hooks in rc are unchanged.
openwork-uninstall:
	@echo "Removing global npm package ($(OPENWORK_NPM_PACKAGE)) if present..."
	-npm uninstall -g $(OPENWORK_NPM_PACKAGE) 2>/dev/null || true
	@echo "Removing legacy launcher in $(OPENWORK_LOCAL_BIN) if present..."
	rm -f $(OPENWORK_LOCAL_BIN)/openwork $(OPENWORK_LOCAL_BIN)/.openwork-root
	@echo "openwork-uninstall: done (PATH hooks in rc files were not changed)."

# Also removes ~/.openwork-source if it exists (leftover from old source-based installs).
openwork-purge: openwork-uninstall
	rm -rf $(OPENWORK_SOURCE_DIR)
	@echo "openwork-purge: removed $(OPENWORK_SOURCE_DIR) if it existed"

# Shell shim: `claude` → openwork (function in ~/.zshrc etc.). Revert with claude-revert.
# Dev without global openwork: make claude OPENWORK_BIN="$(CURDIR)/bin/openwork"
claude:
	OPENWORK_BIN="$(OPENWORK_BIN)" bash scripts/claude-openwork-shim.sh add

claude-revert:
	bash scripts/claude-openwork-shim.sh remove

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
	bun run profile:init -- --provider ollama --model llama3.2:3b

profile-code:
	bun run profile:init -- --provider ollama --model qwen2.5-coder:7b

# ── Misc ───────────────────────────────────────────────────────────────────────

clean:
	rm -rf dist reports

help:
	@echo ""
	@echo "Usage: make <target>"
	@echo ""
	@echo "  setup           Install deps and build (first-time setup)"
	@echo "  install         Install bun dependencies"
	@echo "  openwork-install         Run scripts/install-openwork.sh (npm global; same as curl one-liner)"
	@echo "  openwork-install-remote  curl install-openwork.sh from GitHub main"
	@echo "  openwork-uninstall       npm uninstall -g + remove legacy ~/.local/bin launcher"
	@echo "  openwork-purge           openwork-uninstall + rm -rf ~/.openwork-source (legacy cleanup)"
	@echo "  claude            Install shell shim: claude → openwork (see OPENWORK_BIN in Makefile comment)"
	@echo "  claude-revert     Remove that shim from shell rc files"
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
