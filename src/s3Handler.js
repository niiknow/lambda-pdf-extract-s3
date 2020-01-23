import path from 'path'
import AWS from 'aws-sdk'
import doDownload from './doDownload'
import res from './response'

const s3    = new AWS.S3()
const debug = require('debug')('lambda-pdfxs3')

/**
 * Handle s3 event
 *
 * @param  object     event
 * @param  object     context
 * @param  Function   callback the callback
 */
export default (event, context, callback) => {
  debug('Begin event...', JSON.stringify(event, null, 2))
  const rspHandler = res(context, callback)
  const s3Object   = event.Records[0].s3
  const bucket     = s3Object.bucket.name
  const key        = decodeURIComponent(s3Object.object.key.replace( /\+/g, ' ' ))
  const basePath   = path.dirname( '/' + key )
  const params     = {
    Bucket: bucket,
    Key: key,
    Expires: 600
  }

  event.queryStringParameters = {
    url: s3.getSignedUrl('getObject', params ),
    dpi: 72,
    dest: `pdf/${bucket}${basePath}`
  }

  return new Promise((resolve) => {
    doDownload(event, (msg, code) => {
      rspHandler(msg, code)
      resolve(msg)
    })
  })
}
