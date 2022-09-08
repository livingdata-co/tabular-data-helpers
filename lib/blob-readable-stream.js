import {Buffer} from 'node:buffer'
import {Readable} from 'node:stream'

export function blobToReadableStream(blob, chunkSize = 64 * 1024) {
  let offset = 0

  return new Readable({
    async read() {
      if (offset > blob.size) {
        this.push(null)
        return
      }

      const sub = blob.slice(offset, offset + chunkSize)
      const chunk = await sub.arrayBuffer()
      offset += chunkSize
      this.push(Buffer.from(chunk))
    }
  })
}
