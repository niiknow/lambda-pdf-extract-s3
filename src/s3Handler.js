import path from 'path'
import AWS from 'aws-sdk'
import doDownload from './doDownload'

const s3    = new AWS.S3()
const debug = require('debug')('lambda-pdfxs3')

/**
 * Handle s3 event
 *
 * @param  object     event
 * @param  object     context
 */
export default async (event, context) => {
  debug('Begin event...', JSON.stringify(event))
  const s3Object   = event.Records[0].s3
  const bucket     = s3Object.bucket.name
  const key        = decodeURIComponent(s3Object.object.key.replace( /\+/g, ' ' ))
  const basePath   = path.dirname(key)
  const params     = {
    Bucket: bucket,
    Key: key,
    Expires: 600
  }

  event.queryStringParameters = {
    url: s3.getSignedUrl('getObject', params ),
    dpi: 95,
    scaleWidth: 1400,
    dest: process.env.DESTBUCKET === bucket ? `${basePath}` : `pdf/${bucket}/${basePath}`
  }

  const rst = await doDownload(event)

  return rst
}
