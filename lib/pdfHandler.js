import AWS from 'aws-sdk'

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
    Key: s3Object.object.key,
  }

}
