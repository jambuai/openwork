/**
 * Project directory names under which OpenWork loads `skills/` and `commands/`
 * markdown trees using the same layout as `.claude/` (skill-name/SKILL.md, etc.).
 *
 * Used for interoperability when a repo (or home dir) is shared across Claude
 * Code, Cursor, Codex (`.agents/skills` per OpenAI docs), and Gemini CLI
 * (`.agents` primary, `.gemini` alias).
 *
 * Order matters: `.claude` first (native), then other tools. Keep in sync with
 * watch lists, sandbox denyWrite for skills, and permission skill-scope logic.
 */
export const AGENT_PROJECT_CONFIG_ROOTS = [
  '.claude',
  '.cursor',
  '.agents',
  '.gemini',
] as const

export type AgentProjectConfigRoot = (typeof AGENT_PROJECT_CONFIG_ROOTS)[number]
