/* eslint-disable n/no-unsupported-features/node-builtins */
import {Blob} from 'node:buffer'

import test from 'ava'
import {getStreamAsBuffer} from 'get-stream'

import {blobToReadableStream} from '../lib/blob-readable-stream.js'

test('blobToReadableStream', async t => {
  const blob = new Blob([new Uint8Array([1, 2, 3, 4])], {type: 'application/octet-binary'})
  const readable = blobToReadableStream(blob, 1)
  const buffer = await getStreamAsBuffer(readable)
  t.true(buffer.equals(new Uint8Array([1, 2, 3, 4])))
})
