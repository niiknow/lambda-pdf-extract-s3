import doDownload from './doDownload'
import res from './response'

const debug = require('debug')('lambda-pdfxs3')

/**
 * Handle s3 event
 *
 * @param  object     event
 * @param  object     context
 * @param  Function   callback the callback
 */
export default (event, context, callback) => {
  debug('Being event handling', JSON.stringify(event))
  const rspHandler = res(context, callback)

  return new Promise((resolve) => {
    doDownload(event, (msg, code) => {
      rspHandler(msg, code)
      resolve(msg)
    })
  })
}
