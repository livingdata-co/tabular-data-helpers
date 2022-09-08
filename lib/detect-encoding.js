import chardet from 'chardet'

const ENCODING_TO_DETECT = new Set([
  'UTF-8',
  'ISO-8859-1',
  'ISO-8859-15',
  'windows-1252'
])

const DEFAULT_ENCODING = 'UTF-8'

export function selectEncoding(result) {
  const candidate = result.find(r => ENCODING_TO_DETECT.has(r.name))

  if (candidate) {
    return candidate.name
  }

  return DEFAULT_ENCODING
}

export function detectEncoding(buffer) {
  const result = chardet.analyse(buffer, {sampleSize: 1_000_000})
  return selectEncoding(result)
}

export default detectEncoding
