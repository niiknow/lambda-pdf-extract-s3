import fs from 'fs'
import path from 'path'
import got from 'got'
import urlParse from 'url'
import mkdirp from 'mkdirp'

import doUpload from './doUpload'
import doTransform from './doTransform'

const debug = require('debug')('lambda-pdfxs3')

const cfg = {
  basepath: '/tmp/pdf',
  cmd: './index.sh'
}

export default ( event, callback ) => {
  const params = event.queryStringParameters || {}

  if ( !/^(http|https):\/\//gmi.test( params.url ) ) {
    return context.fail( 'URL is invalid.' )
  }

  params.dpi = parseInt( params.dpi || 72 )
  params.width = parseInt( params.width || 1600 )

  const opt        = urlParse.parse( params.url, true )
  const pathName   = decodeURIComponent( opt.pathname )

  let destPath   = path.dirname( pathName )

  const fileName   = pathName.replace( destPath + '/', '' )
  const legacyName = path.basename( fileName ).toLowerCase().replace('.pdf', '')

  params.dest = ( params.dest || destPath ) + ''

  // prefix with basepath: /tmp/pdf
  destPath = `${cfg.basepath}/${params.dest}`

  // use pdf file name as path and download as index.pdf
  params.dest = `${destPath}/${fileName}/`.replace( '.pdf', '/' ).replace( /\/+/gi, '/' )

  // generate shell exec string
  params.cmd = `"${cfg.cmd}" "${params.dpi}" "${params.dest}" ${params.width} "${legacyName}.jpg"`

  // make directory before download
  mkdirp.sync( params.dest )

  debug(params)

  got.stream(params.url)
    .pipe(fs.createWriteStream(params.dest + 'index.pdf'))
    .on('close', async () => {
      try {
        await doTransform(params)

        // do upload if no error
        doUpload( params, ( err ) => {
          if (err) {
            debug( 'Error during upload', err )
            return callback( 'Error during uploading.', 422 )
          }

          return callback( 'Success.', 200 )
        })
      } catch(e) {
        debug( 'Error during transform', e )
        return callback( 'Error during transform.', 422 )
      }
    })

}
