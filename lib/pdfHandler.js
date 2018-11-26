import AWS from 'aws-sdk'
import doDownload from './doDownload'

const s3    = new AWS.S3()
const debug = require('debug')('lambda-pdfxs3')

/**
 * Handle s3 submission event
 *
 * @param  object     event
 * @param  object     context
 * @param  Function   callback
 */
export default (event, context, callback) => {
  debug(JSON.stringify(event))
  const s3Object = event.Records[0].s3
  const params = {
    Bucket: s3Object.bucket.name,
    Key: decodeURIComponent(s3Object.object.key.replace( /\+/g, ' ' )),
    Expires: 600
  }
  const url = s3signer.getSignedUrl( 'getObject', params )
  let basePath = path.dirname( '/' + key )
  const params = {
    url: url,
    dpi: 72,
    dest: `${bucket}${basePath}`
  }
  event.queryStringParameters = params
  doDownload(event, context, callback)
};
