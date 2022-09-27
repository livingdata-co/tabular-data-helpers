import {Buffer} from 'buffer'
import {Readable} from 'readable-stream'

export function blobToReadableStream(blob, chunkSize = 64 * 1024) {
  let offset = 0

  const readable = new Readable({
    async read() {
      if (offset >= blob.size) {
        this.push(null)
        return
      }

      const sub = blob.slice(offset, offset + chunkSize)
      const chunk = await sub.arrayBuffer()
      const buffer = Buffer.from(chunk)
      offset += chunkSize
      this.readBytes = offset
      this.push(buffer)
    }
  })

  readable.readBytes = 0
  readable.totalBytes = blob.size

  return readable
}

export default blobToReadableStream
