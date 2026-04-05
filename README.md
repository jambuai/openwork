# OpenWork

An agentic coding CLI with the **same feature set as Claude Code**. The OpenWork difference is first-class support for **non-Anthropic models** via an OpenAI-compatible API shim (`openaiShim.ts`): GPT-4o, DeepSeek, OpenRouter, Ollama, and other Chat Completions endpoints.

---

## How It Works

OpenWork ships a provider shim (`src/services/api/openaiShim.ts`) that sits between the tool orchestration layer and the LLM API:

```
Tool System (Bash, FileRead, FileEdit, Glob, Grep, WebFetch, Agent, MCP…)
        |
        v   
  Anthropic SDK interface (duck-typed)
        |
        v
  openaiShim.ts  ← translates request/response formats
        |
        v
  OpenAI Chat Completions API
        |
        v
  Any compatible model
```

The shim handles:
- Anthropic message blocks → OpenAI messages
- Anthropic `tool_use` / `tool_result` → OpenAI function calls
- OpenAI SSE streaming → Anthropic stream events
- Anthropic system prompt arrays → OpenAI system messages

The rest of the stack is unaware a different model is running underneath.

---

## Install

Published package: **`@jgabriellima/openwork`**. The **unscoped** name `openwork` on npm is a **different** project — do not use `npm install -g openwork` for this repository.

### Option A: npm global (recommended)

