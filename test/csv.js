import {createReadStream} from 'node:fs'

import test from 'ava'
import {getStreamAsArray} from 'get-stream'

import {previewCsvFromStream, validateCsvFromStream, createCsvReadStream} from '../lib/csv.js'

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
      encoding: 'ISO-8859-15',
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
      encoding: 'ISO-8859-15',
      delimiter: ',',
      linebreak: '\n',
      quoteChar: '"'
    },
    parseErrors: ['TooManyFields']
  })
})

test('validate CSV file / single column', t => {
  const path = new URL('fixtures/single-column.csv', import.meta.url)
  const inputStream = createReadStream(path)

  return new Promise(resolve => {
    const emitter = validateCsvFromStream(inputStream)

    emitter.once('complete', result => {
      t.true(result.isValid)
      resolve()
    })
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

test('read CSV file', async t => {
  const path = new URL('fixtures/sample-utf8.csv', import.meta.url)
  const inputStream = createReadStream(path)
  const readStream = createCsvReadStream()

  const rows = await getStreamAsArray(inputStream.pipe(readStream))
  t.is(rows.length, 1)
  t.deepEqual(rows[0], {foo: 'Île de Ré', bar: 'Manhattan', baz: 'Bali'})
})
