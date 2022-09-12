import iconv from 'iconv-lite'
import stream from 'readable-stream'

export * from 'iconv-lite'
export {default} from 'iconv-lite'

iconv.enableStreamingAPI(stream)
