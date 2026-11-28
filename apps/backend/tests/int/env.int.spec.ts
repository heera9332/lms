import { getEnv } from '@lms/env'
import { afterEach, describe, expect, it } from 'vitest'

describe('getEnv', () => {
  const original = { ...process.env }

  afterEach(() => {
    process.env = { ...original }
  })

  it('returns existing string values and falls back when missing or empty', () => {
    process.env.TEST_STR = 'hello'
    expect(getEnv('TEST_STR')).toBe('hello')
    expect(getEnv('TEST_STR', 'fallback')).toBe('hello')

    delete process.env.TEST_MISSING
    expect(getEnv('TEST_MISSING')).toBeUndefined()
    expect(getEnv('TEST_MISSING', 'fallback')).toBe('fallback')

    process.env.TEST_EMPTY = ''
    expect(getEnv('TEST_EMPTY')).toBeUndefined()
    expect(getEnv('TEST_EMPTY', 'fallback')).toBe('fallback')
  })

  it('parses numbers and falls back on invalid values', () => {
    process.env.TEST_NUM = '5432'
    expect(getEnv('TEST_NUM', 3000)).toBe(5432)

    process.env.TEST_NUM_BAD = 'abc'
    expect(getEnv('TEST_NUM_BAD', 3000)).toBe(3000)

    delete process.env.TEST_NUM_MISSING
    expect(getEnv('TEST_NUM_MISSING', 465)).toBe(465)
  })

  it('parses booleans and falls back on unrecognized values', () => {
    process.env.TEST_BOOL_T = 'true'
    process.env.TEST_BOOL_1 = '1'
    process.env.TEST_BOOL_F = 'FALSE'
    process.env.TEST_BOOL_0 = '0'
    process.env.TEST_BOOL_BAD = 'maybe'

    expect(getEnv('TEST_BOOL_T', false)).toBe(true)
    expect(getEnv('TEST_BOOL_1', false)).toBe(true)
    expect(getEnv('TEST_BOOL_F', true)).toBe(false)
    expect(getEnv('TEST_BOOL_0', true)).toBe(false)
    expect(getEnv('TEST_BOOL_BAD', true)).toBe(true)
    expect(getEnv('TEST_BOOL_MISSING', false)).toBe(false)
  })
})
