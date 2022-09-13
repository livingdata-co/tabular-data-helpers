import {createReadStream} from 'node:fs'
import test from 'ava'

import {previewCsvFromStream, validateCsvFromStream} from '../lib/csv.js'

test('detecting CSV/UTF-8', async t => {
  const path = new URL('fixtures/sample-utf8.csv', import.meta.url)
  const inputStream = createReadStream(path)
  const result = await previewCsvFromStream(inputStream)
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
  const inputStream = createReadStream(path)
  const result = await previewCsvFromStream(inputStream)
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
  const inputStream = createReadStream(path)
  const result = await previewCsvFromStream(inputStream)
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

test('validate CSV file / valid', async t => {
  const path = new URL('fixtures/sample-utf8.csv', import.meta.url)
  const inputStream = createReadStream(path)

  await new Promise(resolve => {
    const emitter = validateCsvFromStream(inputStream)

    emitter.once('complete', result => {
      t.true(result.isValid)
      resolve()
    })
  })
})

test('validate CSV file / corrupted', t => {
  const path = new URL('fixtures/sample-invalid.csv', import.meta.url)
  const inputStream = createReadStream(path)

  return new Promise(resolve => {
    const emitter = validateCsvFromStream(inputStream)

    emitter.once('error', error => {
      t.is(error.message, 'Error in CSV file: TooManyFields')
      resolve()
    })
  })
})
