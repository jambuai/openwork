# OpenWork

**Terminal coding agent** — you point it at an **OpenAI-compatible Chat Completions** URL and model, then drive the session from the shell.

GPT-5.2 · DeepSeek · OpenRouter · Ollama · LM Studio · Azure · Groq · 200+ models

[Node.js](https://nodejs.org/)
[TypeScript](https://www.typescriptlang.org/)
[GitHub](https://github.com/jambuai/openwork)

[Install](#install) · [Configure](#cli-provider-config-openwork) · [Quick start](#quick-start) · [Providers](#provider-examples) · [Docs](#documentation)

---

## At a glance


|                        |                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **What you get**       | A REPL-style session with tools, streaming, MCP, slash commands, sub-agents, and memory — as implemented in this tree.         |
| **What you configure** | `OPENAI_BASE_URL` + `OPENAI_MODEL` (or `openwork configure`). Traffic to the model is **Chat Completions**-shaped on the wire. |
| **How you run it**     | `openwork configure` once (optional), then `openwork` in your repo. Keys can live under `~/.openwork/` (encrypted at rest).    |
| **Requirements**       | Node **20+** for the published CLI; **Bun** recommended for building from source.                                              |


---

## Table of contents

1. [At a glance](#at-a-glance)
2. [Using OpenWork](#using-openwork)
3. [Install](#install)
4. [CLI provider config (`~/.openwork`)](#cli-provider-config-openwork)
5. [Quick start](#quick-start)
6. [Provider examples](#provider-examples)
7. [Environment variables](#environment-variables)
8. [Runtime hardening](#runtime-hardening)
9. [Capabilities](#capabilities)
10. [Model quality notes](#model-quality-notes)
11. [Implementation notes](#implementation-notes)
12. [Documentation](#documentation)
13. [Legal notice](#legal-notice)
14. [Disclaimer](#disclaimer)

---

## Using OpenWork

1. **Install** — see [Install](#install); from source is the reliable path if the registry package is missing.
2. **Point at a model** — run `openwork configure`, or set `OPENAI_BASE_URL`, `OPENAI_MODEL`, and `OPENAI_API_KEY` (when the host requires one). Local stacks (Ollama, LM Studio, etc.) use a LAN URL and often no key.
3. **Work in a repo** — run `openwork` in the project directory. Use the built-in tools, `/commands`, and MCP the UI exposes; behavior matches what this build ships, not a marketing checklist.
4. **Read the ops docs** — [RUNBOOK](docs/RUNBOOK.md) and [ENVIRONMENT_DICTIONARY](docs/ENVIRONMENT_DICTIONARY.md) for flags, env vars, and failure modes.

---

## Install

> **Package name:** `@jambulab/openwork`  

### Option A — npm global

Requires [Node.js 20+](https://nodejs.org/):

```bash
npm install -g @jambulab/openwork@latest
```

Then run `openwork configure` once. If `openwork` is not on your `PATH`, add your npm global bin directory (the one-line installer below can append it idempotently).

### Option B — one-line installer (npm by default)

Runs `npm install -g @jambulab/openwork@latest` and, when needed, appends your **npm global bin** to `PATH` in your shell rc (marked idempotently). **Node + npm only** — no Git or Bun required on the target machine.

**macOS / Linux / Git Bash (Windows)**

```bash
curl -fsSL https://raw.githubusercontent.com/jambuai/openwork/main/scripts/install-openwork.sh | bash
```

**Windows (PowerShell)** — run in an open terminal (do not double-click):

```powershell
irm https://raw.githubusercontent.com/jambuai/openwork/main/scripts/install-openwork.ps1 | iex
```


| Variable                    | Effect                                                            |
| --------------------------- | ----------------------------------------------------------------- |
| `OPENWORK_NPM_PACKAGE`      | Override package (default `@jambulab/openwork`)                   |
| `OPENWORK_NPM_TAG`          | Dist-tag (default `latest`)                                       |
| `OPENWORK_SKIP_PATH_HOOK=1` | Do not edit shell rc / user `PATH`                                |
| `OPENWORK_PAUSE=1`          | Wait for Enter before exit (useful if the window closes too fast) |


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

**Default (automated):** [Changesets](https://github.com/changesets/changesets) drives releases via [`.github/workflows/release.yml`](.github/workflows/release.yml).

1. Ship user-facing work with a `.changeset/` file per PR (`bunx changeset` before merge).
2. Pushes to `main` open or update the **“chore: version packages”** PR (`CHANGELOG.md` + `package.json` version).
3. Merging that PR runs **`npm publish`** (`prepack` runs the build) and creates a **GitHub Release**. The published tarball includes `README.md`, `CHANGELOG.md`, and other paths listed under `package.json` → `files`.

**Why `npm publish` locally at the same version fails:** the public registry **never accepts a republish** of an existing version (e.g. `0.2.0`). The next version comes from the version PR, not from hand-editing `package.json` to “refresh the README”.

**Escape hatch:** GitHub Actions → [Manual npm publish](.github/workflows/publish-npm.yml) → **Run workflow** on `main` with a `package.json` **version that does not already exist** on npm. Requires the `NPM_TOKEN` secret ([Automation token](https://www.npmjs.com/settings/~/tokens)).

---

## CLI provider config (`~/.openwork`)

### Interactive setup (recommended)

After install:

```bash
openwork configure
```

Alias: `openwork setup`. You choose a preset (OpenAI, Ollama, DeepSeek, OpenRouter, or custom URL), model, and API key. Configuration is stored under `~/.openwork/` with the API key **encrypted at rest**. No project `.env` is required for basic use.

### Advanced: one-shot flags

Flags can be passed once at bootstrap; OpenWork strips them from `process.argv` before the main Commander parser and persists settings under `**~/.openwork/`**:


| File              | Contents                                                          |
| ----------------- | ----------------------------------------------------------------- |
| `provider.json`   | `model`, `baseUrl` (`chmod 0600`)                                 |
| `credentials.enc` | API key material, **AES-256-GCM** at rest (`chmod 0600`)          |
| `.key`            | Random 32-byte key used only for `credentials.enc` (`chmod 0600`) |


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

## *Provider examples*

Set `CLAUDE_CODE_USE_OPENAI=1` plus `OPENAI_BASE_URL` and `OPENAI_MODEL` for your target. All remote providers also need `OPENAI_API_KEY`; local ones typically do not.


| Provider     | `OPENAI_BASE_URL`                                                        | `OPENAI_MODEL`                            |
| ------------ | ------------------------------------------------------------------------ | ----------------------------------------- |
| OpenAI       | *(default)*                                                              | `gpt-5.2`                                 |
| DeepSeek     | `https://api.deepseek.com/v1`                                            | `deepseek-chat`                           |
| Groq         | `https://api.groq.com/openai/v1`                                         | `llama-3.3-70b-versatile`                 |
| Mistral      | `https://api.mistral.ai/v1`                                              | `mistral-large-latest`                    |
| Together AI  | `https://api.together.xyz/v1`                                            | `meta-llama/Llama-3.3-70B-Instruct-Turbo` |
| OpenRouter   | `https://openrouter.ai/api/v1`                                           | `google/gemini-2.0-flash`                 |
| Azure OpenAI | `https://<resource>.openai.azure.com/openai/deployments/<deployment>/v1` | deployment name                           |
| Ollama       | `http://localhost:11434/v1`                                              | `llama3.3:70b`                            |
| LM Studio    | `http://localhost:1234/v1`                                               | loaded model name                         |
| Codex        | *(default)*                                                              | `codexplan` · `codexspark`                |


---

## Environment variables


| Variable                 | Required | Description                                                |
| ------------------------ | -------- | ---------------------------------------------------------- |
| `CLAUDE_CODE_USE_OPENAI` | Yes      | Set to `1` to enable the OpenAI provider path              |
| `OPENAI_API_KEY`         | Yes*     | API key (*omit for many local providers)                   |
| `OPENAI_MODEL`           | Yes      | Model id (e.g. `gpt-5.2`, `deepseek-chat`, `llama3.3:70b`) |
| `OPENAI_BASE_URL`        | No       | Endpoint (default `https://api.openai.com/v1`)             |
| `CODEX_API_KEY`          | Codex    | Token override                                             |
| `CODEX_AUTH_JSON_PATH`   | Codex    | Path to Codex CLI `auth.json`                              |
| `CODEX_HOME`             | Codex    | Codex home directory (`auth.json` resolved from here)      |


`ANTHROPIC_MODEL` can also influence model selection; `OPENAI_MODEL` takes priority when the shim is active.

For the full list of system-wide environment variables, see [ENVIRONMENT_DICTIONARY](docs/ENVIRONMENT_DICTIONARY.md).

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


| Area               | Details                                                                                                    |
| ------------------ | ---------------------------------------------------------------------------------------------------------- |
| **Tools**          | Bash, FileRead, FileWrite, FileEdit, Glob, Grep, WebFetch, WebSearch, Agent, MCP, LSP, NotebookEdit, Tasks |
| **Streaming**      | Real-time token streaming                                                                                  |
| **Tool calling**   | Multi-step chains                                                                                          |
| **Vision**         | Base64 and URL images for vision-capable models                                                            |
| **Slash commands** | `/commit`, `/review`, `/compact`, `/diff`, `/doctor`, …                                                    |
| **Sub-agents**     | `AgentTool` uses the same configured provider                                                              |
| **Memory**         | Persistent memory system                                                                                   |


### Known limitations

- **No extended thinking mode** — Anthropic-specific; other models use their own reasoning patterns.
- **No prompt caching** — Anthropic cache headers are not applied on the OpenAI path.
- **No Anthropic beta headers** — ignored for compatibility.
- **Output limits** — defaults favor a 32K ceiling; smaller model limits are handled gracefully.

---

## Model quality notes


| Model                | Tool calling | Code quality | Speed     |
| -------------------- | ------------ | ------------ | --------- |
| GPT-5.2              | Excellent    | Excellent    | Fast      |
| DeepSeek-V3          | Great        | Great        | Fast      |
| Gemini 2.0 Flash     | Great        | Good         | Very fast |
| Llama 3.3 70B        | Good         | Good         | Medium    |
| Mistral Large        | Good         | Good         | Fast      |
| GPT-5-mini           | Good         | Good         | Very fast |
| Qwen 2.5 72B         | Good         | Good         | Medium    |
| Smaller models (<7B) | Limited      | Limited      | Very fast |


Prefer models with **strong function / tool-calling** support for reliable agent behavior.

---

## Implementation notes

Where the **Chat Completions** backend is wired in this tree (useful if you’re debugging provider issues):


| File                             | Role                                                         |
| -------------------------------- | ------------------------------------------------------------ |
| `src/services/api/openaiShim.ts` | OpenAI-compatible shim (~724 lines): translation + streaming |
| `src/services/api/client.ts`     | Routes to the shim when `CLAUDE_CODE_USE_OPENAI=1`           |
| `src/utils/model/providers.ts`   | `openai` provider type                                       |
| `src/utils/model/configs.ts`     | OpenAI model mappings                                        |
| `src/utils/model/model.ts`       | `OPENAI_MODEL` defaults                                      |
| `src/utils/auth.ts`              | Treats OpenAI as a valid third-party provider                |


*Rough footprint when the OpenAI-shaped path was integrated: a small set of files under `src/services/api/` and model helpers; count is indicative, not a feature list.*

---

## Documentation


| Document                                                         | Purpose                                         |
| ---------------------------------------------------------------- | ----------------------------------------------- |
| [docs/RUNBOOK.md](docs/RUNBOOK.md)                               | Daily workflow, provider modes, troubleshooting |
| [docs/ENVIRONMENT_DICTIONARY.md](docs/ENVIRONMENT_DICTIONARY.md) | Environment variables and config keys           |


---

## Legal notice

This project is **not** released under MIT or any other open-source license by
the maintainers. The tree may include **partial or derived** material; the
maintainers **do not claim ownership** of that material and **do not grant**
you rights to use, modify, or redistribute it. See **[NOTICE](NOTICE)** for the
full statement. If you need certainty, get legal advice before using or
shipping anything from this repository.

---

## Disclaimer

> **This repository exists for educational and research purposes only.**

This codebase is derived from leaked or publicly circulated source material that was not originally authored here. It is being studied, annotated, and experimentally modified strictly as a learning exercise — to understand how large-scale AI agent systems are architected, how tool orchestration works at the runtime level, and how compatibility shims are built between model APIs.

**What this is not:**

- A product or a fork claiming original authorship
- A distribution intended for commercial use or profit
- A project asserting any intellectual property rights over the underlying code

**What this is:**

- A private research sandbox
- A reference for studying real-world agent infrastructure
- A testbed for applying improvements and observing their effects in context

If you are the rightful owner of any part of this code and want it removed, open an issue or reach out directly. Takedown requests will be honored promptly and without dispute. No infringement is intentional.