Requires [Node.js 20+](https://nodejs.org/) (includes npm):

```bash
npm install -g @jgabriellima/openwork@latest
```

Then run `openwork configure` once (see below). If `openwork` is not found, add your npm global bin directory to `PATH` (the one-line installer below can do that for you).

### Option B: One-line installer (npm by default)

By default the script runs **`npm install -g @jgabriellima/openwork@latest`** and, if needed, appends your **npm global bin** to `PATH` in your shell rc (idempotent marker). **Node + npm only** — no Git or Bun.

**macOS / Linux / Git Bash (Windows):**

```bash
curl -fsSL https://raw.githubusercontent.com/jgabriellima/openwork/main/scripts/install-openwork.sh | bash
```

**Windows (PowerShell)** — keep the window open (do not double‑click):

```powershell
irm https://raw.githubusercontent.com/jgabriellima/openwork/main/scripts/install-openwork.ps1 | iex
```

Environment variables:

| Variable | Effect |
|----------|--------|
| `OPENWORK_NPM_PACKAGE` | Override package (default `@jgabriellima/openwork`). |
| `OPENWORK_NPM_TAG` | Dist-tag (default `latest`). |
| `OPENWORK_SKIP_PATH_HOOK=1` | Do not edit shell rc / user PATH. |
| `OPENWORK_PAUSE=1` | Wait for Enter before exit (helps if the window closes too fast). |

If the terminal **closes immediately**, open a real shell, paste the command, or use `OPENWORK_PAUSE=1` (bash) / `$env:OPENWORK_PAUSE=1` (PowerShell).

### Option C: From source (contributors / bleeding edge)

```bash
git clone https://github.com/jgabriellima/openwork.git
cd openwork
bun install
bun run build
node dist/cli.mjs --version
```

### Option D: Run directly with Bun (development)

```bash
git clone https://github.com/jgabriellima/openwork.git
cd openwork
bun install
bun run dev
```

### Publishing (maintainers)

1. Bump `"version"` in `package.json` on `main` and push.
2. Tag and push, e.g. `git tag v0.2.0 && git push origin v0.2.0` (tag should match the release version).
3. GitHub → **Releases** → create a release from that tag and **publish** it. The workflow [Publish npm](.github/workflows/publish-npm.yml) runs `npm publish` using the `NPM_TOKEN` secret (npm [Automation token](https://www.npmjs.com/settings/~/tokens)).
4. Manual publish from `main`: Actions → **Publish npm** → **Run workflow** (same secret; version is whatever is in `package.json` on `main`).

`workflow_dispatch` only runs on `refs/heads/main` so ad-hoc publishes stay predictable.

---

## CLI provider config (`~/.openwork`)

### Interactive setup (recommended for distribution)

After install, run once:

```bash
openwork configure
```

Alias: `openwork setup`. You pick a preset (OpenAI, Ollama, DeepSeek, OpenRouter, or custom URL), model, and API key; everything is saved under `~/.openwork/` with the API key encrypted at rest. No project `.env` required.

### Advanced: one-shot flags

Instead of exporting secrets in every shell, you can pass provider flags once. OpenWork strips them from `process.argv` during bootstrap (so they do not reach the main Commander parser) and persists settings under **`~/.openwork/`**:

| File | Contents |
|------|----------|
| `provider.json` | `model`, `baseUrl` (chmod `0600`) |
| `credentials.enc` | `OPENAI`-style API key, **AES-256-GCM** at rest (chmod `0600`) |
| `.key` | Random 32-byte key used only to encrypt `credentials.enc` (chmod `0600`) |

**Security model:** this is **not** a password vault. Anyone who can read your user account (or backups) can decrypt the files. It **does** prevent accidental `git commit` of keys and avoids keeping the API key in project-level `.env`. Prefer OS full-disk encryption. Passing `--apiKey=…` on the command line may still expose the secret in shell history and in short-lived `ps` listings—after the first save, run plain `openwork` so the key is read only from disk.

**Examples:**

```bash
# Namespaced model: openai → default https://api.openai.com/v1 ; ollama/local → http://localhost:11434/v1
openwork --model openai/gpt-4o --baseUrl= --apiKey=sk-...

# Kebab-case aliases are equivalent
openwork --model ollama/llama3.1:8b --base-url http://localhost:11434/v1 --api-key ""
```

Use `--model namespace/model` so OpenWork knows you are configuring the OpenAI shim; a plain `--model sonnet` is left for Claude Code / Anthropic as usual.

**Later runs:** if `~/.openwork` exists, OpenWork sets `CLAUDE_CODE_USE_OPENAI=1` and merges saved model/base URL/key into the environment. To use Anthropic-only for a session, skip the store: `OPENWORK_SKIP_STORE=1 openwork`. To remove the profile: `rm -rf ~/.openwork`.

---

## Quick Start

### 1. Configure provider

```bash
openwork configure
```

### 2. Run

```bash
openwork
```

### Alternative: environment variables

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_API_KEY=sk-your-key-here
export OPENAI_MODEL=gpt-4o
openwork
```

From source: `bun run dev` or `node dist/cli.mjs` after `bun run build`.

---

## Provider Examples

### OpenAI

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_API_KEY=sk-...
export OPENAI_MODEL=gpt-4o
```

### Codex via ChatGPT auth

`codexplan` maps to GPT-5.4 on the Codex backend with high reasoning.
`codexspark` maps to GPT-5.3 Codex Spark for faster loops.

OpenWork reads `~/.codex/auth.json` automatically if it exists. Override with
`CODEX_AUTH_JSON_PATH` or `CODEX_API_KEY`.

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_MODEL=codexplan

# optional if ~/.codex/auth.json is not present
export CODEX_API_KEY=...

openwork
```

### DeepSeek

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_API_KEY=sk-...
export OPENAI_BASE_URL=https://api.deepseek.com/v1
export OPENAI_MODEL=deepseek-chat
```

### Google Gemini (via OpenRouter)

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_API_KEY=sk-or-...
export OPENAI_BASE_URL=https://openrouter.ai/api/v1
export OPENAI_MODEL=google/gemini-2.0-flash
```

### Ollama (local, free)

```bash
ollama pull llama3.3:70b

export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_BASE_URL=http://localhost:11434/v1
export OPENAI_MODEL=llama3.3:70b
# no API key needed for local models
```

### LM Studio (local)

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_BASE_URL=http://localhost:1234/v1
export OPENAI_MODEL=your-model-name
```

### Together AI

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_API_KEY=...
export OPENAI_BASE_URL=https://api.together.xyz/v1
export OPENAI_MODEL=meta-llama/Llama-3.3-70B-Instruct-Turbo
```

### Groq

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_API_KEY=gsk_...
export OPENAI_BASE_URL=https://api.groq.com/openai/v1
export OPENAI_MODEL=llama-3.3-70b-versatile
```

### Mistral

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_API_KEY=...
export OPENAI_BASE_URL=https://api.mistral.ai/v1
export OPENAI_MODEL=mistral-large-latest
```

### Azure OpenAI

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_API_KEY=your-azure-key
export OPENAI_BASE_URL=https://your-resource.openai.azure.com/openai/deployments/your-deployment/v1
export OPENAI_MODEL=gpt-4o
```

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CLAUDE_CODE_USE_OPENAI` | Yes | Set to `1` to enable the OpenAI provider |
| `OPENAI_API_KEY` | Yes* | Your API key (*not needed for local models like Ollama) |
| `OPENAI_MODEL` | Yes | Model name (e.g. `gpt-4o`, `deepseek-chat`, `llama3.3:70b`) |
| `OPENAI_BASE_URL` | No | API endpoint (defaults to `https://api.openai.com/v1`) |
| `CODEX_API_KEY` | Codex only | Codex/ChatGPT access token override |
| `CODEX_AUTH_JSON_PATH` | Codex only | Path to a Codex CLI `auth.json` file |
| `CODEX_HOME` | Codex only | Alternative Codex home directory (`auth.json` will be read from here) |

`ANTHROPIC_MODEL` can also override the model name; `OPENAI_MODEL` takes priority.

---

## Runtime Hardening

```bash
# quick startup sanity check
bun run smoke

# validate provider env + reachability
bun run doctor:runtime

# print machine-readable runtime diagnostics
bun run doctor:runtime:json

# persist a diagnostics report to reports/doctor-runtime.json
bun run doctor:report

# full local hardening check (typecheck + smoke + runtime doctor)
bun run hardening:check

# strict hardening (includes project-wide typecheck)
bun run hardening:strict
```

Notes:
- `doctor:runtime` fails fast if `CLAUDE_CODE_USE_OPENAI=1` with a placeholder key or missing key for non-local providers.
- Local providers (e.g. `http://localhost:11434/v1`) run without `OPENAI_API_KEY`.
- Codex profiles validate `CODEX_API_KEY` or the Codex CLI auth file and probe `POST /responses` instead of `GET /models`.

### Provider launch (repo dev only)

End-user configuration is `openwork configure` or env vars — see above. For **working from this repository**, you can write `.openwork-profile.json` and launch via `provider-launch.ts`:

```bash
# one-time profile bootstrap (auto-detect ollama, otherwise openai)
bun run profile:init

# examples: codex / openai / ollama with explicit options
bun run profile:init -- --provider codex --model codexplan
bun run profile:init -- --provider openai --api-key sk-...
bun run profile:init -- --provider ollama --model llama3.1:8b

# launch using .openwork-profile.json (optional: pick provider + flags after --)
bun run dev:profile
bun run dev:profile -- ollama
bun run dev:profile -- ollama --fast --bare
```

`dev:profile` runs `doctor:runtime` first and only starts the CLI if checks pass.

---

## Capabilities

- **Tools**: Bash, FileRead, FileWrite, FileEdit, Glob, Grep, WebFetch, WebSearch, Agent, MCP, LSP, NotebookEdit, Tasks
- **Streaming**: Real-time token streaming
- **Tool calling**: Multi-step tool chains
- **Images**: Base64 and URL images passed to vision models
- **Slash commands**: /commit, /review, /compact, /diff, /doctor, etc.
- **Sub-agents**: AgentTool spawns sub-agents using the same provider
- **Memory**: Persistent memory system

## Known Limitations

- **No thinking mode**: Extended thinking is an Anthropic-specific feature; OpenAI models use different reasoning approaches
- **No prompt caching**: Anthropic-specific cache headers are skipped
- **No beta features**: Anthropic-specific beta headers are ignored
- **Token limits**: Defaults to 32K max output — some models cap lower, handled gracefully

---

## Model Quality Notes

| Model | Tool Calling | Code Quality | Speed |
|-------|-------------|-------------|-------|
| GPT-4o | Excellent | Excellent | Fast |
| DeepSeek-V3 | Great | Great | Fast |
| Gemini 2.0 Flash | Great | Good | Very Fast |
| Llama 3.3 70B | Good | Good | Medium |
| Mistral Large | Good | Good | Fast |
| GPT-4o-mini | Good | Good | Very Fast |
| Qwen 2.5 72B | Good | Good | Medium |
| Smaller models (<7B) | Limited | Limited | Very Fast |

For best results, use models with strong function/tool calling support.

---

## Files Changed from Original

```
src/services/api/openaiShim.ts   — NEW: OpenAI-compatible API shim (724 lines)
src/services/api/client.ts       — Routes to shim when CLAUDE_CODE_USE_OPENAI=1
src/utils/model/providers.ts     — Added 'openai' provider type
src/utils/model/configs.ts       — Added openai model mappings
src/utils/model/model.ts         — Respects OPENAI_MODEL for defaults
src/utils/auth.ts                — Recognizes OpenAI as valid 3P provider
```

6 files changed. 786 lines added. Zero dependencies added.

---

## Documentation

| Doc | Description |
|-----|-------------|
| [docs/PLAYBOOK.md](docs/PLAYBOOK.md) | Daily workflow, provider modes, troubleshooting matrix |
| [docs/ENVIRONMENT_DICTIONARY.md](docs/ENVIRONMENT_DICTIONARY.md) | Complete reference for all environment variables and config keys |

---

## License

MIT
