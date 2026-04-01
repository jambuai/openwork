# CLAUDE.md

This file provides guidance to AI agents when working with code in this repository.

## Development Commands

- `make setup` – Installs dependencies (`bun install`) and builds the project (`bun run build`). Run this on first clone.
- `make install` – Install only dependencies.
- `make build` – Compile TypeScript to `dist/`.
- `make start` – Run the CLI (`node dist/cli.mjs`). Uses env from `.env`.
- `make dev` – Launch via a profile (e.g., `bun run dev:profile`).
- `make doctor` – Run runtime health checks (`bun run doctor:runtime`).
- `make smoke` – Quick smoke test (`bun run smoke`).
- `make check` – Run smoke + runtime doctor (`bun run hardening:check`).
- `make check-strict` – Run strict hardening (`bun run hardening:strict`).
- `make clean` – Remove `dist/` and `reports/`.

## Testing

The project uses Bun's test runner. Run `bun run test` to execute all tests. Individual test files such as `test_ollama_provider.py` and `test_smart_router.py` can be targeted with `bun run test -- test_ollama_provider.py`.

## Architecture Overview

- The core service is `src/services/api/openaiShim.ts`, which translates Anthropic SDK calls to OpenAI-compatible requests.
- Configuration and provider handling are in `src/utils/model/` (`configs.ts`, `model.ts`).
- Authentication logic resides in `src/utils/auth.ts`.
- The shim enables any OpenAI-compatible model (GPT-4o, DeepSeek, Ollama, etc.) to be used via environment variables like `OPENAI_MODEL` and `CLAUDE_CODE_USE_OPENAI`.

## Environment Variables

Set the following to use a provider:

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_MODEL=gpt-4o # or another model name
# Optional for non-OpenAI providers:
export OPENAI_API_KEY=your-key
export OPENAI_BASE_URL=https://api.provider.com/v1
```

## Quick Start

```bash
# First time setup
make setup

# Run the CLI
make start
```

All tools (bash, file read/write/edit, glob, grep, agents, tasks, MCP) are available once the CLI is running.
