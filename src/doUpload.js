import fs from 'fs'
import path from 'path'
import AWS from 'aws-sdk'
import mime from 'mime-types'
import asynk from 'async'
import recursiveReadSync from 'recursive-readdir-sync'
import Debug from 'debug'

const debug = Debug('lambda-pdfxs3')

const s3                = new AWS.S3()
const cfg = {
  localpath: (process.env.LOCALPATH || '/tmp/pdf').replace(/\/+$/, ''),
  bucket: process.env.DESTBUCKET
}

export default async ( event, callback ) => {
  let files = [],
    rstFiles = []

  debug('Starting upload process...', JSON.stringify(event))

  try {
    files = recursiveReadSync( `${event.local}` )
  } catch ( err ) {
    files = []
    return callback( err )
  }
  debug('Files count...', files.length )

  if ( files.length <= 0 ) {
    return callback('Unable to locate any files.')
  }

  debug('Begin upload to bucket...', cfg.bucket)

  const q = asynk.queue( ( f, cb ) => {
    const myKey = `${event.dest}/${path.basename(f)}`
    const myParms = {
      Bucket: cfg.bucket,
      Key: myKey,
      Body: fs.createReadStream(f)
    }

    const contentType = mime.lookup(myKey)
    if (typeof(contentType) === 'string') {
      myParms.ContentType = contentType
    }

    debug(`Uploading to ${cfg.bucket}@${myKey}`)

    s3.upload(myParms, cb)
    rstFiles.push(myKey)
  }, 10 );

  q.drain((err) => {
    if (err) {
      return callback( err )
    }

    const rst = {
      success: true,
      path: `${event.dest}${process.env.PREPENDPATH}`,
      files: rstFiles
    }

    callback(null, JSON.stringify(rst))
  })

  // assign an error callback
  q.error(callback);

  files.forEach((v) => {
    if (v.toLowerCase().indexOf('.ds_store') < 0) {
      q.push(v)
    }
  })
}
