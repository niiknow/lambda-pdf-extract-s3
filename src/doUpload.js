import fs from 'fs'
import AWS from 'aws-sdk'

const s3                = new AWS.S3()
const asynk             = require( 'async' )
const recursiveReadSync = require( 'recursive-readdir-sync' )


const debug = require('debug')('lambda-pdfxs3')
const cfg = {
  basepath: '/tmp/pdf',
  bucket: 'brick-web'
}

export default async ( event, callback ) => {
  let files = [],
    rstFiles = []

  try {
    files = recursiveReadSync( `${cfg.basepath}/` )
  } catch ( err ) {
    files = []
    return callback( err )
  }
  debug( 'files: ', files.length )

  if ( files.length <= 0 ) {
    return callback('Unable to locate any files.')
  }

  debug( 'begin upload to bucket: ', cfg.bucket )

  const q = asynk.queue( ( f, cb ) => {
    const myKey = f.replace( '/tmp/', '' )
    const myParms = {
      Bucket: cfg.bucket,
      Key: myKey,
      Body: fs.createReadStream(f)
    }

    debug(`uploading: ${myKey}`)

    s3.upload(myParms, cb)
    rstFiles.push( myKey )
  }, 10 );

  q.drain(( err ) => {
    if ( err ) {
      return callback( err )
    }

    const rst = {
      success: true,
      path: event.dest.replace( `${cfg.basepath}/`, '' ),
      files: rstFiles
    }

    callback( null, JSON.stringify( rst, null, 2 ) )
  })

  // assign an error callback
  q.error((err, task) => {
    const rst = {
      success: false,
      path: event.dest.replace( '/tmp/', '' ),
      files: rstFiles
    }

    callback( err )
  });

  files.forEach((v) => {
    if (v.toLowerCase().indexOf('.ds_store') < 0) {
      q.push( v )
    }
  })
}
