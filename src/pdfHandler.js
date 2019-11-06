import path from 'path'
import AWS from 'aws-sdk'
import doDownload from './doDownload'

const s3    = new AWS.S3()
const debug = require('debug')('lambda-pdfxs3')

/**
 * Handle s3 submission event
 *
 * @param  object     event
 * @param  object     context
 * @param  Function   callback the callback
 */
export default async (event, context, callback) => {
  debug(JSON.stringify(event))
  const s3Object = event.Records[0].s3
  const bucket   = s3Object.bucket.name
  const key      = decodeURIComponent(s3Object.object.key.replace( /\+/g, ' ' ))
  const params = {
    Bucket: s3Object.bucket.name,
    Key: key,
    Expires: 600
  }
  const url      = s3.getSignedUrl('getObject', params )
  const basePath = path.dirname( '/' + key )
  const mysq     = {
    url: url,
    dpi: 72,
    dest: `${bucket}${basePath}`
  }
  event.queryStringParameters = mysq

  await doDownload(event, context, callback)
}
