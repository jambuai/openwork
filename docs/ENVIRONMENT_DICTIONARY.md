# Environment Variables and Configuration Parameters Dictionary - OpenWork

Complete documentation of all environment variables, configuration parameters, and constants used by OpenWork.

---

## Table of Contents

1. [API Configuration (OpenAI-compatible)](#1-api-configuration-openai-compatible)
2. [Anthropic Configuration (Native)](#2-anthropic-configuration-native)
3. [Other Model Providers Configuration](#3-other-model-providers-configuration)
4. [OAuth Authentication Configuration](#4-oauth-authentication-configuration)
5. [OpenTelemetry (OTEL) Configuration](#5-opentelemetry-otel-configuration)
6. [Tracing and Observability Configuration](#6-tracing-and-observability-configuration)
7. [Feature Flags Configuration](#7-feature-flags-configuration)
8. [UI/Terminal Configuration](#8-uiterminal-configuration)
9. [Performance and Limits Configuration](#9-performance-and-limits-configuration)
10. [Development/Debug Configuration](#10-developmentdebug-configuration)
11. [Communication and Bridge Configuration](#11-communication-and-bridge-configuration)
12. [Privacy and Security Configuration](#12-privacy-and-security-configuration)
13. [Partners and Integrations Configuration](#13-partners-and-integrations-configuration)
14. [Environment and Runtime Configuration](#14-environment-and-runtime-configuration)
15. [Global Config Keys](#15-global-config-keys)
16. [Project Config Keys](#16-project-config-keys)

---

## 1. API Configuration (OpenAI-compatible)

### Main Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CLAUDE_CODE_USE_OPENAI` | Yes | - | Enables the OpenAI provider. Set to `1` to enable the OpenAI-compatible shim |
| `OPENAI_API_KEY` | *Conditional | - | OpenAI API key. *Optional for local models (Ollama, LM Studio) |
| `OPENAI_BASE_URL` | No | `https://api.openai.com/v1` | OpenAI API base URL |
| `OPENAI_MODEL` | Yes | `gpt-5.2` | Model name to use |
| `OPENAI_API_BASE` | No | - | Alternative for `OPENAI_BASE_URL` |

### Codex (ChatGPT)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `CODEX_API_KEY` | Codex only | - | Codex/ChatGPT access token |
| `CODEX_AUTH_JSON_PATH` | Codex only | `~/.codex/auth.json` | Path to Codex CLI auth.json file |
| `CODEX_HOME` | Codex only | `~/.codex` | Alternative Codex home directory |

**Codex Model Aliases:**
- `codexplan` → `gpt-5.4` (high reasoning)
- `codexspark` → `gpt-5.3-codex-spark`

**Provider Examples:**

```bash
# OpenAI
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_API_KEY=sk-...
export OPENAI_MODEL=gpt-5.2

# DeepSeek
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_API_KEY=sk-...
export OPENAI_BASE_URL=https://api.deepseek.com/v1
export OPENAI_MODEL=deepseek-chat

# Ollama (local)
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_BASE_URL=http://localhost:11434/v1
export OPENAI_MODEL=llama3.3:70b

# Together AI
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_API_KEY=...
export OPENAI_BASE_URL=https://api.together.xyz/v1
export OPENAI_MODEL=meta-llama/Llama-3.3-70B-Instruct-Turbo

# Groq
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_API_KEY=gsk_...
export OPENAI_BASE_URL=https://api.groq.com/openai/v1
export OPENAI_MODEL=llama-3.3-70b-versatile

# Mistral
export CLAUDE_CODE_USE_OPENAI=1
export OPENAI_API_KEY=...
export OPENAI_BASE_URL=https://api.mistral.ai/v1
export OPENAI_MODEL=mistral-large-latest
```

---

## 2. Anthropic Configuration (Native)

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | For native use | - | Anthropic API key |
| `ANTHROPIC_AUTH_TOKEN` | No | - | OAuth authentication token |
| `ANTHROPIC_BASE_URL` | No | - | Custom API base URL |
| `ANTHROPIC_MODEL` | No | - | Anthropic model to use |
| `ANTHROPIC_BETAS` | No | - | Enabled beta features |
| `ANTHROPIC_UNIX_SOCKET` | No | - | Unix socket for connection |

### Model Configuration

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_DEFAULT_SONNET_MODEL` | Default Sonnet model |
| `ANTHROPIC_DEFAULT_SONNET_MODEL_DESCRIPTION` | Sonnet model description |
| `ANTHROPIC_DEFAULT_SONNET_MODEL_NAME` | Sonnet model name |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL` | Default Haiku model |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL_DESCRIPTION` | Haiku model description |
| `ANTHROPIC_DEFAULT_HAIKU_MODEL_NAME` | Haiku model name |
| `ANTHROPIC_DEFAULT_OPUS_MODEL` | Default Opus model |
| `ANTHROPIC_DEFAULT_OPUS_MODEL_DESCRIPTION` | Opus model description |
| `ANTHROPIC_DEFAULT_OPUS_MODEL_NAME` | Opus model name |
| `ANTHROPIC_SMALL_FAST_MODEL` | Small and fast model |
| `ANTHROPIC_SMALL_FAST_MODEL_AWS_REGION` | AWS region for fast model |

### AWS Bedrock

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_BEDROCK_BASE_URL` | Bedrock base URL |
| `BEDROCK_BASE_URL` | Alternative Bedrock URL |
| `AWS_REGION` | AWS region |
| `AWS_DEFAULT_REGION` | Default AWS region |
| `AWS_EXECUTION_ENV` | AWS execution environment |
| `AWS_LAMBDA_FUNCTION_NAME` | Lambda function name |
| `AWS_BEARER_TOKEN_BEDROCK` | Bearer token for Bedrock |

### Google Vertex AI

| Variable | Description |
|----------|-------------|
| `ANTHROPIC_VERTEX_PROJECT_ID` | Vertex project ID |
| `ANTHROPIC_FOUNDRY_API_KEY` | Foundry API key |
| `ANTHROPIC_FOUNDRY_BASE_URL` | Foundry base URL |
| `ANTHROPIC_FOUNDRY_RESOURCE` | Foundry resource |
| `VERTEX_BASE_URL` | Vertex base URL |

---

## 3. Other Model Providers Configuration

### Google Gemini

| Variable | Description |
|----------|-------------|
| `GEMINI_API_KEY` | Gemini API key |
| `GOOGLE_API_KEY` | Alias for GEMINI_API_KEY |
| `GEMINI_BASE_URL` | Gemini API base URL |
| `GEMINI_MODEL` | Gemini model to use |

### Groq

| Variable | Description |
|----------|-------------|
| `GROQ_API_KEY` | Groq API key |
| `GROQ_MODEL` | Groq model to use |

---

## 4. OAuth Authentication Configuration

| Variable | Description |
|----------|-------------|
| `CLAUDE_CODE_CUSTOM_OAUTH_URL` | Custom OAuth URL |
| `CLAUDE_BRIDGE_OAUTH_TOKEN` | OAuth token for bridge |
| `USE_STAGING_OAUTH` | Use staging environment |
| `USE_LOCAL_OAUTH` | Use local OAuth |

---

## 5. OpenTelemetry (OTEL) Configuration

### Anthropic OpenTelemetry (Production)

| Variable | Default | Description |
|----------|---------|-------------|
| `ANT_OTEL_EXPORTER_OTLP_ENDPOINT` | - | Anthropic OTLP endpoint |
| `ANT_OTEL_EXPORTER_OTLP_HEADERS` | - | Anthropic OTLP headers |
| `ANT_OTEL_EXPORTER_OTLP_PROTOCOL` | - | OTLP protocol (http/protobuf or grpc) |
| `ANT_OTEL_TRACES_EXPORTER` | - | Traces exporter |
| `ANT_OTEL_METRICS_EXPORTER` | - | Metrics exporter |
| `ANT_OTEL_LOGS_EXPORTER` | - | Logs exporter |

### Standard OpenTelemetry (Langfuse/Custom)

| Variable | Default | Description |
|----------|---------|-------------|
| `OTEL_EXPORTER_OTLP_ENDPOINT` | - | OTLP endpoint for traces |
| `OTEL_EXPORTER_OTLP_HEADERS` | - | OTLP headers (Base64 format) |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | - | Export protocol |
| `OTEL_EXPORTER_OTLP_TRACES_PROTOCOL` | - | Protocol for traces |
| `OTEL_EXPORTER_OTLP_LOGS_PROTOCOL` | - | Protocol for logs |
| `OTEL_EXPORTER_OTLP_METRICS_PROTOCOL` | - | Protocol for metrics |
| `OTEL_TRACES_EXPORTER` | - | Traces exporter type |
| `OTEL_METRICS_EXPORTER` | - | Metrics exporter type |
| `OTEL_LOGS_EXPORTER` | - | Logs exporter type |
| `OTEL_TRACES_EXPORT_INTERVAL` | - | Traces export interval |
| `OTEL_METRIC_EXPORT_INTERVAL` | - | Metrics export interval |
| `OTEL_LOGS_EXPORT_INTERVAL` | - | Logs export interval |

### Specific Headers

| Variable | Description |
|----------|-------------|
| `OTEL_EXPORTER_OTLP_LOGS_ENDPOINT` | Specific endpoint for logs |
| `OTEL_EXPORTER_OTLP_LOGS_HEADERS` | Specific headers for logs |
| `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` | Endpoint for metrics |
| `OTEL_EXPORTER_OTLP_METRICS_HEADERS` | Headers for metrics |
| `OTEL_EXPORTER_OTLP_METRICS_CLIENT_CERTIFICATE` | Client certificate |
| `OTEL_EXPORTER_OTLP_METRICS_CLIENT_KEY` | Client key |
| `OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE` | Temporality preference |
| `OTEL_EXPORTER_OTLP_TRACES_HEADERS` | Headers for traces |

### Langfuse Configuration

| Variable | Description |
|----------|-------------|
| `LANGFUSE_PUBLIC_KEY` | Langfuse public key |
| `LANGFUSE_SECRET_KEY` | Langfuse secret key |
| `LANGFUSE_BASE_URL` | Langfuse base URL |

### Content Logging

| Variable | Description |
|----------|-------------|
| `OTEL_LOG_USER_PROMPTS` | Include user prompts in spans |
| `OTEL_LOG_TOOL_CONTENT` | Include tool content |
| `OTEL_LOG_TOOL_DETAILS` | Include tool details |

---

## 6. Tracing and Observability Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `CLAUDE_CODE_ENABLE_TELEMETRY` | - | Enable telemetry |
| `CLAUDE_CODE_ENHANCED_TELEMETRY_BETA` | - | Enhanced beta telemetry |
| `ENABLE_BETA_TRACING_DETAILED` | - | Detailed beta tracing |
| `BETA_TRACING_ENDPOINT` | - | Endpoint for beta tracing |
| `CLAUDE_CODE_OTEL_FLUSH_TIMEOUT_MS` | - | OTEL flush timeout |
| `CLAUDE_CODE_OTEL_SHUTDOWN_TIMEOUT_MS` | - | OTEL shutdown timeout |
| `CLAUDE_CODE_OTEL_HEADERS_HELPER_DEBOUNCE_MS` | - | Headers helper debounce |
| `DEFAULT_OTEL_HEADERS_DEBOUNCE_MS` | - | Default headers debounce |
| `ANT_CLAUDE_CODE_METRICS_ENDPOINT` | - | Anthropic metrics endpoint |

---

## 7. Feature Flags Configuration

### Main Switches

| Variable | Description |
|----------|-------------|
| `CLAUDE_CODE_USE_OPENAI` | Use OpenAI provider (1=enabled) |
| `CLAUDE_CODE_ENABLE_TASKS` | Enable tasks system |
| `CLAUDE_CODE_ENABLE_TELEMETRY` | Enable telemetry |
| `CLAUDE_CODE_ENABLE_TOKEN_USAGE_ATTACHMENT` | Attach token usage |
| `CLAUDE_CODE_ENABLE_FINE_GRAINED_TOOL_STREAMING` | Fine-grained tool streaming |
| `CLAUDE_CODE_ENABLE_PROMPT_SUGGESTION` | Prompt suggestions |
| `CLAUDE_CODE_ENABLE_SDK_FILE_CHECKPOINTING` | SDK file checkpointing |
| `CLAUDE_CODE_ENABLE_CFC` | Enable CFC |
| `CLAUDE_CODE_ENABLE_XAA` | Enable XAA |

### Disable Switches

| Variable | Description |
|----------|-------------|
| `CLAUDE_CODE_DISABLE_1M_CONTEXT` | Disable 1M context |
| `CLAUDE_CODE_DISABLE_ADAPTIVE_THINKING` | Disable adaptive thinking |
| `CLAUDE_CODE_DISABLE_ADVISOR_TOOL` | Disable advisor tool |
| `CLAUDE_CODE_DISABLE_ATTACHMENTS` | Disable attachments |
| `CLAUDE_CODE_DISABLE_AUTO_MEMORY` | Disable automatic memory |
| `CLAUDE_CODE_DISABLE_BACKGROUND_TASKS` | Disable background tasks |
| `CLAUDE_CODE_DISABLE_CLAUDE_MDS` | Disable CLAUDE.md files |
| `CLAUDE_CODE_DISABLE_COMMAND_INJECTION_CHECK` | Disable injection check |
| `CLAUDE_CODE_DISABLE_CRON` | Disable cron |
| `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS` | Disable experimental betas |
| `CLAUDE_CODE_DISABLE_FAST_MODE` | Disable fast mode |
| `CLAUDE_CODE_DISABLE_FEEDBACK_SURVEY` | Disable feedback survey |
| `CLAUDE_CODE_DISABLE_FILE_CHECKPOINTING` | Disable checkpointing |
| `CLAUDE_CODE_DISABLE_GIT_INSTRUCTIONS` | Disable git instructions |
| `CLAUDE_CODE_DISABLE_LEGACY_MODEL_REMAP` | Disable legacy model remapping |
| `CLAUDE_CODE_DISABLE_MESSAGE_ACTIONS` | Disable message actions |
| `CLAUDE_CODE_DISABLE_MOUSE` | Disable mouse |
| `CLAUDE_CODE_DISABLE_MOUSE_CLICKS` | Disable mouse clicks |
| `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` | Disable non-essential traffic |
| `CLAUDE_CODE_DISABLE_NONSTREAMING_FALLBACK` | Disable non-streaming fallback |
| `CLAUDE_CODE_DISABLE_OFFICIAL_MARKETPLACE_AUTOINSTALL` | Disable auto-install |
| `CLAUDE_CODE_DISABLE_POLICY_SKILLS` | Disable policy skills |
| `CLAUDE_CODE_DISABLE_PRECOMPACT_SKIP` | Disable precompact skip |
| `CLAUDE_CODE_DISABLE_SESSION_DATA_UPLOAD` | Disable session data upload |
| `CLAUDE_CODE_DISABLE_TERMINAL_TITLE` | Disable terminal title |
| `CLAUDE_CODE_DISABLE_THINKING` | Disable thinking |
| `CLAUDE_CODE_DISABLE_VIRTUAL_SCROLL` | Disable virtual scroll |

---

## 8. UI/Terminal Configuration

### Themes and Appearance

| Variable | Default | Description |
|----------|---------|-------------|
| `BAT_THEME` | - | Theme for syntax highlighting |
| `CLAUDE_CODE_THEME` | `dark` | Claude Code theme |

### Editor

| Variable | Default | Description |
|----------|---------|-------------|
| `EDITOR` | `vim` | Default editor |
| `VISUAL` | - | Visual editor |

### Terminal

| Variable | Description |
|----------|-------------|
| `TERM` | Terminal type |
| `TERM_PROGRAM` | Terminal program |
| `TERM_PROGRAM_VERSION` | Program version |
| `TERMINAL` | Alternative terminal |
| `TERMINAL_EMULATOR` | Terminal emulator |
| `TMUX` | Indicates execution inside tmux |
| `TMUX_PANE` | tmux pane ID |
| `STY` | Screen session ID |
| `SHELL` | Default shell |
| `CLAUDE_CODE_FORCE_FULL_LOGO` | Force full logo display |
| `CLAUDE_CODE_BASH_SANDBOX_SHOW_INDICATOR` | Show sandbox indicator |

### Notifications

| Variable | Description |
|----------|-------------|
| `CLAUDE_CODE_PREFFERED_NOTIF_CHANNEL` | Preferred notification channel |
| `taskCompleteNotifEnabled` | Task complete notification |
| `inputNeededNotifEnabled` | Input needed notification |
| `agentPushNotifEnabled` | Agent push notification |

---

## 9. Performance and Limits Configuration

### API and Tokens

| Variable | Default | Description |
|----------|---------|-------------|
| `API_TIMEOUT_MS` | - | API timeout in ms |
| `API_MAX_INPUT_TOKENS` | - | Maximum input tokens |
| `API_TARGET_INPUT_TOKENS` | - | Target input tokens |
| `BASH_MAX_OUTPUT_LENGTH` | - | Maximum Bash output length |
| `TASK_MAX_OUTPUT_LENGTH` | - | Maximum task output length |
| `SLASH_COMMAND_TOOL_CHAR_BUDGET` | - | Character budget for slash commands |
| `CLAUDE_CODE_FILE_READ_MAX_OUTPUT_TOKENS` | - | Token limit for file reading |
| `CLAUDE_CODE_BLOCKING_LIMIT_OVERRIDE` | - | Blocking limit override |

### Compaction and Auto-compact

| Variable | Description |
|----------|-------------|
| `CLAUDE_CODE_AUTO_COMPACT_WINDOW` | Auto-compact window |
| `CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | Percentage override |
| `CLAUDE_AFTER_LAST_COMPACT` | After last compact |
| `CLAUDE_CODE_DISABLE_PRECOMPACT_SKIP` | Disable precompact skip |

---

## 10. Development/Debug Configuration

### Logging

| Variable | Description |
|----------|-------------|
| `CLAUDE_CODE_DEBUG_LOG_LEVEL` | Debug log level |
| `CLAUDE_CODE_DEBUG_LOGS_DIR` | Debug logs directory |
| `CLAUDE_CODE_DIAGNOSTICS_FILE` | Diagnostics file |
| `DEBUG` | General debug |
| `VERBOSE` | Verbose mode |
| `CLAUDE_CODE_VERBOSE` | Claude Code-specific verbose |

### Debug Features

| Variable | Description |
|----------|-------------|
| `CLAUDE_CODE_DEBUG_REPAINTS` | Debug repaints |
| `CLAUDE_CODE_FRAME_TIMING_LOG` | Frame timing log |
| `CLAUDE_CODE_EAGER_FLUSH` | Eager flush |
| `CLAUDE_CODE_EXIT_AFTER_FIRST_RENDER` | Exit after first render |
| `CLAUDE_CODE_EXIT_AFTER_STOP_DELAY` | Delay to exit after stop |
| `CLAUDE_CODE_DUMP_AUTO_MODE` | Dump auto mode |

### Testing

| Variable | Description |
|----------|-------------|
| `TEST_ENABLE_SESSION_PERSISTENCE` | Enable session persistence |
| `VCR_RECORD` | VCR recording |
| `SWE_BENCH_INSTANCE_ID` | SWE-Bench instance ID |
| `SWE_BENCH_RUN_ID` | SWE-Bench run ID |
| `SWE_BENCH_TASK_ID` | SWE-Bench task ID |

---

## 11. Communication and Bridge Configuration

### Bridge/CCR

| Variable | Description |
|----------|-------------|
| `CLAUDE_CODE_CCR_MIRROR` | CCR mirror |
| `CCR_ENABLE_BUNDLE` | Enable CCR bundle |
| `CCR_FORCE_BUNDLE` | Force CCR bundle |
| `CLAUDE_BRIDGE_BASE_URL` | Bridge base URL |
| `CLAUDE_BRIDGE_SESSION_INGRESS_URL` | Session ingress URL |
| `SESSION_INGRESS_URL` | Session ingress URL |
| `CLAUDE_BRIDGE_USE_CCR_V2` | Use CCR v2 |

### Multi-Agent

| Variable | Description |
|----------|-------------|
| `CLAUDE_CODE_AGENT` | Active agent |
| `CLAUDE_CODE_AGENT_ID` | Agent ID |
| `CLAUDE_CODE_AGENT_NAME` | Agent name |
| `CLAUDE_CODE_AGENT_COLOR` | Agent color |
| `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS` | Experimental agent teams |
| `CLAUDE_CODE_AGENT_LIST_IN_MESSAGES` | List agents in messages |
| `CLAUDE_CODE_COORDINATOR_MODE` | Coordinator mode |
| `CLAUDE_CODE_COWORKER_TYPE` | Coworker type |
| `COWORKER_TYPE_TELEMETRY` | Coworker type telemetry |

---

## 12. Privacy and Security Configuration

| Variable | Description |
|----------|-------------|
| `CLAUDE_CODE_ADDITIONAL_PROTECTION` | Additional protection |
| `CLAUDE_CODE_BUBBLEWRAP` | Bubblewrap enabled |
| `CLAUDE_CODE_FORCE_SANDBOX` | Force sandbox |
| `CLAUDE_CODE_DONT_INHERIT_ENV` | Do not inherit env |
| `NO_PROXY` | Proxy disabled |
| `no_proxy` | Proxy disabled (lowercase) |
| `SSL_CERT_FILE` | SSL certificate file |
| `NODE_EXTRA_CA_CERTS` | Extra CA certificates |

---

## 13. Partners and Integrations Configuration

### Git

| Variable | Description |
|----------|-------------|
| `CLAUDE_CODE_BASE_REF` | Base git reference |
| `CLAUDE_CODE_COMMIT_LOG` | Commit log |
| `CLAUDE_CODE_GIT_BASH_PATH` | Git Bash path |

### Container/Cloud

| Variable | Description |
|----------|-------------|
| `CLAUDE_CODE_CONTAINER_ID` | Container ID |
| `CI` | CI environment |
| `CF_PAGES` | Cloudflare Pages |
| `CIRCLECI` | CircleCI |
| `BUILDKITE` | Buildkite |
| `VERCEL` | Vercel |
| `NETLIFY` | Netlify |
| `RAILWAY_ENVIRONMENT_NAME` | Railway environment |
| `RAILWAY_SERVICE_NAME` | Railway service |
| `RENDER` | Render |
| `REPL_ID` | Replit ID |
| `REPL_SLUG` | Replit slug |

### MCP (Model Context Protocol)

| Variable | Description |
|----------|-------------|
| `ALLOW_ANT_COMPUTER_USE_MCP` | Allow computer use MCP |
| `MCP_XAA_IDP_CLIENT_SECRET` | MCP XAA client secret |

---

## 14. Environment and Runtime Configuration

### Paths

| Variable | Description |
|----------|-------------|
| `HOME` | Home directory |
| `USER` | User |
| `USERNAME` | Username |
| `USERPROFILE` | User profile (Windows) |
| `PWD` | Current directory |
| `TEMP` | Temp directory |
| `TMPDIR` | Temp directory |
| `XDG_CONFIG_HOME` | XDG config home |
| `PATH` | System path |
| `APPDATA` | AppData (Windows) |

### Node.js

| Variable | Description |
|----------|-------------|
| `NODE_ENV` | Node environment (development/production) |
| `NODE_OPTIONS` | Node options |
| `UV_THREADPOOL_SIZE` | Thread pool size |

### Runtime

| Variable | Description |
|----------|-------------|
| `RUNNER_ENVIRONMENT` | Runner environment |
| `RUNNER_OS` | Runner OS |

---

## 15. Global Config Keys

Persistent settings stored in `~/.claude/config.json`:

| Key | Type | Description |
|-----|------|-------------|
| `apiKeyHelper` | string | @deprecated - API key helper |
| `installMethod` | string | Installation method |
| `autoUpdates` | boolean | Automatic updates |
| `autoUpdatesProtectedForNative` | boolean | Protection for native updates |
| `theme` | string | Theme (`dark`, `light`, `system`) |
| `verbose` | boolean | Verbose mode |
| `preferredNotifChannel` | string | Preferred notification channel |
| `shiftEnterKeyBindingInstalled` | boolean | Shift+Enter keybinding |
| `editorMode` | string | Editor mode (`normal`, `vim`) |
| `hasUsedBackslashReturn` | boolean | Has used backslash return |
| `autoCompactEnabled` | boolean | Auto-compact enabled |
| `showTurnDuration` | boolean | Show turn duration |
| `diffTool` | string | Diff tool |
| `env` | object | Persistent env variables |
| `tipsHistory` | object | Tips history |
| `todoFeatureEnabled` | boolean | TODO feature enabled |
| `showExpandedTodos` | boolean | Show expanded TODOs |
| `messageIdleNotifThresholdMs` | number | Idle notification threshold |
| `autoConnectIde` | boolean | Auto-connect IDE |
| `autoInstallIdeExtension` | boolean | Auto-install IDE extension |
| `fileCheckpointingEnabled` | boolean | Checkpointing enabled |
| `terminalProgressBarEnabled` | boolean | Terminal progress bar |
| `showStatusInTerminalTab` | boolean | Show status in terminal tab |
| `taskCompleteNotifEnabled` | boolean | Task complete notification |
| `inputNeededNotifEnabled` | boolean | Input needed notification |
| `agentPushNotifEnabled` | boolean | Agent push notification |
| `respectGitignore` | boolean | Respect .gitignore |
| `claudeInChromeDefaultEnabled` | boolean | Claude in Chrome default |
| `hasCompletedClaudeInChromeOnboarding` | boolean | Chrome onboarding completed |
| `lspRecommendationDisabled` | boolean | Disable LSP recommendation |
| `lspRecommendationNeverPlugins` | array | Never-recommended plugins |
| `lspRecommendationIgnoredCount` | number | Ignored count |
| `copyFullResponse` | boolean | Copy full response |
| `copyOnSelect` | boolean | Copy on select |
| `permissionExplainerEnabled` | boolean | Permission explainer enabled |
| `prStatusFooterEnabled` | boolean | PR status footer enabled |
| `remoteControlAtStartup` | boolean | Remote control at startup |
| `remoteDialogSeen` | boolean | Remote dialog seen |

---

## 16. Project Config Keys

Project-specific settings (stored per path):

| Key | Type | Description |
|-----|------|-------------|
| `allowedTools` | array | Allowed tools |
| `mcpContextUris` | array | MCP context URIs |
| `mcpServers` | object | MCP server configuration |
| `hasTrustDialogAccepted` | boolean | Trust dialog accepted |
| `hasCompletedProjectOnboarding` | boolean | Project onboarding completed |
| `projectOnboardingSeenCount` | number | Onboarding seen count |
| `hasClaudeMdExternalIncludesApproved` | boolean | External includes approved |
| `hasClaudeMdExternalIncludesWarningShown` | boolean | External includes warning shown |
| `enabledMcpjsonServers` | array | Enabled MCP.json servers |
| `disabledMcpjsonServers` | array | Disabled MCP.json servers |
| `enableAllProjectMcpServers` | boolean | Enable all project MCP servers |
| `disabledMcpServers` | array | Disabled MCP servers |
| `enabledMcpServers` | array | Enabled MCP servers |
| `activeWorktreeSession` | object | Active worktree session |
| `remoteControlSpawnMode` | string | Spawn mode (same-dir/worktree) |
| `exampleFiles` | array | Example files |
| `exampleFilesGeneratedAt` | number | Generation timestamp |

---

## Complete .env File Example

```bash
# ===== OpenAI Provider (Required for OpenWork) =====
CLAUDE_CODE_USE_OPENAI=1
OPENAI_API_KEY=your-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-5.2

# ===== Alternative: Together AI =====
# OPENAI_BASE_URL=https://api.together.xyz/v1
# OPENAI_MODEL=moonshotai/Kimi-K2.5

# ===== Alternative: Local Ollama =====
# OPENAI_BASE_URL=http://localhost:11434/v1
# OPENAI_MODEL=llama3.3:70b

# ===== Telemetry and Observability =====
CLAUDE_CODE_ENABLE_TELEMETRY=1
ENABLE_BETA_TRACING_DETAILED=1

# Langfuse OTLP
BETA_TRACING_ENDPOINT=https://us.cloud.langfuse.com/api/public/otel
OTEL_EXPORTER_OTLP_HEADERS=Authorization="Basic base64encoded"
LANGFUSE_SECRET_KEY=sk-lf-...
LANGFUSE_PUBLIC_KEY=pk-lf-...
LANGFUSE_BASE_URL=https://us.cloud.langfuse.com

# Content logging
OTEL_LOG_USER_PROMPTS=1
OTEL_LOG_TOOL_CONTENT=1

# ===== Other Providers (alternatives) =====
# GROQ_API_KEY=gsk_...
# GEMINI_API_KEY=AIzaSy...
# GOOGLE_API_KEY=AIzaSy...

# ===== Features =====
CLAUDE_CODE_ENABLE_TASKS=1
CLAUDE_CODE_ENABLE_XAA=1

# ===== Optional disables =====
# CLAUDE_CODE_DISABLE_FAST_MODE=1
# CLAUDE_CODE_DISABLE_AUTO_MEMORY=1
```

---

## System Constants Reference

### Notification Channels

```typescript
['auto', 'iterm2', 'iterm2_with_bell', 'terminal_bell', 'kitty', 'ghostty', 'notifications_disabled']
```

### Editor Modes

```typescript
['normal', 'vim']
```

### Teammate Modes

```typescript
['auto', 'tmux', 'in-process']
```

---

*Documentation generated for OpenWork v0.1.4*
