import path from 'path'
import AWS from 'aws-sdk'
import doDownload from './doDownload'
import Debug from 'debug'

const debug = Debug('lambda-pdfxs3')
const s3    = new AWS.S3()

/**
 * Handle s3 event
 *
 * @param  object     event
 */
export default async (event) => {
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
