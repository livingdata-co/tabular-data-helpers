import Papa from 'papaparse'
import iconv from './iconv.js'
import createAutoDecodeStream from './auto-decode-stream.js'
import blobToReadableStream from './blob-readable-stream.js'

const ALLOWED_ENCODING = new Set([
  'UTF-8',
  'ISO-8859-1',
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

export async function previewCsvFromStream(inputStream, options = {}) {
  const formatOptions = parseCsvOptions(options.formatOptions)

  let {encoding} = formatOptions
  const {linebreak, delimiter, quoteChar} = formatOptions

  const decodeStream = encoding
    ? iconv.decodeStream(encoding)
    : createAutoDecodeStream({
      onEncoding(detectedEncoding) {
        encoding = detectedEncoding
      }
    })

  const decodedStream = inputStream.pipe(decodeStream)

  return new Promise((resolve, reject) => {
    Papa.parse(decodedStream, {
      delimiter: delimiter || '',
      newline: linebreak || '',
      quoteChar,
      header: true,
      preview: options.previewCount || 10,
      complete({meta, data, errors}) {
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
