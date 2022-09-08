import {readFileSync} from 'node:fs'
import test from 'ava'

import {previewCsvFromBuffer} from '../lib/csv.js'

test('detecting CSV/UTF-8', async t => {
  const path = new URL('fixtures/sample-utf8.csv', import.meta.url)
  const buffer = readFileSync(path)
  const result = await previewCsvFromBuffer(buffer)
  t.deepEqual(result, {
    format: 'csv',
    formatOptions: {
      encoding: 'UTF-8',
      delimiter: ',',
      linebreak: '\n',
      quoteChar: '"'
    },
    columns: ['foo', 'bar', 'baz'],
    rows: [
      {foo: 'Île de Ré', bar: 'Manhattan', baz: 'Bali'}
    ]
  })
})

test('detecting CSV/ISO-8859-1', async t => {
  const path = new URL('fixtures/sample-latin1.csv', import.meta.url)
  const buffer = readFileSync(path)
  const result = await previewCsvFromBuffer(buffer)
  t.deepEqual(result, {
    format: 'csv',
    formatOptions: {
      encoding: 'ISO-8859-1',
      delimiter: ',',
      linebreak: '\n',
      quoteChar: '"'
    },
    columns: ['foo', 'bar', 'baz'],
    rows: [
      {foo: 'Île de Ré', bar: 'Manhattan', baz: 'Bali'}
    ]
  })
})

test('parsing invalid CSV', async t => {
  const path = new URL('fixtures/sample-invalid.csv', import.meta.url)
  const buffer = readFileSync(path)
  const result = await previewCsvFromBuffer(buffer)
  t.deepEqual(result, {
    format: 'csv',
    formatOptions: {
      encoding: 'ISO-8859-1',
      delimiter: ',',
      linebreak: '\n',
      quoteChar: '"'
    },
    parseErrors: ['TooManyFields']
  })
})
