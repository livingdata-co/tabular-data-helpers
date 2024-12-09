import EventEmitter from 'events'

import {Transform} from 'readable-stream'
import Papa from 'papaparse'
import pumpify from 'pumpify'

import iconv from './iconv.js'
import createAutoDecodeStream from './auto-decode-stream.js'
import blobToReadableStream from './blob-readable-stream.js'

const ALLOWED_ENCODING = new Set([
  'UTF-8',
  'ISO-8859-1',
  'ISO-8859-15',
  'windows-1252'
])

const ALLOWED_LINEBREAK = new Set([
  '\n',
  '\r\n',
  '\r'
])

const ALLOWED_DELIMITER = new Set([
  ',',
  ';',
  '\t',
  '|'
])

const ALLOWED_QUOTE_CHAR = new Set([
  '"',
  '\'\''
])

export const supportedOptions = {
  encoding: [...ALLOWED_ENCODING],
  linebreak: [...ALLOWED_LINEBREAK],
  delimiter: [...ALLOWED_DELIMITER],
  quoteChar: [...ALLOWED_QUOTE_CHAR]
}

function parseCsvOptions(formatOptions = {}) {
  if (formatOptions.encoding && !ALLOWED_ENCODING.has(formatOptions.encoding)) {
    throw new Error('encoding not supported: ' + formatOptions.encoding)
  }

  if (formatOptions.linebreak && !ALLOWED_LINEBREAK.has(formatOptions.linebreak)) {
    throw new Error('linebreak not supported: ' + formatOptions.linebreak)
  }

  if (formatOptions.delimiter && !ALLOWED_DELIMITER.has(formatOptions.delimiter)) {
    throw new Error('delimiter not supported: ' + formatOptions.delimiter)
  }

  if (formatOptions.quoteChar && !ALLOWED_QUOTE_CHAR.has(formatOptions.quoteChar)) {
    throw new Error('quoteChar not supported: ' + formatOptions.quoteChar)
  }

  return {
    ...formatOptions,
    quoteChar: formatOptions.quoteChar || '"'
  }
}

function prepareCsvParser(formatOptions) {
  const {encoding, linebreak, delimiter, quoteChar} = parseCsvOptions(formatOptions)

  const decodeStream = encoding
    ? iconv.decodeStream(encoding)
    : createAutoDecodeStream()

  const parserOptions = {
    delimiter: delimiter || '',
    newline: linebreak || '',
    quoteChar,
    header: true
  }

  return {encoding, linebreak, delimiter, quoteChar, decodeStream, parserOptions}
}

export async function previewCsvFromStream(inputStream, options = {}) {
  const preparedCsvParser = prepareCsvParser(options.formatOptions)

  const {linebreak, delimiter, quoteChar, decodeStream, parserOptions} = preparedCsvParser
  let {encoding} = preparedCsvParser

  if (!encoding) {
    decodeStream.once('encoding', detectedEncoding => {
      encoding = detectedEncoding
    })
  }

  return new Promise((resolve, reject) => {
    Papa.parse(inputStream.pipe(decodeStream), {
      ...parserOptions,
      preview: options.previewCount || 10,
      complete({meta, data, errors}) {
        inputStream.destroy()
        errors = filterErrors(errors)

        const response = {
          format: 'csv',
          formatOptions: {
            encoding,
            delimiter: delimiter || meta.delimiter,
            linebreak: linebreak || meta.linebreak,
            quoteChar
          }
        }

        const parseErrors = [...new Set(errors.map(error => error.code))].sort()

        if (parseErrors.length > 0) {
          response.parseErrors = parseErrors
        } else {
          response.columns = meta.fields
          response.rows = data
        }

        resolve(response)
      },
      error(error) {
        reject(error)
      }
    })
  })
}

export async function previewCsvFromBlob(blob, options = {}) {
  const inputStream = blobToReadableStream(blob)
  return previewCsvFromStream(inputStream, options)
}

export function validateCsvFromStream(inputStream, options = {}) {
  const preparedCsvParser = prepareCsvParser(options.formatOptions)

  const {decodeStream, parserOptions} = preparedCsvParser

  const emitter = new EventEmitter()
  emitter.readRows = 0
  emitter.readBytes = 0
  emitter.totalBytes = inputStream.totalBytes

  const preparedInputStream = inputStream
    .pipe(new Transform({
      transform(chunk, enc, cb) {
        emitter.readBytes += chunk.length
        cb(null, chunk)
      },
      decodeStrings: false
    }))
    .pipe(decodeStream)

  Papa.parse(preparedInputStream, {
    ...parserOptions,

    chunkSize: 1024 * 1024,

    chunk({data, errors}, parser) {
      errors = filterErrors(errors)

      if (errors.length > 0) {
        emitter.emit('error', new Error('Error in CSV file: ' + errors[0].code))
        emitter.removeAllListeners()
        parser.abort()
        return
      }

      emitter.readRows += data.length

      emitter.emit('progress', {
        readRows: emitter.readRows,
        readBytes: emitter.readBytes,
        totalBytes: emitter.totalBytes
      })
    },

    complete() {
      emitter.emit('complete', {
        readRows: emitter.readRows,
        readBytes: emitter.readBytes,
        totalBytes: emitter.totalBytes,
        isValid: true
      })

      emitter.removeAllListeners()
    },

    error(error) {
      emitter.emit('error', error)
      emitter.removeAllListeners()
    }
  })

  emitter.abort = () => {
    emitter.emit('abort')
    emitter.removeAllListeners()
  }

  return emitter
}

export function validateCsvFromBlob(blob, options = {}) {
  const inputStream = blobToReadableStream(blob)
  return validateCsvFromStream(inputStream, options)
}

export function createCsvReadStream(options = {}) {
  const {decodeStream, parserOptions} = prepareCsvParser(options.formatOptions)

  return pumpify.obj(
    decodeStream,
    Papa.parse(Papa.NODE_STREAM_INPUT, parserOptions)
  )
}

/* Helpers */

function filterErrors(errors) {
  return errors.filter(error => error.code !== 'UndetectableDelimiter')
}
