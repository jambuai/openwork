import { describe, expect, test } from 'bun:test'
import {
  extractOpenWorkProviderCli,
  parseOpenWorkModelToken,
} from './openworkProviderStore.js'

describe('parseOpenWorkModelToken', () => {
  test('splits provider prefix', () => {
    expect(parseOpenWorkModelToken('openai/GPT-5.2')).toEqual({
      namespace: 'openai',
      modelId: 'GPT-5.2',
    })
    expect(parseOpenWorkModelToken('ollama/llama3.1:8b')).toEqual({
      namespace: 'ollama',
      modelId: 'llama3.1:8b',
    })
  })

  test('returns null without slash', () => {
    expect(parseOpenWorkModelToken('gpt-5.2')).toBeNull()
    expect(parseOpenWorkModelToken('')).toBeNull()
  })
})

describe('extractOpenWorkProviderCli', () => {
  test('strips namespaced model and flags', () => {
    const { argvOut, parsed } = extractOpenWorkProviderCli([
      '--model',
      'openai/gpt-5.2',
      '--apiKey=sk-test',
      '--baseUrl=',
      'extra',
    ])
    expect(parsed.model).toBe('gpt-5.2')
    expect(parsed.modelNamespace).toBe('openai')
    expect(parsed.apiKey).toBe('sk-test')
    expect(parsed.baseUrl).toBe('')
    expect(argvOut).toEqual(['extra'])
  })

  test('keeps plain --model for commander', () => {
    const { argvOut, parsed } = extractOpenWorkProviderCli([
      '--model',
      'sonnet',
    ])
    expect(parsed.consumedOpenWorkModel).toBe(false)
    expect(argvOut).toEqual(['--model', 'sonnet'])
  })

  test('supports kebab api-key', () => {
    const { argvOut, parsed } = extractOpenWorkProviderCli([
      '--api-key',
      'k',
      'run',
    ])
    expect(parsed.apiKey).toBe('k')
    expect(argvOut).toEqual(['run'])
  })
})
