import AWS from 'aws-sdk'

const s3                = new AWS.S3()
const asynk             = require( 'async' )
const recursiveReadSync = require( 'recursive-readdir-sync' )


const debug = require('debug')('lambda-pdfxs3')
const cfg = {
  basepath: '/tmp/pdf',
  bucket: process.env.DESTBUCKET || process.env.FROMBUCKET
}

export default async ( event, context, callback ) => {
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
    const myKey   = f.replace( '/tmp/', '' )
    const myParms = {
      Bucket: cfg.bucket,
      Key: myKey,
      Body: f
    }

    s3.upload(myParms, cb)
    rstFiles.push( myKey )
  }, 10 );

  q.drain = ( err ) => {
    if ( err ) {
      return callback( err )
    }

    var rst = {
      success: true,
      path: event.dest.replace( '/tmp/', '' ),
      files: rstFiles
    }

    callback( null, JSON.stringify( rst, null, 2 ) )
  }

  let i = 0
  for( i = 0; i < files.length; i++ ) {
    q.push( files[ i ] )
  }
}
