const asynk             = require( 'async' )
const recursiveReadSync = require( 'recursive-readdir-sync' )

const debug = require('debug')('lambda-pdfxs3')

export default async ( event, context, callback ) => {
  const files = [], rstFiles = []

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

  debug( 'begin upload to bucket: ', cfg.bucket );

  const s3 = require( './s3.js' );
  const q = asynk.queue( function ( f, cb ) {
    var myKey = f.replace( '/tmp/', '' );

    rstFiles.push( myKey );
    // console.log( 'uploading: ', f, cfg.bucket );
    s3.upload( cfg.bucket, myKey, f, cb );
  }, 10 );

  q.drain = ( err, results ) => {
    console.log( 'end upload to bucket: ', cfg.bucket );

    if ( err ) {
      callback( err );
      return;
    }

    var rst = {
      success: true,
      path: event.dest.replace( '/tmp/', '' ),
      files: rstFiles
    };

    callback( null, JSON.stringify( rst, null, 2 ) );
  };

  for ( var i = 0; i < files.length; i++ ) {
    q.push( files[ i ] );
  }
}
