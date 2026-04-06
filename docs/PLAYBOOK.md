# OpenWork Playbook (repo development)

Practical workflow for running this codebase: wire any **OpenAI Chat Completions–compatible** endpoint, keep machine-local profiles out of git, and debug provider issues with the built-in checks.

## 1. What you have

- A CLI agent loop (file/terminal tools, same UX regardless of backend).
- Traffic to the model goes through the OpenAI-shaped path: `OPENAI_BASE_URL`, `OPENAI_MODEL`, and usually `OPENAI_API_KEY` (skipped when the host does not require one).
- Repo-local profiles: `profile:init` writes `.openwork-profile.json`; `dev:profile` loads it and starts the CLI after `doctor:runtime`.
- Diagnostics: `doctor:runtime`, `doctor:runtime:json`, `doctor:report`, plus `smoke` / `hardening:*` from `package.json`.

Installed-from-npm users typically use `openwork configure` and `~/.openwork/` instead of `.openwork-profile.json`; the environment variables are the same idea.

## 2. Mental model (one harness, many hosts)

1. Pick a base URL that speaks **Chat Completions** (`…/v1` on most vendors).
2. Set the model string your host expects.
3. Set a key when the host requires it; omit or empty for many LAN endpoints.

`profile:init` supports `openai`, `ollama`, `codex`, and `gemini` presets; you can override `--base-url` and `--model` on any run. For a host not covered by a preset, start from `openai` and point `--base-url` at your gateway (OpenRouter, DeepSeek, Azure OpenAI, etc.)—still the same three knobs.

## 3. Daily start

From the repo root:

```bash
bun run dev:profile
```

`dev:profile` runs `doctor:runtime` first; if it passes, the CLI starts.

## 4. Creating or switching a profile

Examples (each overwrites `.openwork-profile.json` in the current directory):

```bash
# Remote OpenAI-compatible (key required)
bun run profile:init -- --provider openai --api-key sk-... --model gpt-5.2

# Local OpenAI-compatible (Ollama default /v1; key optional)
bun run profile:init -- --provider ollama --model llama3.1:8b

# Auto: uses ollama if localhost:11434 responds, otherwise openai (openai still needs a key)
bun run profile:init
```

Other presets shipped in `scripts/provider-bootstrap.ts`:

```bash
bun run profile:init -- --provider codex --model codexplan
bun run profile:init -- --provider gemini --api-key ... --model gemini-2.0-flash
```

Custom base URL (any preset that uses the OpenAI env block):

```bash
bun run profile:init -- --provider openai --base-url https://api.example.com/v1 --api-key ... --model your-model-id
```

Inspect what was written:

```bash
cat .openwork-profile.json
```

## 5. Health and diagnostics

```bash
bun run doctor:runtime
bun run doctor:runtime:json
bun run doctor:report    # writes reports/doctor-runtime.json
```

Hardening:

```bash
bun run hardening:check
bun run hardening:strict
```

## 6. Provider modes (what changes in practice)

| Mode | Typical `OPENAI_BASE_URL` | Key |
|------|---------------------------|-----|
| Vendor OpenAI API | `https://api.openai.com/v1` | Required (real key; placeholders fail fast) |
| Another HTTPS Chat Completions host | Vendor URL + `/v1` (or their documented path) | If the vendor requires it |
| LAN OpenAI-compatible (e.g. Ollama) | `http://localhost:11434/v1` | Often omitted |
| Codex preset | From `providerConfig` default | `CODEX_API_KEY` or Codex CLI auth file |
| Gemini preset | (Gemini-specific env in profile file) | `GEMINI_API_KEY` |

`doctor:runtime` treats localhost-style base URLs as “local” for key requirements; remote URLs without a key fail early.

## 7. Troubleshooting

### `Script not found "dev"`

You are not in the repo root (or deps missing). `cd` to this repository and run `bun install` if needed.

### `Provider reachability failed` (HTTP/S to your base URL)

- Confirm the URL matches the vendor’s Chat Completions base (trailing `/v1` is common).
- For a process on your machine: start that process, then re-run `bun run doctor:runtime`.

### `Missing key for non-local provider URL`

Remote endpoint without `OPENAI_API_KEY` (or vendor-specific key). Add a real key via `profile:init` or env.

### Placeholder / fake key rejected

Replace with a real key for that host. Local profiles should keep a localhost base URL if you intend no cloud key.

### Codex / Gemini preset errors

Those paths have extra requirements (see errors from `profile:init`—e.g. Codex auth file or Gemini API key). Fix credentials, then `bun run doctor:runtime`.

## 8. Choosing a model (practical)

- Tool calling quality matters more than raw benchmark scores for this CLI.
- Smaller local models are useful for latency experiments; expect weaker tool chains.
- After changing model, confirm the UI/session shows the new id and run a short task to validate tools.

## 9. Prompt playbook (copy/paste)

### Code understanding

- "Map this repository architecture and explain the execution flow from entrypoint to tool invocation."
- "Find the top 5 risky modules and explain why."

### Refactoring

- "Refactor this module for clarity without behavior change, then run checks and summarize diff impact."
- "Extract shared logic from duplicated functions and add minimal tests."

### Debugging

- "Reproduce the failure, identify root cause, implement fix, and validate with commands."
- "Trace this error path and list likely failure points with confidence levels."

### Reliability

- "Add runtime guardrails and fail-fast messages for invalid provider env vars."
- "Create a diagnostic command that outputs JSON report for CI artifacts."

### Review

- "Do a code review of unstaged changes, prioritize bugs/regressions, and suggest concrete patches."

## 10. Safe working rules

- Run `doctor:runtime` before chasing “model weirdness.”
- Prefer `dev:profile` over hand-editing env in multiple shells.
- Keep `.openwork-profile.json` local (gitignored); do not commit keys.
- Capture `doctor:report` when asking someone else to reproduce a provider issue.

## 11. Recovery checklist

```bash
bun run doctor:runtime
bun run doctor:report
bun run smoke
```

If you use a local daemon (e.g. Ollama) and the doctor says unreachable: start the daemon, wait until its HTTP endpoint responds, then repeat `doctor:runtime`.

## 12. Command reference

```bash
# profiles (see scripts/provider-bootstrap.ts for all flags)
bun run profile:init
bun run profile:init -- --provider openai --api-key sk-... --model gpt-5.2
bun run profile:init -- --provider ollama --model llama3.1:8b
bun run profile:init -- --provider codex --model codexplan
bun run profile:init -- --provider gemini --api-key ... --model gemini-2.0-flash

# launch (optional: pass profile name / flags after --)
bun run dev:profile
bun run dev:profile -- ollama
bun run dev:profile -- openai

# diagnostics
bun run doctor:runtime
bun run doctor:runtime:json
bun run doctor:report

# quality
bun run smoke
bun run hardening:check
bun run hardening:strict
```

## 13. Success criteria

- `bun run doctor:runtime` passes reachability and credential checks for your chosen base URL.
- `bun run dev:profile` starts the CLI without provider errors.
- The active model id matches what you configured in the profile.
