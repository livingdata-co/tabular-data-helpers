import test from 'ava'
import getStream from 'get-stream'
import intoStream from 'into-stream'
import iconv from 'iconv-lite'

import {createAutoDecodeStream} from '../lib/auto-decode-stream.js'

test('createAutoDecodeStream / ISO-8859-1', async t => {
  let encoding

  const autoDecodeStream = createAutoDecodeStream({
    onEncoding(detectedEncoding) {
      encoding = detectedEncoding
    }
  })

  const decodedString = await getStream(
    intoStream(iconv.encode('éléphant', 'ISO-8859-1'))
      .pipe(autoDecodeStream)
  )

  t.is(encoding, 'ISO-8859-15')
  t.is(decodedString, 'éléphant')
})

test('createAutoDecodeStream / UTF-8', async t => {
  let encoding

  const autoDecodeStream = createAutoDecodeStream({
    onEncoding(detectedEncoding) {
      encoding = detectedEncoding
    }
  })

  const decodedString = await getStream(
    intoStream(iconv.encode('éléphant', 'UTF-8'))
      .pipe(autoDecodeStream)
  )

  t.is(encoding, 'UTF-8')
  t.is(decodedString, 'éléphant')
})
