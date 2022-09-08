import Papa from 'papaparse'
import iconv from 'iconv-lite'
import intoStream from 'into-stream'
import {detectEncoding} from './detect-encoding.js'

const ALLOWED_ENCODING = new Set([
  'UTF-8',
  'ISO-8859-1',
  'windows-1252'
])

const ALLOWED_LINEBREAK = new Set([
  '\n',
  '\r\n'
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

export async function previewCsvFromBuffer(buffer, options = {}) {
  const formatOptions = parseCsvOptions(options.formatOptions)

  const encoding = formatOptions.encoding || detectEncoding(buffer)
  const {linebreak, delimiter, quoteChar} = formatOptions

  const inputStream = intoStream(buffer)
    .pipe(iconv.decodeStream(encoding))

  return new Promise((resolve, reject) => {
    Papa.parse(inputStream, {
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
