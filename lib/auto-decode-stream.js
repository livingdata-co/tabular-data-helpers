import {Buffer} from 'buffer'
import {Transform} from 'readable-stream'
import iconv from './iconv.js'
import detectEncoding from './detect-encoding.js'

export function createAutoDecodeStream(options = {}) {
  const onEncoding = options.onEncoding || (() => {})
  const detectionBufferSize = options.detectionBufferSize || 1024 * 1024 // 1 Megabyte

  let bufferedChunks = []
  let bufferedChunksSize = 0
  let decodeStream
  let flushCb

  function triggerDetection() {
    const buffer = Buffer.concat(bufferedChunks)
    const encoding = detectEncoding(buffer)
    onEncoding(encoding)
    bufferedChunks = null
    return {buffer, encoding}
  }

  return new Transform({
    transform(chunk, enc, cb) {
      if (decodeStream) {
        decodeStream.write(chunk)
        return cb()
      }

      if (bufferedChunksSize < detectionBufferSize) {
        bufferedChunks.push(chunk)
        bufferedChunksSize += chunk.length
        return cb()
      }

      const {buffer, encoding} = triggerDetection()
      this.emit('encoding', encoding)

      decodeStream = iconv.decodeStream(encoding)
      decodeStream.on('data', decodedChunk => this.push(decodedChunk))
      decodeStream.on('error', error => this.emit('error', error))
      decodeStream.on('end', () => flushCb())

      decodeStream.write(buffer)
      cb()
    },

    flush(cb) {
      if (decodeStream) {
        decodeStream.end()
        flushCb = cb
      } else if (bufferedChunks.length > 0) {
        const {buffer, encoding} = triggerDetection()
        this.emit('encoding', encoding)
        const decodedBuffer = iconv.decode(buffer, encoding)
        this.push(decodedBuffer)
        cb()
      } else {
        cb()
      }
    }
  })
}

export default createAutoDecodeStream
