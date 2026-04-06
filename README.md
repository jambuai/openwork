<div align="center">

# OpenWork

**Terminal coding agent** — you point it at an **OpenAI-compatible Chat Completions** URL and model, then drive the session from the shell.

GPT-5.2 · DeepSeek · OpenRouter · Ollama · LM Studio · Azure · Groq · 200+ models

<br/>

[![Node.js](https://img.shields.io/badge/node.js-%3E%3D20-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![GitHub](https://img.shields.io/badge/repo-jambuai%2Fopenwork-181717?logo=github)](https://github.com/jambuai/openwork)

<br/>

[Install](#install) · [Configure](#cli-provider-config-openwork) · [Quick start](#quick-start) · [Providers](#provider-examples) · [Docs](#documentation)

</div>

---

## At a glance

| | |
| :--- | :--- |
| **What you get** | A REPL-style session with tools, streaming, MCP, slash commands, sub-agents, and memory — as implemented in this tree. |
| **What you configure** | `OPENAI_BASE_URL` + `OPENAI_MODEL` (or `openwork configure`). Traffic to the model is **Chat Completions**-shaped on the wire. |
| **How you run it** | `openwork configure` once (optional), then `openwork` in your repo. Keys can live under `~/.openwork/` (encrypted at rest). |
| **Requirements** | Node **20+** for the published CLI; **Bun** recommended for building from source. |

---

## Table of contents

1. [Using OpenWork](#using-openwork)
2. [Architecture](#architecture)
3. [Install](#install)
4. [CLI provider config (`~/.openwork`)](#cli-provider-config-openwork)
5. [Quick start](#quick-start)
6. [Provider examples](#provider-examples)
7. [Environment variables](#environment-variables)
8. [Runtime hardening](#runtime-hardening)
9. [Capabilities & limitations](#capabilities)
10. [Model quality notes](#model-quality-notes)
11. [Implementation notes](#implementation-notes)
12. [Documentation](#documentation)
13. [Legal notice](#legal-notice)

---

## Using OpenWork

1. **Install** — see [Install](#install); from source is the reliable path if the registry package is missing.
2. **Point at a model** — run `openwork configure`, or set `OPENAI_BASE_URL`, `OPENAI_MODEL`, and `OPENAI_API_KEY` (when the host requires one). Local stacks (Ollama, LM Studio, etc.) use a LAN URL and often no key.
3. **Work in a repo** — run `openwork` in the project directory. Use the built-in tools, `/commands`, and MCP the UI exposes; behavior matches what this build ships, not a marketing checklist.
4. **Read the ops docs** — [PLAYBOOK](docs/PLAYBOOK.md) and [ENVIRONMENT_DICTIONARY](docs/ENVIRONMENT_DICTIONARY.md) for flags, env vars, and failure modes.

---

## Architecture

```mermaid
flowchart TB
  subgraph UI["Tool orchestration"]
    T["Bash · Files · Glob · Grep · Web · Agent · MCP · …"]
  end
  subgraph Bridge["Compatibility layer"]
    A["Anthropic-shaped client API"]
    S["openaiShim.ts"]
  end
  subgraph Remote["Your endpoint"]
    O["OpenAI Chat Completions"]
    M["Any compatible model"]
  end
  T --> A --> S --> O --> M
```

<details>
<summary><strong>Plain-text diagram</strong> (same as above, for non-Mermaid viewers)</summary>

```
Tool system (Bash, FileRead, FileEdit, Glob, Grep, WebFetch, Agent, MCP…)
        │
        ▼
  Anthropic SDK interface (duck-typed)
        │
        ▼
  openaiShim.ts  ← translates request / response formats
        │
        ▼
  OpenAI Chat Completions API
        │
        ▼
  Any compatible model
```

</details>

The shim covers:

| Direction | Responsibility |
| :--- | :--- |
| **Upstream** | Anthropic message blocks → OpenAI messages; system prompt arrays → system messages |
| **Tools** | `tool_use` / `tool_result` ↔ function calls |
| **Stream** | OpenAI SSE → Anthropic-style stream events |

---

## Install

> **Package name:** `@jgabriellima/openwork`  
> The **unscoped** npm name `openwork` is a **different project** — do not use `npm install -g openwork` for this repository.

> **npm registry:** If `npm install` returns **404**, the scoped package may not be published yet. Use **[from source](#option-c--from-source-contributors--bleeding-edge)** or publish via your release workflow, then retry.

### Option A — npm global

Requires [Node.js 20+](https://nodejs.org/):

```bash
npm install -g @jgabriellima/openwork@latest
```

Then run `openwork configure` once. If `openwork` is not on your `PATH`, add your npm global bin directory (the one-line installer below can append it idempotently).

### Option B — one-line installer (npm by default)

Runs `npm install -g @jgabriellima/openwork@latest` and, when needed, appends your **npm global bin** to `PATH` in your shell rc (marked idempotently). **Node + npm only** — no Git or Bun required on the target machine.

**macOS / Linux / Git Bash (Windows)**

```bash
curl -fsSL https://raw.githubusercontent.com/jambuai/openwork/main/scripts/install-openwork.sh | bash
```

**Windows (PowerShell)** — run in an open terminal (do not double-click):

```powershell
irm https://raw.githubusercontent.com/jambuai/openwork/main/scripts/install-openwork.ps1 | iex
```

| Variable | Effect |
| :--- | :--- |
| `OPENWORK_NPM_PACKAGE` | Override package (default `@jgabriellima/openwork`) |
| `OPENWORK_NPM_TAG` | Dist-tag (default `latest`) |
| `OPENWORK_SKIP_PATH_HOOK=1` | Do not edit shell rc / user `PATH` |
| `OPENWORK_PAUSE=1` | Wait for Enter before exit (useful if the window closes too fast) |

### Option C — from source (contributors / bleeding edge)

```bash
git clone https://github.com/jambuai/openwork.git
cd openwork
bun install
bun run build
node dist/cli.mjs --version
```

### Option D — Bun dev loop

```bash
git clone https://github.com/jambuai/openwork.git
cd openwork
bun install
bun run dev
```

### Publishing (maintainers)

1. Bump `"version"` in `package.json` on `main` and push.
2. Tag and push, e.g. `git tag v0.2.0 && git push origin v0.2.0` (tag should match the release version).
3. GitHub → **Releases** → create a release from that tag and publish it. The workflow [Publish npm](.github/workflows/publish-npm.yml) runs `npm publish` with the `NPM_TOKEN` secret ([Automation token](https://www.npmjs.com/settings/~/tokens)).
4. Manual publish from `main`: Actions → **Publish npm** → **Run workflow** (version follows `package.json` on `main`).

`workflow_dispatch` is restricted to `refs/heads/main` so ad-hoc publishes stay predictable.

---

## CLI provider config (`~/.openwork`)

### Interactive setup (recommended)

After install:

```bash
openwork configure
```

Alias: `openwork setup`. You choose a preset (OpenAI, Ollama, DeepSeek, OpenRouter, or custom URL), model, and API key. Configuration is stored under `~/.openwork/` with the API key **encrypted at rest**. No project `.env` is required for basic use.

### Advanced: one-shot flags

Flags can be passed once at bootstrap; OpenWork strips them from `process.argv` before the main Commander parser and persists settings under **`~/.openwork/`**:

| File | Contents |
| :--- | :--- |
| `provider.json` | `model`, `baseUrl` (`chmod 0600`) |
| `credentials.enc` | API key material, **AES-256-GCM** at rest (`chmod 0600`) |
| `.key` | Random 32-byte key used only for `credentials.enc` (`chmod 0600`) |

**Security model:** this is **not** a general-purpose secrets vault. Anyone with access to your user account (or backups) can decrypt these files. It **does** reduce accidental `git commit` of keys and avoids scattering secrets in project `.env`. Prefer full-disk encryption. Passing `--apiKey=…` may leave traces in shell history and short-lived `ps` listings — after the first save, prefer plain `openwork` so keys are read from disk only.

```bash
# Namespaced model: openai → default https://api.openai.com/v1 ; ollama → http://localhost:11434/v1
openwork --model openai/gpt-5.2 --baseUrl= --apiKey=sk-...

# Kebab-case aliases are equivalent
openwork --model ollama/llama3.1:8b --base-url http://localhost:11434/v1 --api-key ""
```

Use `--model namespace/model` so OpenWork treats the session as OpenAI-shim configuration; a bare `--model sonnet` remains on the Anthropic path.

**Later runs:** if `~/.openwork` exists, OpenWork sets `CLAUDE_CODE_USE_OPENAI=1` and merges saved model / base URL / key into the environment. For Anthropic-only for one session: `OPENWORK_SKIP_STORE=1 openwork`. To remove the profile: `rm -rf ~/.openwork`.

---

## Quick start

### 1. Configure

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
export OPENAI_MODEL=gpt-5.2
openwork
```

From source: `bun run dev` or `node dist/cli.mjs` after `bun run build`.

---

## Provider examples

<details>
<summary><strong>OpenAI</strong></summary>

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_API_KEY=sk-...
export OPENAI_MODEL=gpt-5.2
```

</details>

<details>
<summary><strong>Codex</strong> (ChatGPT auth)</summary>

`codexplan` maps to GPT-5.4 on the Codex backend with high reasoning.  
`codexspark` maps to GPT-5.3 Codex Spark for faster loops.

OpenWork reads `~/.codex/auth.json` when present. Override with `CODEX_AUTH_JSON_PATH` or `CODEX_API_KEY`.

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_MODEL=codexplan

# Optional if ~/.codex/auth.json is missing
export CODEX_API_KEY=...

openwork
```

</details>

<details>
<summary><strong>DeepSeek</strong></summary>

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_API_KEY=sk-...
export OPENAI_BASE_URL=https://api.deepseek.com/v1
export OPENAI_MODEL=deepseek-chat
```

</details>

<details>
<summary><strong>Google Gemini</strong> (via OpenRouter)</summary>

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_API_KEY=sk-or-...
export OPENAI_BASE_URL=https://openrouter.ai/api/v1
export OPENAI_MODEL=google/gemini-2.0-flash
```

</details>

<details>
<summary><strong>Ollama</strong> (local)</summary>

```bash
ollama pull llama3.3:70b

export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_BASE_URL=http://localhost:11434/v1
export OPENAI_MODEL=llama3.3:70b
# No API key for typical local setups
```

</details>

<details>
<summary><strong>LM Studio</strong></summary>

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_BASE_URL=http://localhost:1234/v1
export OPENAI_MODEL=your-model-name
```

</details>

<details>
<summary><strong>Together AI</strong></summary>

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_API_KEY=...
export OPENAI_BASE_URL=https://api.together.xyz/v1
export OPENAI_MODEL=meta-llama/Llama-3.3-70B-Instruct-Turbo
```

</details>

<details>
<summary><strong>Groq</strong></summary>

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_API_KEY=gsk_...
export OPENAI_BASE_URL=https://api.groq.com/openai/v1
export OPENAI_MODEL=llama-3.3-70b-versatile
```

</details>

<details>
<summary><strong>Mistral</strong></summary>

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_API_KEY=...
export OPENAI_BASE_URL=https://api.mistral.ai/v1
export OPENAI_MODEL=mistral-large-latest
```

</details>

<details>
<summary><strong>Azure OpenAI</strong></summary>

```bash
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_API_KEY=your-azure-key
export OPENAI_BASE_URL=https://your-resource.openai.azure.com/openai/deployments/your-deployment/v1
export OPENAI_MODEL=gpt-5.2
```

</details>

---

## Environment variables

| Variable | Required | Description |
| :--- | :---: | :--- |
| `CLAUDE_CODE_USE_OPENAI` | Yes | Set to `1` to enable the OpenAI provider path |
| `OPENAI_API_KEY` | Yes* | API key (*omit for many local providers) |
| `OPENAI_MODEL` | Yes | Model id (e.g. `gpt-5.2`, `deepseek-chat`, `llama3.3:70b`) |
| `OPENAI_BASE_URL` | No | Endpoint (default `https://api.openai.com/v1`) |
| `CODEX_API_KEY` | Codex | Token override |
| `CODEX_AUTH_JSON_PATH` | Codex | Path to Codex CLI `auth.json` |
| `CODEX_HOME` | Codex | Codex home directory (`auth.json` resolved from here) |

`ANTHROPIC_MODEL` can also influence model selection; `OPENAI_MODEL` takes priority when the shim is active.

---

## Runtime hardening

```bash
bun run smoke                    # quick startup sanity check
bun run doctor:runtime           # validate provider env + reachability
bun run doctor:runtime:json      # machine-readable diagnostics
bun run doctor:report            # write reports/doctor-runtime.json
bun run hardening:check          # smoke + runtime doctor
bun run hardening:strict         # project typecheck + hardening:check
```

- `doctor:runtime` fails fast on `CLAUDE_CODE_USE_OPENAI=1` with placeholder or missing keys for non-local providers.
- Local URLs (e.g. `http://localhost:11434/v1`) skip `OPENAI_API_KEY`.
- Codex profiles require `CODEX_API_KEY` or Codex CLI auth and probe `POST /responses` instead of `GET /models`.

### Provider launch (repo development only)

End users rely on `openwork configure` or env vars. From **this** repository you can use `.openwork-profile.json` and `provider-launch.ts`:

```bash
bun run profile:init
bun run profile:init -- --provider codex --model codexplan
bun run profile:init -- --provider openai --api-key sk-...
bun run profile:init -- --provider ollama --model llama3.1:8b

bun run dev:profile
bun run dev:profile -- ollama
bun run dev:profile -- ollama --fast --bare
```

`dev:profile` runs `doctor:runtime` first and starts the CLI only if checks pass.

---

## Capabilities

| Area | Details |
| :--- | :--- |
| **Tools** | Bash, FileRead, FileWrite, FileEdit, Glob, Grep, WebFetch, WebSearch, Agent, MCP, LSP, NotebookEdit, Tasks |
| **Streaming** | Real-time token streaming |
| **Tool calling** | Multi-step chains |
| **Vision** | Base64 and URL images for vision-capable models |
| **Slash commands** | `/commit`, `/review`, `/compact`, `/diff`, `/doctor`, … |
| **Sub-agents** | `AgentTool` uses the same configured provider |
| **Memory** | Persistent memory system |

### Known limitations

- **No extended thinking mode** — Anthropic-specific; other models use their own reasoning patterns.
- **No prompt caching** — Anthropic cache headers are not applied on the OpenAI path.
- **No Anthropic beta headers** — ignored for compatibility.
- **Output limits** — defaults favor a 32K ceiling; smaller model limits are handled gracefully.

---

## Model quality notes

| Model | Tool calling | Code quality | Speed |
| :--- | :---: | :---: | :---: |
| GPT-5.2 | Excellent | Excellent | Fast |
| DeepSeek-V3 | Great | Great | Fast |
| Gemini 2.0 Flash | Great | Good | Very fast |
| Llama 3.3 70B | Good | Good | Medium |
| Mistral Large | Good | Good | Fast |
| GPT-5-mini | Good | Good | Very fast |
| Qwen 2.5 72B | Good | Good | Medium |
| Smaller models (&lt;7B) | Limited | Limited | Very fast |

Prefer models with **strong function / tool-calling** support for reliable agent behavior.

---

## Implementation notes

Where the **Chat Completions** backend is wired in this tree (useful if you’re debugging provider issues):

| File | Role |
| :--- | :--- |
| `src/services/api/openaiShim.ts` | OpenAI-compatible shim (~724 lines): translation + streaming |
| `src/services/api/client.ts` | Routes to the shim when `CLAUDE_CODE_USE_OPENAI=1` |
| `src/utils/model/providers.ts` | `openai` provider type |
| `src/utils/model/configs.ts` | OpenAI model mappings |
| `src/utils/model/model.ts` | `OPENAI_MODEL` defaults |
| `src/utils/auth.ts` | Treats OpenAI as a valid third-party provider |

*Rough footprint when the OpenAI-shaped path was integrated: a small set of files under `src/services/api/` and model helpers; count is indicative, not a feature list.*

---

## Documentation

| Document | Purpose |
| :--- | :--- |
| [docs/PLAYBOOK.md](docs/PLAYBOOK.md) | Daily workflow, provider modes, troubleshooting |
| [docs/ENVIRONMENT_DICTIONARY.md](docs/ENVIRONMENT_DICTIONARY.md) | Environment variables and config keys |

---

## Legal notice

This project is **not** released under MIT or any other open-source license by
the maintainers. The tree may include **partial or derived** material; the
maintainers **do not claim ownership** of that material and **do not grant**
you rights to use, modify, or redistribute it. See **[NOTICE](NOTICE)** for the
full statement. If you need certainty, get legal advice before using or
shipping anything from this repository.
