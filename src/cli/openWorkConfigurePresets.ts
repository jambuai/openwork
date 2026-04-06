import { DEFAULT_OPENAI_BASE_URL } from '../services/api/providerConfig.js'

export type OpenWorkConfigurePreset = {
  id: string
  label: string
  baseUrl: string
  models: string[]
  keyHint: string
}

export const OPENWORK_CONFIGURE_PRESETS: OpenWorkConfigurePreset[] = [
  {
    id: 'openai',
    label: 'OpenAI',
    baseUrl: DEFAULT_OPENAI_BASE_URL,
    models: ['gpt-5.2', 'gpt-5-mini', 'o4-mini'],
    keyHint: 'Create a key at https://platform.openai.com/api-keys',
  },
  {
    id: 'ollama',
    label: 'Ollama (local)',
    baseUrl: 'http://localhost:11434/v1',
    models: ['llama3.1:8b', 'llama3.2:3b', 'qwen2.5-coder:7b'],
    keyHint: 'No API key needed for the default local URL.',
  },
  {
    id: 'deepseek',
    label: 'DeepSeek',
    baseUrl: 'https://api.deepseek.com/v1',
    models: ['deepseek-chat', 'deepseek-coder'],
    keyHint: 'Keys at https://platform.deepseek.com/',
  },
  {
    id: 'openrouter',
    label: 'OpenRouter',
    baseUrl: 'https://openrouter.ai/api/v1',
    models: ['openai/gpt-5.2', 'anthropic/claude-sonnet-4', 'google/gemini-2.5-pro-preview-03-25'],
    keyHint: 'Keys at https://openrouter.ai/keys',
  },
  {
    id: 'custom',
    label: 'Custom base URL',
    baseUrl: '',
    models: [],
    keyHint: 'Use any OpenAI-compatible Chat Completions endpoint.',
  },
]
